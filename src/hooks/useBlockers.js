import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import pb from '../lib/pocketbase'
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

            const records = await pb.collection('task_dependencies').getFullList({
                filter: `task_id = "${taskId}"`,
                expand: 'blocker_id'
            })

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

            const records = await pb.collection('task_dependencies').getFullList({
                filter: `blocker_id = "${taskId}"`,
                expand: 'task_id'
            })

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
            // Validation: no self-blocking
            if (blockerId === taskId) {
                throw new Error('A task cannot block itself')
            }

            // Validation: check for simple cycle (A↔B)
            try {
                const reverseCheck = await pb.collection('task_dependencies').getFirstListItem(`task_id="${blockerId}" && blocker_id="${taskId}"`)
                if (reverseCheck) {
                    throw new Error('Circular dependency detected: this would create a cycle')
                }
            } catch (e) {
                if (e.status !== 404) throw e
            }

            // Check if exists
            try {
                const exists = await pb.collection('task_dependencies').getFirstListItem(`task_id="${taskId}" && blocker_id="${blockerId}"`)
                if (exists) {
                    throw new Error('This blocker already exists')
                }
            } catch (e) {
                if (e.status !== 404) throw e
            }


            const record = await pb.collection('task_dependencies').create({
                task_id: taskId,
                blocker_id: blockerId
            })

            return record
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
            await pb.collection('task_dependencies').delete(dependencyId)
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

    return {
        blockers: blockersQuery.data || [],
        blocks: blocksQuery.data || [],
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
