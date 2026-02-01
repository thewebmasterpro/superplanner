import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

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
            const { data: items, error } = await supabase
                .from('meeting_items')
                .select('*')
                .eq('meeting_id', meetingId)
                .order('position')

            if (error) throw error
            if (!items || items.length === 0) return []

            // Separate by type
            const taskIds = items.filter(i => i.item_type === 'task').map(i => i.item_id)
            const campaignIds = items.filter(i => i.item_type === 'campaign').map(i => i.item_id)

            // Fetch task details
            let tasks = []
            if (taskIds.length > 0) {
                const { data } = await supabase
                    .from('tasks')
                    .select('id, title, status, priority, due_date')
                    .in('id', taskIds)
                tasks = data || []
            }

            // Fetch campaign details with progress
            let campaigns = []
            if (campaignIds.length > 0) {
                const { data } = await supabase
                    .from('campaigns')
                    .select('id, name, status, end_date, priority')
                    .in('id', campaignIds)

                // Calculate progress for each campaign
                for (const campaign of data || []) {
                    const { count: total } = await supabase
                        .from('tasks')
                        .select('id', { count: 'exact', head: true })
                        .eq('campaign_id', campaign.id)

                    const { count: done } = await supabase
                        .from('tasks')
                        .select('id', { count: 'exact', head: true })
                        .eq('campaign_id', campaign.id)
                        .eq('status', 'done')

                    campaign.progress = total > 0 ? Math.round((done / total) * 100) : 0
                    campaign.taskCount = total
                    campaign.doneCount = done
                }
                campaigns = data || []
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
            // Get max position
            const { data: existing } = await supabase
                .from('meeting_items')
                .select('position')
                .eq('meeting_id', meetingId)
                .order('position', { ascending: false })
                .limit(1)

            const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0

            const { data, error } = await supabase
                .from('meeting_items')
                .insert({
                    meeting_id: meetingId,
                    item_type: itemType,
                    item_id: itemId,
                    position: nextPosition
                })
                .select()
                .single()

            if (error) {
                if (error.code === '23505') {
                    throw new Error('This item is already in the agenda')
                }
                throw error
            }

            return data
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
            const { error } = await supabase
                .from('meeting_items')
                .delete()
                .eq('meeting_id', meetingId)
                .eq('item_id', itemId)

            if (error) throw error
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
            const updates = orderedItemIds.map((itemId, index) => ({
                meeting_id: meetingId,
                item_id: itemId,
                position: index
            }))

            // Update each item's position
            for (const update of updates) {
                await supabase
                    .from('meeting_items')
                    .update({ position: update.position })
                    .eq('meeting_id', meetingId)
                    .eq('item_id', update.item_id)
            }
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
            sublabel: null
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
