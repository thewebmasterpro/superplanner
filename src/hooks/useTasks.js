import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { useContextStore } from '../stores/contextStore'

export function useTasks() {
  const activeContextId = useContextStore(state => state.activeContextId)

  return useQuery({
    queryKey: ['tasks', activeContextId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      let query = supabase
        .from('tasks')
        .select(`
          *,
          category:task_categories(name, color),
          project:projects(name),
          parent_meeting:parent_meeting_id(id, title, type),
          task_tags(tag:tags(id, name, color)),
          campaign:campaigns(name),
          context:contexts(name, color)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Filter logic for Trash/Archive
      if (activeContextId === 'trash') {
        query = query.not('deleted_at', 'is', null)
      } else if (activeContextId === 'archive') {
        query = query.is('deleted_at', null).not('archived_at', 'is', null)
      } else {
        // Default view: Not deleted, Not archived
        query = query.is('deleted_at', null).is('archived_at', null)

        // Context filter (normal)
        if (activeContextId && activeContextId !== 'all') {
          query = query.eq('context_id', activeContextId)
        }
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
  })
}

// Hook to move task to trash (soft delete)
export function useMoveToTrash() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
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
      const { error } = await supabase
        .from('tasks')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
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
      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: null, archived_at: null })
        .eq('id', id)

      if (error) throw error
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
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
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

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Sanitize empty strings to null
      const sanitizedData = { ...taskData }
      Object.keys(sanitizedData).forEach(key => {
        if (sanitizedData[key] === '') {
          sanitizedData[key] = null
        }
      })

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...sanitizedData,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created successfully!')
    },
    onError: (error) => {
      toast.error(`Failed to create task: ${error.message}`)
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      // Get the current task first (to check recurrence)
      const { data: currentTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()

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
        sanitizedUpdates.completed_at = null
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Handle recurrence: create next instance if marking as done
      console.log('🔍 Checking recurrence conditions:', {
        statusIsDone: sanitizedUpdates.status === 'done',
        hasRecurrence: !!currentTask?.recurrence,
        recurrenceValue: currentTask?.recurrence,
        hasDueDate: !!currentTask?.due_date,
        dueDateValue: currentTask?.due_date,
        hasScheduledTime: !!currentTask?.scheduled_time,
        scheduledTimeValue: currentTask?.scheduled_time
      })

      if (sanitizedUpdates.status === 'done' && currentTask?.recurrence && (currentTask?.due_date || currentTask?.scheduled_time)) {
        console.log('🔄 Recurrence triggered for task:', currentTask.title)
        try {
          // Use due_date if available, otherwise extract date from scheduled_time
          const referenceDate = currentTask.due_date || (currentTask.scheduled_time ? currentTask.scheduled_time.split('T')[0] : null)
          if (!referenceDate) {
            console.log('⚠️ No valid date found for recurrence')
            return data
          }
          console.log('📅 Reference date for recurrence:', referenceDate)

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
            const { data: { user } } = await supabase.auth.getUser()

            // Calculate the new due_date as a string
            const newDueDate = nextDate.toISOString().split('T')[0]
            console.log('📅 New due_date:', newDueDate)

            // If there's a scheduled_time, update it with the new date but keep the same time
            let newScheduledTime = null
            if (currentTask.scheduled_time) {
              const originalTime = currentTask.scheduled_time.split('T')[1] // Get the time part (e.g., "11:00:00+00:00")
              newScheduledTime = `${newDueDate}T${originalTime}`
              console.log('🕐 New scheduled_time:', newScheduledTime)
            }

            // Build the new task object, only including fields that exist
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
              recurrence_end: currentTask.recurrence_end
            }

            // Only add type and agenda if they exist (V2 migration)
            if ('type' in currentTask) newTask.type = currentTask.type
            if ('agenda' in currentTask) newTask.agenda = currentTask.agenda

            console.log('📝 Creating next occurrence:', newTask)
            const { error: insertError } = await supabase.from('tasks').insert(newTask)

            if (insertError) {
              console.error('❌ Error creating recurring task:', insertError)
              // Don't throw - let the main update succeed even if recurrence fails
            } else {
              console.log('✅ Next occurrence created successfully!')
            }
          }
        } catch (recurrenceError) {
          console.error('Recurrence handling error:', recurrenceError)
          // Don't throw - let the main update succeed even if recurrence fails
        }
      }

      return data
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

// Fallback for legacy useDeleteTask (now maps to useMoveToTrash for safety, or permanent if specified)
export function useDeleteTask() {
  const moveToTrash = useMoveToTrash()
  return moveToTrash
}
