import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blockersService } from '../services/blockers.service'
import toast from 'react-hot-toast'

/**
 * Hook to manage task blockers (dependencies)
 */
export function useBlockers(taskId) {
    const queryClient = useQueryClient()

    // Fetch tasks that block this task (this task is blocked BY these)
    const blockersQuery = useQuery({
        queryKey: ['blockers', taskId],
        queryFn: async () => {
            if (!taskId) return []

            const records = await blockersService.getBlockers(taskId)

            // Map expand.blocker_id to flat object
            return records.map(d => ({
                ...d.expand?.blocker_id,
                dependency_id: d.id
            })).filter(b => b.id) // Ensure valid task data
        },
        enabled: !!taskId
    })

    // Fetch tasks that this task blocks (this task BLOCKS these)
    const blocksQuery = useQuery({
        queryKey: ['blocks', taskId],
        queryFn: async () => {
            if (!taskId) return []

            const records = await blockersService.getBlockedTasks(taskId)

            return records.map(d => ({
                ...d.expand?.task_id,
                dependency_id: d.id
            })).filter(b => b.id)
        },
        enabled: !!taskId
    })

    // Add a blocker to this task
    const addBlocker = useMutation({
        mutationFn: async (blockerId) => {
            return await blockersService.addBlocker(taskId, blockerId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blockers', taskId] })
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            toast.success('Blocker added')
        },
        onError: (error) => {
            toast.error(error.message)
        }
    })

    // Remove a blocker from this task
    const removeBlocker = useMutation({
        mutationFn: async (dependencyId) => {
            await blockersService.removeBlocker(dependencyId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blockers', taskId] })
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            toast.success('Blocker removed')
        },
        onError: (error) => {
            toast.error('Failed to remove blocker: ' + error.message)
        }
    })

    const EMPTY_ARRAY = []

    return {
        blockers: blockersQuery.data || EMPTY_ARRAY,
        blocks: blocksQuery.data || EMPTY_ARRAY,
        isLoadingBlockers: blockersQuery.isLoading,
        isLoadingBlocks: blocksQuery.isLoading,
        addBlocker: addBlocker.mutate,
        removeBlocker: removeBlocker.mutate,
        isAddingBlocker: addBlocker.isPending,
        isRemovingBlocker: removeBlocker.isPending
    }
}

/**
 * Check if a task is blocked (has any non-done blockers)
 */
export function isTaskBlocked(blockers) {
    if (!blockers || blockers.length === 0) return false
    return blockers.some(b => b.status !== 'done')
}

/**
 * Check if all blockers are done (task is ready to start)
 */
export function areAllBlockersDone(blockers) {
    if (!blockers || blockers.length === 0) return true
    return blockers.every(b => b.status === 'done')
}
