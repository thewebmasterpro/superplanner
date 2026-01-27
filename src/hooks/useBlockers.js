import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
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

            const { data, error } = await supabase
                .from('task_dependencies')
                .select(`
          id,
          blocker_id,
          created_at,
          blocker:blocker_id(id, title, status, priority, due_date)
        `)
                .eq('task_id', taskId)

            if (error) throw error
            return data?.map(d => ({ ...d.blocker, dependency_id: d.id })) || []
        },
        enabled: !!taskId
    })

    // Fetch tasks that this task blocks (this task BLOCKS these)
    const blocksQuery = useQuery({
        queryKey: ['blocks', taskId],
        queryFn: async () => {
            if (!taskId) return []

            const { data, error } = await supabase
                .from('task_dependencies')
                .select(`
          id,
          task_id,
          created_at,
          blocked_task:task_id(id, title, status, priority, due_date)
        `)
                .eq('blocker_id', taskId)

            if (error) throw error
            return data?.map(d => ({ ...d.blocked_task, dependency_id: d.id })) || []
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
            const { data: reverseCheck } = await supabase
                .from('task_dependencies')
                .select('id')
                .eq('task_id', blockerId)
                .eq('blocker_id', taskId)
                .single()

            if (reverseCheck) {
                throw new Error('Circular dependency detected: this would create a cycle')
            }

            const { data, error } = await supabase
                .from('task_dependencies')
                .insert({ task_id: taskId, blocker_id: blockerId })
                .select()
                .single()

            if (error) {
                if (error.code === '23505') {
                    throw new Error('This blocker already exists')
                }
                throw error
            }

            return data
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
            const { error } = await supabase
                .from('task_dependencies')
                .delete()
                .eq('id', dependencyId)

            if (error) throw error
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
