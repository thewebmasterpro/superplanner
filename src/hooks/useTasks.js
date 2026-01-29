import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import pb from '../lib/pocketbase'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../stores/workspaceStore'

export function useTasks() {
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)

  return useQuery({
    queryKey: ['tasks', activeWorkspaceId],
    queryFn: async () => {
      const user = pb.authStore.model
      if (!user) return []

      const filters = [`user_id = "${user.id}"`]

      // Filter logic for Trash/Archive
      // Note: In PocketBase, date fields are strings. Empty string means null/unset.
      if (activeWorkspaceId === 'trash') {
        filters.push('deleted_at != ""')
      } else if (activeWorkspaceId === 'archive') {
        filters.push('deleted_at = ""')
        filters.push('archived_at != ""')
      } else {
        // Default view (Global or Workspace): Not deleted, Not archived
        filters.push('deleted_at = ""')
        filters.push('archived_at = ""')

        // Filter by specific workspace if selected (and not 'all')
        if (activeWorkspaceId && activeWorkspaceId !== 'all') {
          filters.push(`context_id = "${activeWorkspaceId}"`)
        }
      }

      // Expand relations. 
      // Assumption: Field names match the relation names.
      // Supabase query had: category, project, tags (via task_tags), campaign, context
      const records = await pb.collection('tasks').getFullList({
        filter: filters.join(' && '),
        sort: '-created',
        expand: 'category_id,project_id,tags,campaign_id,context_id,parent_meeting_id',
      })

      return records
    },
  })
}

// Hook to move task to trash (soft delete)
export function useMoveToTrash() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await pb.collection('tasks').update(id, {
        deleted_at: new Date().toISOString()
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Moved to trash')
    },
    onError: (error) => {
      toast.error(`Failed to move to trash: ${error.message}`)
    },
  })
}

// Hook to archive task
export function useArchiveTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await pb.collection('tasks').update(id, {
        archived_at: new Date().toISOString()
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task archived')
    },
    onError: (error) => {
      toast.error(`Failed to archive task: ${error.message}`)
    },
  })
}

// Hook to restore task (from trash or archive)
export function useRestoreTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await pb.collection('tasks').update(id, {
        deleted_at: "", // PocketBase: empty string for null date
        archived_at: ""
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task restored')
    },
    onError: (error) => {
      toast.error(`Failed to restore task: ${error.message}`)
    },
  })
}

// Permanent delete (only for trash)
export function usePermanentDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await pb.collection('tasks').delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task permanently deleted')
    },
    onError: (error) => {
      toast.error(`Failed to delete task: ${error.message}`)
    },
  })
}

// Bulk restore tasks
export function useBulkRestoreTasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids) => {
      // PocketBase doesn't support bulk update in one call easily via SDK without batch (if supported) 
      // or loop. Looping is easiest for migration.
      const promises = ids.map(id => pb.collection('tasks').update(id, {
        deleted_at: "",
        archived_at: ""
      }))
      await Promise.all(promises)
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`${ids.length} tasks restored`)
    },
    onError: (error) => {
      toast.error(`Failed to restore tasks: ${error.message}`)
    },
  })
}

// Bulk permanent delete
export function useBulkPermanentDeleteTasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids) => {
      const promises = ids.map(id => pb.collection('tasks').delete(id))
      await Promise.all(promises)
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`${ids.length} tasks permanently deleted`)
    },
    onError: (error) => {
      toast.error(`Failed to delete tasks: ${error.message}`)
    },
  })
}

// Bulk move to trash
export function useBulkMoveToTrash() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids) => {
      const promises = ids.map(id => pb.collection('tasks').update(id, {
        deleted_at: new Date().toISOString()
      }))
      await Promise.all(promises)
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`${ids.length} tasks moved to trash`)
    },
    onError: (error) => {
      toast.error(`Failed to move tasks to trash: ${error.message}`)
    },
  })
}

// Empty Trash
export function useEmptyTrash() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const user = pb.authStore.model
      if (!user) throw new Error('Not authenticated')

      // Fetch all items to delete first
      // Warning: iterating to delete can be slow.
      const items = await pb.collection('tasks').getFullList({
        filter: `user_id = "${user.id}" && deleted_at != ""`
      })

      const promises = items.map(item => pb.collection('tasks').delete(item.id))
      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Trash emptied')
    },
    onError: (error) => {
      toast.error(`Failed to empty trash: ${error.message}`)
    },
  })
}

// Empty Archive (Move all archived to trash)
export function useEmptyArchive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const user = pb.authStore.model
      if (!user) throw new Error('Not authenticated')

      const items = await pb.collection('tasks').getFullList({
        filter: `user_id = "${user.id}" && deleted_at = "" && archived_at != ""`
      })

      const promises = items.map(item => pb.collection('tasks').update(item.id, {
        deleted_at: new Date().toISOString()
      }))
      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Archive emptied (moved to trash)')
    },
    onError: (error) => {
      toast.error(`Failed to empty archive: ${error.message}`)
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskData) => {
      const user = pb.authStore.model
      if (!user) throw new Error('Not authenticated')

      // Sanitize empty strings to null or leave them (PB handles strict types, but usually forgiving)
      const sanitizedData = { ...taskData }
      Object.keys(sanitizedData).forEach(key => {
        if (sanitizedData[key] === '') {
          sanitizedData[key] = null
        }
      })

      const record = await pb.collection('tasks').create({
        ...sanitizedData,
        user_id: user.id
      })

      return record
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created successfully!')
    },
    onError: (error) => {
      console.error("Task creation failed:", error)
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

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      // Get the current task first (to check recurrence)
      const currentTask = await pb.collection('tasks').getOne(id)

      // Sanitize empty strings to null
      const sanitizedUpdates = { ...updates }
      Object.keys(sanitizedUpdates).forEach(key => {
        if (sanitizedUpdates[key] === '') {
          sanitizedUpdates[key] = null
        }
      })

      // Set completed_at if status changed to done
      if (sanitizedUpdates.status === 'done') {
        sanitizedUpdates.completed_at = new Date().toISOString()
      } else if (sanitizedUpdates.status && sanitizedUpdates.status !== 'done') {
        sanitizedUpdates.completed_at = ""
      }

      const updatedRecord = await pb.collection('tasks').update(id, sanitizedUpdates)

      // Handle recurrence: create next instance if marking as done
      // Logic copied from Supabase version
      if (sanitizedUpdates.status === 'done' && currentTask?.recurrence && (currentTask?.due_date || currentTask?.scheduled_time)) {
        try {
          // Use due_date if available, otherwise extract date from scheduled_time
          const referenceDate = currentTask.due_date || (currentTask.scheduled_time ? currentTask.scheduled_time.split('T')[0] : null)
          if (!referenceDate) return updatedRecord

          const dueDate = new Date(referenceDate)
          let nextDate = new Date(dueDate)

          switch (currentTask.recurrence) {
            case 'daily':
              nextDate.setDate(dueDate.getDate() + 1)
              break
            case 'weekly':
              nextDate.setDate(dueDate.getDate() + 7)
              break
            case 'biweekly':
              nextDate.setDate(dueDate.getDate() + 14)
              break
            case 'monthly':
              nextDate.setMonth(dueDate.getMonth() + 1)
              break
          }

          // Check if next date exceeds recurrence_end
          if (!currentTask.recurrence_end || nextDate <= new Date(currentTask.recurrence_end)) {
            const user = pb.authStore.model

            // Calculate the new due_date as a string
            const newDueDate = nextDate.toISOString().split('T')[0]

            // If there's a scheduled_time, update it with the new date but keep the same time
            let newScheduledTime = null
            if (currentTask.scheduled_time) {
              // Usually PB date strings are formatted, but let's trust the logic
              const originalTime = currentTask.scheduled_time.split('T')[1]
              newScheduledTime = `${newDueDate}T${originalTime}`
            }

            // Build the new task object
            const newTask = {
              user_id: user.id,
              title: currentTask.title,
              description: currentTask.description,
              status: 'todo',
              priority: currentTask.priority,
              due_date: newDueDate,
              duration: currentTask.duration,
              scheduled_time: newScheduledTime,
              category_id: currentTask.category_id,
              project_id: currentTask.project_id,
              recurrence: currentTask.recurrence,
              recurrence_end: currentTask.recurrence_end,
              type: currentTask.type,
              agenda: currentTask.agenda
            }

            await pb.collection('tasks').create(newTask)
            console.log('✅ Next occurrence created successfully!')
          }
        } catch (recurrenceError) {
          console.error('Recurrence handling error:', recurrenceError)
          // Don't throw
        }
      }

      return updatedRecord
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task updated successfully!')
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`)
    },
  })
}

export function useDeleteTask() {
  const moveToTrash = useMoveToTrash()
  return moveToTrash
}
