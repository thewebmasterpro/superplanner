/**
 * Tasks Hooks
 *
 * React Query hooks for task operations.
 * These hooks connect React Query to the tasks service layer.
 *
 * Benefits of this approach:
 * - Separation of concerns: React Query manages cache/state, service manages data
 * - Easy to test: service can be tested independently
 * - Reusable: service can be used outside of React (stores, scripts, etc.)
 *
 * @module hooks/useTasks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useGamificationStore } from '../stores/gamificationStore'
import { tasksService } from '../services/tasks.service'
import pb from '../lib/pocketbase'

/**
 * Query hook to fetch all tasks
 * Automatically filters by active workspace
 */
export function useTasks() {
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)

  return useQuery({
    queryKey: ['tasks', activeWorkspaceId],
    queryFn: () => tasksService.getAll({ workspaceId: activeWorkspaceId }),
  })
}

/**
 * Mutation hook to move task to trash (soft delete)
 */
export function useMoveToTrash() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksService.moveToTrash.bind(tasksService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Moved to trash')
    },
    onError: (error) => {
      toast.error(`Failed to move to trash: ${error.message}`)
    },
  })
}

/**
 * Mutation hook to archive task
 */
export function useArchiveTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksService.archive.bind(tasksService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task archived')
    },
    onError: (error) => {
      toast.error(`Failed to archive task: ${error.message}`)
    },
  })
}

/**
 * Mutation hook to restore task (from trash or archive)
 */
export function useRestoreTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksService.restore.bind(tasksService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task restored')
    },
    onError: (error) => {
      toast.error(`Failed to restore task: ${error.message}`)
    },
  })
}

/**
 * Mutation hook to permanently delete task (only for trash)
 */
export function usePermanentDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksService.permanentDelete.bind(tasksService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task permanently deleted')
    },
    onError: (error) => {
      toast.error(`Failed to delete task: ${error.message}`)
    },
  })
}

/**
 * Mutation hook to bulk restore tasks
 */
export function useBulkRestoreTasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksService.bulkRestore.bind(tasksService),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`${ids.length} tasks restored`)
    },
    onError: (error) => {
      toast.error(`Failed to restore tasks: ${error.message}`)
    },
  })
}

/**
 * Mutation hook to bulk permanent delete tasks
 */
export function useBulkPermanentDeleteTasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksService.bulkPermanentDelete.bind(tasksService),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`${ids.length} tasks permanently deleted`)
    },
    onError: (error) => {
      toast.error(`Failed to delete tasks: ${error.message}`)
    },
  })
}

/**
 * Mutation hook to bulk move to trash
 */
export function useBulkMoveToTrash() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksService.bulkMoveToTrash.bind(tasksService),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`${ids.length} tasks moved to trash`)
    },
    onError: (error) => {
      toast.error(`Failed to move tasks to trash: ${error.message}`)
    },
  })
}

/**
 * Mutation hook to empty trash (permanently delete all trashed tasks)
 */
export function useEmptyTrash() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksService.emptyTrash.bind(tasksService),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`Trash emptied (${count} tasks deleted)`)
    },
    onError: (error) => {
      toast.error(`Failed to empty trash: ${error.message}`)
    },
  })
}

/**
 * Mutation hook to empty archive (move all archived to trash)
 */
export function useEmptyArchive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksService.emptyArchive.bind(tasksService),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`Archive emptied (${count} tasks moved to trash)`)
    },
    onError: (error) => {
      toast.error(`Failed to empty archive: ${error.message}`)
    },
  })
}

/**
 * Mutation hook to create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksService.create.bind(tasksService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created successfully!')
    },
    onError: (error) => {
      console.error("Task creation failed:", error)

      // Handle PocketBase validation errors
      if (error.data && error.data.data) {
        console.error("Validation errors:", error.data.data)
        const fieldErrors = Object.entries(error.data.data)
          .map(([field, err]) => `${field}: ${err.message}`)
          .join(', ')
        toast.error(`Failed to create task: ${fieldErrors}`)
      } else {
        toast.error(`Failed to create task: ${error.message}`)
      }
    },
  })
}

/**
 * Mutation hook to update a task
 * Automatically handles recurrence and completed_at
 */
export function useUpdateTask() {
  const queryClient = useQueryClient()
  const { fetchUserPoints } = useGamificationStore()
  const user = pb.authStore.model

  return useMutation({
    mutationFn: ({ id, updates }) => tasksService.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task updated successfully!')

      // Refresh gamification points if task was marked as done
      if (variables.updates.status === 'done' && user) {
        setTimeout(() => {
          fetchUserPoints(user.id)
        }, 500) // Small delay to ensure backend has processed the points
      }
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`)
    },
  })
}

/**
 * Alias for useMoveToTrash (backward compatibility)
 */
export function useDeleteTask() {
  return useMoveToTrash()
}
