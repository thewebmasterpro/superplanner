import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksService } from '../services/tasks.service'
import toast from 'react-hot-toast'
import pb from '../lib/pocketbase'

/**
 * Get team pool tasks (unassigned team tasks)
 * @param {string} teamId - Team ID
 */
export function useTeamPool(teamId) {
  return useQuery({
    queryKey: ['tasks', 'pool', teamId],
    queryFn: async () => {
      if (!teamId) return []

      // Fetch all tasks and filter client-side for maximum compatibility
      const allTasks = await pb.collection('tasks').getFullList({
        sort: '-created'
      })

      // Filter for team pool tasks
      return allTasks.filter(t =>
        t.team_id === teamId &&
        t.status === 'unassigned' &&
        !t.deleted_at &&
        !t.archived_at
      )
    },
    enabled: !!teamId,
  })
}

/**
 * Claim a task from the pool
 */
export function useClaimTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId) => tasksService.claimTask(taskId),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('🎯 Tâche prise avec succès!', { icon: '⚡' })
    },
    onError: (error) => {
      console.error('Error claiming task:', error)
      toast.error(error.message || 'Erreur lors de la prise de la tâche')
    },
  })
}

/**
 * Release a task back to the pool
 */
export function useReleaseTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, reason }) => tasksService.releaseTask(taskId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('📤 Tâche libérée et retournée au pool', { icon: '✅' })
    },
    onError: (error) => {
      console.error('Error releasing task:', error)
      toast.error(error.message || 'Erreur lors de la libération de la tâche')
    },
  })
}
