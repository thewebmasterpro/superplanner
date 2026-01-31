import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingsService } from '../services/meetings.service'
import toast from 'react-hot-toast'

/**
 * Hook to manage meeting agenda items (tasks + campaigns)
 */
export function useMeetingAgenda(meetingId) {
    const queryClient = useQueryClient()

    // Fetch all agenda items for a meeting with full details
    const agendaQuery = useQuery({
        queryKey: ['meetingAgenda', meetingId],
        queryFn: () => meetingsService.getAgenda(meetingId),
        enabled: !!meetingId
    })

    // Add item to agenda
    const addItem = useMutation({
        mutationFn: ({ itemType, itemId }) => meetingsService.addToAgenda(meetingId, itemType, itemId),
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
        mutationFn: (itemId) => meetingsService.removeFromAgenda(meetingId, itemId),
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
        mutationFn: (orderedItemIds) => meetingsService.reorderAgenda(meetingId, orderedItemIds),
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
