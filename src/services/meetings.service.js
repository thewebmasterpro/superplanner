/**
 * Meetings Service
 *
 * Specialized service for Meeting management, specifically handling Agenda items.
 * Meetings themselves are "Tasks" of type="meeting", but this service encapsulates
 * the specific business logic around them (agendas, items, progress).
 *
 * @module services/meetings.service
 */

import pb from '../lib/pocketbase'
import { escapeFilterValue } from '../lib/filterUtils'
import { tasksService } from './tasks.service' // Reuse tasks service for base operations if needed

class MeetingsService {
    /**
     * Get agenda items for a meeting with full details and optimized progress calculation
     *
     * @param {string} meetingId - Meeting ID
     * @returns {Promise<Array>} Array of agenda items with full details
     * @throws {Error} If not authenticated
     */
    async getAgenda(meetingId) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const escapedMeetingId = escapeFilterValue(meetingId)

        // 1. Fetch meeting items
        const items = await pb.collection('meeting_items').getFullList({
            filter: `meeting_id = "${escapedMeetingId}"`,
            sort: 'position'
        })

        if (!items || items.length === 0) return []

        // 2. Separate IDs by type
        const taskIds = items.filter(i => i.item_type === 'task').map(i => i.item_id)
        const campaignIds = items.filter(i => i.item_type === 'campaign').map(i => i.item_id)

        // 3. Fetch task details (Parallel)
        let tasks = []
        let campaigns = []

        const promises = []

        if (taskIds.length > 0) {
            // Optimized batch fetch for tasks
            const escapedTaskIds = taskIds.map(id => escapeFilterValue(id))
            const filter = escapedTaskIds.map(id => `id="${id}"`).join(' || ')
            promises.push(
                pb.collection('tasks').getFullList({ filter })
                    .then(res => { tasks = res })
                    .catch(e => console.error('Error fetching agenda tasks', e))
            )
        }

        if (campaignIds.length > 0) {
            // Optimized batch fetch for campaigns
            const escapedCampaignIds = campaignIds.map(id => escapeFilterValue(id))
            const filter = escapedCampaignIds.map(id => `id="${id}"`).join(' || ')
            promises.push(
                pb.collection('campaigns').getFullList({ filter })
                    .then(res => { campaigns = res })
                    .catch(e => console.error('Error fetching agenda campaigns', e))
            )
        }

        await Promise.all(promises)

        // 4. Calculate Campaign Progress (Optimized - Avoid N+1)
        if (campaignIds.length > 0) {
            const escapedCampaignIds = campaignIds.map(id => escapeFilterValue(id))
            const campaignIdFilter = escapedCampaignIds.map(id => `campaign_id="${id}"`).join(' || ')

            try {
                // Fetch ALL relevant tasks in one go: id, status, campaign_id
                const allCampaignTasks = await pb.collection('tasks').getFullList({
                    filter: `(${campaignIdFilter})`,
                    fields: 'id,status,campaign_id'
                })

                // Map progress in memory
                campaigns = campaigns.map(campaign => {
                    const campaignTasks = allCampaignTasks.filter(t => t.campaign_id === campaign.id)
                    const totalCount = campaignTasks.length
                    const doneCount = campaignTasks.filter(t => t.status === 'done').length

                    return {
                        ...campaign,
                        progress: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0,
                        taskCount: totalCount,
                        doneCount: doneCount
                    }
                })
            } catch (e) {
                console.error('Error calculating campaign progress:', e)
                // Fallback: 0 progress
                campaigns = campaigns.map(c => ({
                    ...c,
                    progress: 0,
                    taskCount: 0,
                    doneCount: 0
                }))
            }
        }

        // 5. Merge and Return
        return items.map(item => {
            if (item.item_type === 'task') {
                const task = tasks.find(t => t.id === item.item_id)
                return task ? { ...item, details: task, type: 'task' } : null
            } else {
                const campaign = campaigns.find(c => c.id === item.item_id)
                return campaign ? { ...item, details: campaign, type: 'campaign' } : null
            }
        }).filter(Boolean) // Filter out items where details were not found (deleted?)
    }

    /**
     * Add an item to the agenda
     *
     * @param {string} meetingId - Meeting ID
     * @param {string} itemType - 'task' | 'campaign'
     * @param {string} itemId - ID of the task or campaign
     * @returns {Promise<Object>} Created meeting item
     * @throws {Error} If not authenticated or unauthorized
     */
    async addToAgenda(meetingId, itemType, itemId) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        // Check strict ownership/access on meeting?
        // Assuming meetingId is a task ID, we should verify access to it.
        // tasksService.getOne(meetingId) would do this check implicitly.
        try {
            await tasksService.getOne(meetingId)
        } catch (e) {
            throw new Error('Unauthorized: Cannot access meeting')
        }

        const escapedMeetingId = escapeFilterValue(meetingId)
        const escapedItemId = escapeFilterValue(itemId)

        // Check existing
        try {
            const exists = await pb.collection('meeting_items').getFirstListItem(`meeting_id="${escapedMeetingId}" && item_id="${escapedItemId}"`)
            if (exists) throw new Error('Item already in agenda')
        } catch (e) {
            if (e.status !== 404) throw e
        }

        // Get max position
        const existing = await pb.collection('meeting_items').getList(1, 1, {
            filter: `meeting_id = "${escapedMeetingId}"`,
            sort: '-position'
        })
        const nextPos = existing.items.length > 0 ? existing.items[0].position + 1 : 0

        return await pb.collection('meeting_items').create({
            meeting_id: meetingId,
            item_type: itemType,
            item_id: itemId,
            position: nextPos
        })
    }

    /**
     * Bulk add items to agenda
     * 
     * @param {string} meetingId - Meeting ID
     * @param {string} itemType - 'task' | 'campaign'
     * @param {string[]} itemIds - Array of item IDs
     * @returns {Promise<void>}
     */
    async bulkAddToAgenda(meetingId, itemType, itemIds) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        // Verify access via tasksService (meeting is a task)
        try {
            await tasksService.getOne(meetingId)
        } catch (e) {
            throw new Error('Unauthorized')
        }

        const escapedMeetingId = escapeFilterValue(meetingId)

        // Get max position
        const existing = await pb.collection('meeting_items').getList(1, 1, {
            filter: `meeting_id = "${escapedMeetingId}"`,
            sort: '-position'
        })

        let nextPosition = existing.items.length > 0 ? existing.items[0].position + 1 : 0

        const promises = itemIds.map((itemId, index) => {
            return pb.collection('meeting_items').create({
                meeting_id: meetingId,
                item_type: itemType,
                item_id: itemId,
                title: 'Ref',
                position: nextPosition + index
            }).catch(err => {
                console.warn('Failed to add item to agenda', itemId, err)
            })
        })

        await Promise.all(promises)
    }

    /**
     * Remove an item from agenda
     *
     * @param {string} meetingId - Meeting ID
     * @param {string} itemId - The ID of the Task/Campaign (not the meeting_item record ID)
     * @returns {Promise<void>}
     * @throws {Error} If not authenticated or unauthorized
     */
    async removeFromAgenda(meetingId, itemId) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        // Verify access
        try {
            await tasksService.getOne(meetingId)
        } catch (e) {
            throw new Error('Unauthorized')
        }

        const escapedMeetingId = escapeFilterValue(meetingId)
        const escapedItemId = escapeFilterValue(itemId)

        const record = await pb.collection('meeting_items').getFirstListItem(`meeting_id="${escapedMeetingId}" && item_id="${escapedItemId}"`)
        if (record) {
            return await pb.collection('meeting_items').delete(record.id)
        }
    }

    /**
     * Reorder agenda items
     *
     * @param {string} meetingId - Meeting ID
     * @param {string[]} orderedItemIds - Array of item_ids (refs) in new order
     * @returns {Promise<void>}
     * @throws {Error} If not authenticated or unauthorized
     */
    async reorderAgenda(meetingId, orderedItemIds) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        // Verify access
        try {
            await tasksService.getOne(meetingId)
        } catch (e) {
            throw new Error('Unauthorized')
        }

        const escapedMeetingId = escapeFilterValue(meetingId)

        const allItems = await pb.collection('meeting_items').getFullList({
            filter: `meeting_id = "${escapedMeetingId}"`
        })

        const updates = orderedItemIds.map((itemId, index) => {
            const record = allItems.find(r => r.item_id === itemId)
            return record ? { id: record.id, position: index } : null
        }).filter(Boolean)

        await Promise.all(updates.map(u =>
            pb.collection('meeting_items').update(u.id, { position: u.position })
        ))
    }
}

export const meetingsService = new MeetingsService()
