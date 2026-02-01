/**
 * Campaigns Service
 *
 * Centralized service for all campaign-related operations.
 * Abstracts PocketBase API calls and provides clean, reusable methods.
 *
 * @module services/campaigns.service
 */

import pb from '../lib/pocketbase'

class CampaignsService {
  /**
   * Fetch all campaigns with optional filtering
   *
   * @param {Object} options - Filter options
   * @param {string|null} options.workspaceId - Filter by workspace
   * @param {string} options.status - Filter by status ('active', 'draft', 'completed', 'archived', or 'all')
   * @param {string} options.search - Search term for campaign name
   * @returns {Promise<Array>} Array of campaign records
   */
  async getAll({ workspaceId = null, status = 'all', search = '' } = {}) {
    const user = pb.authStore.model
    if (!user) return []

    const filters = this._buildFilters(workspaceId, status, search, user.id)
    const filterString = filters.join(' && ')

    try {
      const options = {
        sort: '-start_date',
        expand: 'context_id',
        requestKey: null
      }

      if (filterString) {
        options.filter = filterString
      }

      return await pb.collection('campaigns').getFullList(options)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      return []
    }
  }

  /**
   * Get a single campaign by ID
   * Verifies ownership before returning
   *
   * @param {string} id - Campaign ID
   * @returns {Promise<Object>} Campaign record
   * @throws {Error} If not authenticated or unauthorized
   */
  async getOne(id) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const record = await pb.collection('campaigns').getOne(id, {
      expand: 'context_id'
    })

    // Verify ownership
    if (record.user_id !== user.id) {
      throw new Error('Unauthorized: Cannot access this campaign')
    }

    return record
  }

  /**
   * Get campaign with related tasks and meetings stats
   *
   * @param {string} id - Campaign ID
   * @returns {Promise<Object>} Campaign with stats
   */
  async getWithStats(id) {
    const campaign = await this.getOne(id)
    const user = pb.authStore.model

    try {
      // Fetch tasks count
      const tasks = await pb.collection('tasks').getList(1, 1, {
        filter: `campaign_id = "${id}" && user_id = "${user.id}"`
      })

      // Fetch meetings count
      const meetings = await pb.collection('tasks').getList(1, 1, {
        filter: `campaign_id = "${id}" && type = "meeting" && user_id = "${user.id}"`
      })

      return {
        ...campaign,
        taskCount: tasks.totalItems,
        meetingCount: meetings.totalItems
      }
    } catch (error) {
      console.error('❌ Error fetching campaign stats:', error)
      // Return campaign without stats if stats fetch fails
      return {
        ...campaign,
        taskCount: 0,
        meetingCount: 0
      }
    }
  }

  /**
   * Create a new campaign
   *
   * @param {Object} campaignData - Campaign data
   * @returns {Promise<Object>} Created campaign record
   * @throws {Error} If user not authenticated
   */
  async create(campaignData) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const sanitized = this._sanitize(campaignData)

    return await pb.collection('campaigns').create({
      ...sanitized,
      user_id: user.id
    })
  }

  /**
   * Update a campaign
   * Verifies ownership before updating
   *
   * @param {string} id - Campaign ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated campaign record
   * @throws {Error} If not authenticated or unauthorized
   */
  async update(id, updates) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    // Verify ownership first
    const existing = await this.getOne(id)
    if (existing.user_id !== user.id) {
      throw new Error('Unauthorized: Cannot update this campaign')
    }

    const sanitized = this._sanitize(updates)
    return await pb.collection('campaigns').update(id, sanitized)
  }

  /**
   * Archive a campaign (soft delete)
   *
   * @param {string} id - Campaign ID
   * @returns {Promise<Object>} Updated campaign record
   */
  async archive(id) {
    return await this.update(id, { status: 'archived' })
  }

  /**
   * Restore an archived campaign
   *
   * @param {string} id - Campaign ID
   * @returns {Promise<Object>} Updated campaign record
   */
  async restore(id) {
    return await this.update(id, { status: 'draft' })
  }

  /**
   * Permanently delete a campaign
   * Verifies ownership before deletion
   *
   * @param {string} id - Campaign ID
   * @returns {Promise<void>}
   * @throws {Error} If not authenticated or unauthorized
   */
  async delete(id) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    // Verify ownership first
    const existing = await this.getOne(id)
    if (existing.user_id !== user.id) {
      throw new Error('Unauthorized: Cannot delete this campaign')
    }

    return await pb.collection('campaigns').delete(id)
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Build PocketBase filter string
   *
   * @private
   * @param {string|null} workspaceId - Workspace ID
   * @param {string} status - Status filter
   * @param {string} search - Search term
   * @param {string} userId - User ID
   * @returns {string[]} Array of filter conditions
   */
  _buildFilters(workspaceId, status, search, userId) {
    const filters = []

    // Always filter by user
    filters.push(`user_id = "${userId}"`)

    // Workspace filter
    if (workspaceId && workspaceId !== 'all') {
      // MIGRATION FIX: Include campaigns with NO workspace so they don't disappear
      filters.push(`(context_id = "${workspaceId}" || context_id = "" || context_id = null)`)
    }

    // Status filter
    if (status && status !== 'all') {
      filters.push(`status = "${status}"`)
    }

    // Search filter (basic - should use escapeFilterValue in production)
    if (search) {
      // Escape quotes to prevent SQL injection
      const escapedSearch = search.replace(/"/g, '\\"')
      filters.push(`name ~ "${escapedSearch}"`)
    }

    return filters
  }

  /**
   * Sanitize data by converting empty strings to null
   * PocketBase requires null for optional fields, not empty strings
   *
   * @private
   * @param {Object} data - Data to sanitize
   * @returns {Object} Sanitized data
   */
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

// Export singleton instance
export const campaignsService = new CampaignsService()
