import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import pb from '../lib/pocketbase'
import toast from 'react-hot-toast'

/**
 * Hook to manage meeting agenda items (tasks + campaigns)
 */
export function useMeetingAgenda(meetingId) {
    const queryClient = useQueryClient()

    // Fetch all agenda items for a meeting with full details
    const agendaQuery = useQuery({
        queryKey: ['meetingAgenda', meetingId],
        queryFn: async () => {
            if (!meetingId) return []

            // Get all meeting items
            const items = await pb.collection('meeting_items').getFullList({
                filter: `meeting_id = "${meetingId}"`,
                sort: 'position'
            })

            if (!items || items.length === 0) return []

            // Separate by type
            const taskIds = items.filter(i => i.item_type === 'task').map(i => i.item_id)
            const campaignIds = items.filter(i => i.item_type === 'campaign').map(i => i.item_id)

            // Fetch task details
            let tasks = []
            if (taskIds.length > 0) {
                // Build filter OR query
                // filter: id='id1' || id='id2'
                const filter = taskIds.map(id => `id="${id}"`).join(' || ')
                if (filter) {
                    tasks = await pb.collection('tasks').getFullList({
                        filter: filter, // Be careful with URL length limits if many items, but agenda is usually short
                    })
                }
            }

            // Fetch campaign details with progress
            let campaigns = []
            if (campaignIds.length > 0) {
                const filter = campaignIds.map(id => `id="${id}"`).join(' || ')
                if (filter) {
                    const campaignsData = await pb.collection('campaigns').getFullList({
                        filter: filter
                    })

                    // Calculate progress for each campaign manually
                    // Parallelize this
                    campaigns = await Promise.all(campaignsData.map(async (campaign) => {
                        try {
                            const total = await pb.collection('tasks').getList(1, 1, {
                                filter: `campaign_id = "${campaign.id}"`,
                                fields: 'id'
                            })
                            const done = await pb.collection('tasks').getList(1, 1, {
                                filter: `campaign_id = "${campaign.id}" && status = "done"`,
                                fields: 'id'
                            })
                            const totalCount = total.totalItems
                            const doneCount = done.totalItems

                            return {
                                ...campaign,
                                progress: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0,
                                taskCount: totalCount,
                                doneCount: doneCount
                            }
                        } catch (e) {
                            return { ...campaign, progress: 0, taskCount: 0, doneCount: 0 }
                        }
                    }))
                }
            }

            // Merge with original items to maintain order
            return items.map(item => {
                if (item.item_type === 'task') {
                    const task = tasks.find(t => t.id === item.item_id)
                    return { ...item, details: task, type: 'task' }
                } else {
                    const campaign = campaigns.find(c => c.id === item.item_id)
                    return { ...item, details: campaign, type: 'campaign' }
                }
            }).filter(item => item.details) // Filter out orphaned items
        },
        enabled: !!meetingId
    })

    // Add item to agenda
    const addItem = useMutation({
        mutationFn: async ({ itemType, itemId }) => {
            // Check if exists
            try {
                const exists = await pb.collection('meeting_items').getFirstListItem(`meeting_id="${meetingId}" && item_id="${itemId}"`)
                if (exists) {
                    throw new Error('This item is already in the agenda')
                }
            } catch (e) {
                if (e.status !== 404) throw e
            }

            // Get max position
            const existing = await pb.collection('meeting_items').getList(1, 1, {
                filter: `meeting_id = "${meetingId}"`,
                sort: '-position'
            })

            const nextPosition = existing.items.length > 0 ? existing.items[0].position + 1 : 0

            const record = await pb.collection('meeting_items').create({
                meeting_id: meetingId,
                item_type: itemType,
                item_id: itemId,
                position: nextPosition
            })

            return record
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetingAgenda', meetingId] })
            toast.success('Added to agenda')
        },
        onError: (error) => {
            toast.error(error.message)
        }
    })

    // Remove item from agenda
    const removeItem = useMutation({
        mutationFn: async (itemId) => {
            // We need record ID to delete in PB.
            // item_id passed here is the ID of the task/campaign, NOT the meeting_item record ID.
            // But wait, the UI calls removeItem(item.item_id). 
            // Ideally UI should pass item.id (meeting_item id).
            // Let's find the record first.
            const record = await pb.collection('meeting_items').getFirstListItem(`meeting_id="${meetingId}" && item_id="${itemId}"`)
            if (record) {
                await pb.collection('meeting_items').delete(record.id)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetingAgenda', meetingId] })
            toast.success('Removed from agenda')
        },
        onError: () => {
            toast.error('Failed to remove item')
        }
    })

    // Reorder items
    const reorderItems = useMutation({
        mutationFn: async (orderedItemIds) => {
            // items are identified by item_id (task/campaign id)
            // We need to fetch records to update them.
            // Or cleaner: UI should pass meeting_item IDs?
            // Assuming orderedItemIds are item_ids (refs).

            // 1. Fetch all items for meeting to map item_id to record_id
            const allItems = await pb.collection('meeting_items').getFullList({
                filter: `meeting_id = "${meetingId}"`
            })

            const updates = orderedItemIds.map((itemId, index) => {
                const record = allItems.find(r => r.item_id === itemId)
                return record ? { id: record.id, position: index } : null
            }).filter(Boolean)

            // Update each item's position
            await Promise.all(updates.map(u =>
                pb.collection('meeting_items').update(u.id, { position: u.position })
            ))
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetingAgenda', meetingId] })
        }
    })

    return {
        agenda: agendaQuery.data || [],
        isLoading: agendaQuery.isLoading,
        addItem: (itemType, itemId) => addItem.mutate({ itemType, itemId }),
        removeItem: removeItem.mutate,
        reorderItems: reorderItems.mutate,
        isAddingItem: addItem.isPending,
        isRemovingItem: removeItem.isPending
    }
}

/**
 * Format agenda for display
 */
export function formatAgendaItem(item) {
    if (item.type === 'task') {
        const statusEmoji = {
            'todo': '⚪',
            'in_progress': '🔵',
            'done': '✅',
            'blocked': '🔴'
        }
        const priorityLabel = item.details.priority <= 2 ? ' [URGENT]' : ` [P${item.details.priority}]`
        return {
            emoji: statusEmoji[item.details.status] || '⚪',
            label: item.details.title + priorityLabel,
            sublabel: null,
            urgent: item.details.priority <= 2
        }
    } else {
        const deadlineSoon = item.details.end_date &&
            new Date(item.details.end_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        return {
            emoji: deadlineSoon ? '🔴' : '📊',
            label: item.details.name,
            sublabel: `${item.details.progress}% complete • ${item.details.taskCount} tasks`,
            urgent: deadlineSoon
        }
    }
}
