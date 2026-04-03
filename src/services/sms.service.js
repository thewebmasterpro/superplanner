/**
 * SMS Service
 *
 * Centralized service for all SMS-related operations (TextLink clone).
 * Manages devices, messages, campaigns, groups, and templates.
 *
 * @module services/sms.service
 */

import pb from '../lib/pocketbase'
import { escapeFilterValue } from '../lib/filterUtils'

class SmsService {
  // ==================== DEVICES ====================

  async getDevices() {
    const user = pb.authStore.model
    if (!user) return []

    return await pb.collection('sms_devices').getFullList({
      filter: `user_id = "${user.id}"`,
      sort: '-created',
      requestKey: null
    })
  }

  async createDevice(data) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    return await pb.collection('sms_devices').create({
      ...this._sanitize(data),
      user_id: user.id,
      status: 'active'
    })
  }

  async updateDevice(id, updates) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const existing = await pb.collection('sms_devices').getOne(id)
    if (existing.user_id !== user.id) throw new Error('Unauthorized')

    return await pb.collection('sms_devices').update(id, this._sanitize(updates))
  }

  async deleteDevice(id) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const existing = await pb.collection('sms_devices').getOne(id)
    if (existing.user_id !== user.id) throw new Error('Unauthorized')

    return await pb.collection('sms_devices').delete(id)
  }

  // ==================== MESSAGES ====================

  async getMessages({ search = '', status = 'all', campaignId = null } = {}) {
    const user = pb.authStore.model
    if (!user) return []

    const filters = [`user_id = "${user.id}"`]

    if (status && status !== 'all') {
      filters.push(`status = "${escapeFilterValue(status)}"`)
    }
    if (campaignId) {
      filters.push(`campaign_id = "${escapeFilterValue(campaignId)}"`)
    }
    if (search) {
      const escaped = escapeFilterValue(search)
      filters.push(`(recipient ~ "${escaped}" || body ~ "${escaped}")`)
    }

    return await pb.collection('sms_messages').getFullList({
      filter: filters.join(' && '),
      sort: '-created',
      requestKey: null
    })
  }

  async getConversations() {
    const user = pb.authStore.model
    if (!user) return []

    const messages = await pb.collection('sms_messages').getFullList({
      filter: `user_id = "${user.id}"`,
      sort: '-created',
      requestKey: null
    })

    // Group by recipient phone number
    const convMap = new Map()
    for (const msg of messages) {
      const phone = msg.recipient
      if (!convMap.has(phone)) {
        convMap.set(phone, {
          phone,
          contact_name: msg.contact_name || phone,
          lastMessage: msg.body,
          lastDate: msg.created,
          direction: msg.direction,
          unread: msg.direction === 'inbound' && !msg.read ? 1 : 0,
          messages: []
        })
      } else {
        const conv = convMap.get(phone)
        if (msg.direction === 'inbound' && !msg.read) {
          conv.unread++
        }
      }
      convMap.get(phone).messages.push(msg)
    }

    return Array.from(convMap.values()).sort(
      (a, b) => new Date(b.lastDate) - new Date(a.lastDate)
    )
  }

  async getConversation(phone) {
    const user = pb.authStore.model
    if (!user) return []

    const escaped = escapeFilterValue(phone)
    return await pb.collection('sms_messages').getFullList({
      filter: `user_id = "${user.id}" && recipient = "${escaped}"`,
      sort: 'created',
      requestKey: null
    })
  }

  async sendMessage(data) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    return await pb.collection('sms_messages').create({
      ...this._sanitize(data),
      user_id: user.id,
      direction: 'outbound',
      status: 'sent',
      sent_at: new Date().toISOString()
    })
  }

  async markAsRead(id) {
    return await pb.collection('sms_messages').update(id, { read: true })
  }

  // ==================== CAMPAIGNS ====================

  async getCampaigns({ status = 'all', search = '' } = {}) {
    const user = pb.authStore.model
    if (!user) return []

    const filters = [`user_id = "${user.id}"`]

    if (status && status !== 'all') {
      filters.push(`status = "${escapeFilterValue(status)}"`)
    }
    if (search) {
      const escaped = escapeFilterValue(search)
      filters.push(`name ~ "${escaped}"`)
    }

    return await pb.collection('sms_campaigns').getFullList({
      filter: filters.join(' && '),
      sort: '-created',
      expand: 'group_id,device_id',
      requestKey: null
    })
  }

  async getCampaign(id) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const record = await pb.collection('sms_campaigns').getOne(id, {
      expand: 'group_id,device_id'
    })
    if (record.user_id !== user.id) throw new Error('Unauthorized')
    return record
  }

  async createCampaign(data) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    return await pb.collection('sms_campaigns').create({
      ...this._sanitize(data),
      user_id: user.id,
      status: 'draft',
      sent_count: 0,
      delivered_count: 0,
      failed_count: 0
    })
  }

  async updateCampaign(id, updates) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const existing = await pb.collection('sms_campaigns').getOne(id)
    if (existing.user_id !== user.id) throw new Error('Unauthorized')

    return await pb.collection('sms_campaigns').update(id, this._sanitize(updates))
  }

  async deleteCampaign(id) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const existing = await pb.collection('sms_campaigns').getOne(id)
    if (existing.user_id !== user.id) throw new Error('Unauthorized')

    return await pb.collection('sms_campaigns').delete(id)
  }

  async launchCampaign(id) {
    const campaign = await this.getCampaign(id)
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new Error('Campaign must be in draft or scheduled status to launch')
    }

    // Get group members
    const members = await this.getGroupMembers(campaign.group_id)
    if (members.length === 0) throw new Error('No recipients in group')

    // Create individual messages for each member
    const user = pb.authStore.model
    const promises = members.map(member => {
      // Personalize message with {{name}}, {{phone}}
      let body = campaign.message
      body = body.replace(/\{\{name\}\}/g, member.name || '')
      body = body.replace(/\{\{phone\}\}/g, member.phone || '')
      body = body.replace(/\{\{email\}\}/g, member.email || '')

      return pb.collection('sms_messages').create({
        user_id: user.id,
        recipient: member.phone,
        contact_name: member.name,
        body,
        direction: 'outbound',
        status: 'sent',
        campaign_id: id,
        device_id: campaign.device_id,
        sent_at: new Date().toISOString()
      })
    })

    await Promise.all(promises)

    // Update campaign status and counts
    await pb.collection('sms_campaigns').update(id, {
      status: 'sent',
      sent_count: members.length,
      sent_at: new Date().toISOString()
    })

    return { sent: members.length }
  }

  // ==================== GROUPS ====================

  async getGroups() {
    const user = pb.authStore.model
    if (!user) return []

    return await pb.collection('sms_groups').getFullList({
      filter: `user_id = "${user.id}"`,
      sort: '-created',
      requestKey: null
    })
  }

  async createGroup(data) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    return await pb.collection('sms_groups').create({
      ...this._sanitize(data),
      user_id: user.id,
      member_count: 0
    })
  }

  async updateGroup(id, updates) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const existing = await pb.collection('sms_groups').getOne(id)
    if (existing.user_id !== user.id) throw new Error('Unauthorized')

    return await pb.collection('sms_groups').update(id, this._sanitize(updates))
  }

  async deleteGroup(id) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const existing = await pb.collection('sms_groups').getOne(id)
    if (existing.user_id !== user.id) throw new Error('Unauthorized')

    // Delete all members first
    const members = await pb.collection('sms_group_members').getFullList({
      filter: `group_id = "${id}"`
    })
    await Promise.all(members.map(m => pb.collection('sms_group_members').delete(m.id)))

    return await pb.collection('sms_groups').delete(id)
  }

  async getGroupMembers(groupId) {
    return await pb.collection('sms_group_members').getFullList({
      filter: `group_id = "${escapeFilterValue(groupId)}"`,
      sort: 'name',
      requestKey: null
    })
  }

  async addGroupMember(groupId, memberData) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const record = await pb.collection('sms_group_members').create({
      ...this._sanitize(memberData),
      group_id: groupId
    })

    // Update member count
    await this._updateGroupMemberCount(groupId)
    return record
  }

  async removeGroupMember(memberId, groupId) {
    await pb.collection('sms_group_members').delete(memberId)
    await this._updateGroupMemberCount(groupId)
  }

  async importGroupMembers(groupId, members) {
    const promises = members.map(member =>
      pb.collection('sms_group_members').create({
        group_id: groupId,
        name: member.name || '',
        phone: member.phone || '',
        email: member.email || ''
      })
    )

    await Promise.all(promises)
    await this._updateGroupMemberCount(groupId)
    return { imported: members.length }
  }

  async _updateGroupMemberCount(groupId) {
    const members = await pb.collection('sms_group_members').getFullList({
      filter: `group_id = "${groupId}"`,
      fields: 'id'
    })
    await pb.collection('sms_groups').update(groupId, {
      member_count: members.length
    })
  }

  // ==================== TEMPLATES ====================

  async getTemplates() {
    const user = pb.authStore.model
    if (!user) return []

    return await pb.collection('sms_templates').getFullList({
      filter: `user_id = "${user.id}"`,
      sort: '-created',
      requestKey: null
    })
  }

  async createTemplate(data) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    return await pb.collection('sms_templates').create({
      ...this._sanitize(data),
      user_id: user.id
    })
  }

  async updateTemplate(id, updates) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const existing = await pb.collection('sms_templates').getOne(id)
    if (existing.user_id !== user.id) throw new Error('Unauthorized')

    return await pb.collection('sms_templates').update(id, this._sanitize(updates))
  }

  async deleteTemplate(id) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const existing = await pb.collection('sms_templates').getOne(id)
    if (existing.user_id !== user.id) throw new Error('Unauthorized')

    return await pb.collection('sms_templates').delete(id)
  }

  // ==================== STATS ====================

  async getDashboardStats() {
    const user = pb.authStore.model
    if (!user) return null

    try {
      const [messages, campaigns, devices, groups] = await Promise.all([
        pb.collection('sms_messages').getList(1, 1, {
          filter: `user_id = "${user.id}"`,
          requestKey: null
        }),
        pb.collection('sms_campaigns').getList(1, 1, {
          filter: `user_id = "${user.id}"`,
          requestKey: null
        }),
        pb.collection('sms_devices').getList(1, 1, {
          filter: `user_id = "${user.id}"`,
          requestKey: null
        }),
        pb.collection('sms_groups').getList(1, 1, {
          filter: `user_id = "${user.id}"`,
          requestKey: null
        })
      ])

      // Get sent/delivered/failed counts
      const [sent, delivered, failed] = await Promise.all([
        pb.collection('sms_messages').getList(1, 1, {
          filter: `user_id = "${user.id}" && status = "sent"`,
          requestKey: null
        }),
        pb.collection('sms_messages').getList(1, 1, {
          filter: `user_id = "${user.id}" && status = "delivered"`,
          requestKey: null
        }),
        pb.collection('sms_messages').getList(1, 1, {
          filter: `user_id = "${user.id}" && status = "failed"`,
          requestKey: null
        })
      ])

      return {
        totalMessages: messages.totalItems,
        totalCampaigns: campaigns.totalItems,
        totalDevices: devices.totalItems,
        totalGroups: groups.totalItems,
        sentCount: sent.totalItems,
        deliveredCount: delivered.totalItems,
        failedCount: failed.totalItems,
        deliveryRate: messages.totalItems > 0
          ? Math.round(((delivered.totalItems + sent.totalItems) / messages.totalItems) * 100)
          : 0
      }
    } catch (error) {
      console.error('Error fetching SMS stats:', error)
      return {
        totalMessages: 0, totalCampaigns: 0, totalDevices: 0, totalGroups: 0,
        sentCount: 0, deliveredCount: 0, failedCount: 0, deliveryRate: 0
      }
    }
  }

  // ==================== PRIVATE HELPERS ====================

  _sanitize(data) {
    const sanitized = { ...data }
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === '') {
        sanitized[key] = null
      }
    })
    return sanitized
  }
}

export const smsService = new SmsService()
