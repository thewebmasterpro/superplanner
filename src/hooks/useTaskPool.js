import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksService } from '../services/tasks.service'
import toast from 'react-hot-toast'

/**
 * Get team pool tasks (unassigned team tasks)
 * @param {string} teamId - Team ID
 */
export function useTeamPool(teamId) {
  return useQuery({
    queryKey: ['tasks', 'pool', teamId],
    queryFn: () => tasksService.getPoolTasks(teamId),
    enabled: !!teamId,
  })
}

/**
 * Create a pool task (team task with unassigned status)
 */
export function useCreatePoolTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, teamId }) => tasksService.createPoolTask(data, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Tâche ajoutée au pool!', { icon: '🎯' })
    },
    onError: (error) => {
      console.error('Pool task creation failed:', error)
      toast.error(`Erreur: ${error.message}`)
    },
  })
}

/**
 * Claim a task from the pool
 */
export function useClaimTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId) => tasksService.claimTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Tâche prise avec succès!', { icon: '⚡' })
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
      toast.success('Tâche libérée et retournée au pool', { icon: '📤' })
    },
    onError: (error) => {
      console.error('Error releasing task:', error)
      toast.error(error.message || 'Erreur lors de la libération de la tâche')
    },
  })
}
