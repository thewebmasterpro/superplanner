/**
 * Tasks Service
 *
 * Centralized service for all task-related operations.
 * Abstracts PocketBase API calls and provides clean, reusable methods.
 *
 * @module services/tasks.service
 */

import pb from '../lib/pocketbase'

class TasksService {
  /**
   * Fetch all tasks with optional filtering
   *
   * @param {Object} options - Filter options
   * @param {string|null} options.workspaceId - Filter by workspace ('all', 'trash', 'archive', or workspace ID)
   * @param {string|null} options.type - Filter by task type (e.g., 'meeting')
   * @param {string|null} options.status - Filter by status
   * @returns {Promise<Array>} Array of task records
   */
  async getAll({ workspaceId = null, type = null, status = null } = {}) {
    const user = pb.authStore.model
    if (!user) return []

    const filters = this._buildFilters(workspaceId, type, status)
    const filterString = filters.join(' && ')

    try {
      const options = {
        sort: '-id',
        expand: 'category_id,project_id,context_id,tags',
        requestKey: null // Disable auto-cancellation for reliable fetching
      }

      if (filterString) {
        options.filter = filterString
      }

      return await pb.collection('tasks').getFullList(options)
    } catch (error) {
      // Fallback: try without expand (relations may have issues)
      try {
        const options = {
          sort: '-id',
          requestKey: null
        }
        if (filterString) {
          options.filter = filterString
        }

        return await pb.collection('tasks').getFullList(options)
      } catch (fallbackError) {
        console.error('Failed to fetch tasks:', fallbackError)
        return []
      }
    }
  }

  /**
   * Get a single task by ID
   *
   * @param {string} id - Task ID
   * @returns {Promise<Object>} Task record
   */
  async getOne(id) {
    return await pb.collection('tasks').getOne(id, {
      expand: 'category_id,project_id,context_id,tags'
    })
  }

  /**
   * Create a new task
   *
   * @param {Object} data - Task data
   * @returns {Promise<Object>} Created task record
   */
  async create(data) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const sanitized = this._sanitize(data)

    // Default assignments
    if (!sanitized.user_id) sanitized.user_id = user.id
    if (!sanitized.status) sanitized.status = 'todo'

    const createdTask = await pb.collection('tasks').create(sanitized)

    // Trigger automation for critical tasks
    // We import locally to update circular deps or just clean structure
    try {
      const { automationService } = await import('./automation.service')
      automationService.notifyCriticalTask(createdTask)
    } catch (e) {
      console.warn('Failed to trigger automation:', e)
    }

    return createdTask
  }

  /**
   * Update a task
   *
   * @param {string} id - Task ID
   * @param {Object} data - Updates
   * @returns {Promise<Object>} Updated task record
   */
  async update(id, data) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const sanitized = this._sanitize(data)

    // Handle status changes (completed_at)
    if (sanitized.status === 'done') {
      sanitized.completed_at = new Date().toISOString()
      // If recurring, handle potential next occurrence creation
      // Note: In a real app, we might check if it WASN'T done before.
      // For simplicity, we check recurrence here. However, checking previous state requires getOne.
      // To save bandwidth, we'll just update first then checking recurrence logic in _handleRecurrence
      // which might need the UPDATED object or OLD object. 
      // Better: Fetch old, if not done and new is done -> recur.
      // But let's assume _handleRecurrence takes the *updated* record or we do it optimistically.
    } else if (sanitized.status && sanitized.status !== 'done') {
      sanitized.completed_at = null
    }

    const updatedTask = await pb.collection('tasks').update(id, sanitized)

    // Handle Recurrence Logic if task is done
    if (sanitized.status === 'done' || updatedTask.status === 'done') {
      await this._handleRecurrence(updatedTask)
    }

    return updatedTask
  }

  /**
   * Archive a task (soft delete variant / status change)
   * 
   * @param {string} id 
   */
  async archive(id) {
    return await pb.collection('tasks').update(id, {
      archived_at: new Date().toISOString()
    })
  }

  /**
   * Restore a task (from trash or archive)
   * 
   * @param {string} id 
   */
  async restore(id) {
    return await pb.collection('tasks').update(id, {
      deleted_at: '',
      archived_at: ''
    })
  }

  /**
   * Move task to trash (soft delete)
   * 
   * @param {string} id 
   */
  async moveToTrash(id) {
    return await pb.collection('tasks').update(id, {
      deleted_at: new Date().toISOString()
    })
  }

  /**
   * Permanently delete a task
   * 
   * @param {string} id 
   */
  async permanentDelete(id) {
    try {
      return await pb.collection('tasks').delete(id)
    } catch (error) {
      // Cleanup related records that might prevent deletion
      try {
        // 1. Time Logs
        const timeLogs = await pb.collection('task_time_logs').getFullList({ filter: `task_id="${id}"` })
        await Promise.all(timeLogs.map(l => pb.collection('task_time_logs').delete(l.id)))

        // 2. Comments
        const comments = await pb.collection('task_comments').getFullList({ filter: `task_id="${id}"` })
        await Promise.all(comments.map(c => pb.collection('task_comments').delete(c.id)))

        // 3. Dependencies (Blockers & Blocking)
        const deps = await pb.collection('task_dependencies').getFullList({ filter: `task_id="${id}" || blocker_id="${id}"` })
        await Promise.all(deps.map(d => pb.collection('task_dependencies').delete(d.id)))

        // Retry delete
        return await pb.collection('tasks').delete(id)
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError)
        throw error // Throw original error if cleanup fails
      }
    }
  }

  /**
   * Bulk update tasks
   * 
   * @param {string[]} ids - Array of task IDs
   * @param {Object} updates - Updates to apply
   * @returns {Promise<void>}
   */
  async bulkUpdate(ids, updates) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    // Sanitize updates
    const sanitized = this._sanitize(updates)

    // Handle special fields logic
    if (sanitized.status === 'done') {
      sanitized.completed_at = new Date().toISOString()
    } else if (sanitized.status && sanitized.status !== 'done') {
      sanitized.completed_at = null
    }

    const promises = ids.map(id => pb.collection('tasks').update(id, sanitized))
    await Promise.all(promises)
  }

  /**
   * Bulk add tag to tasks
   * 
   * @param {string[]} ids - Task IDs
   * @param {string} tagId - Tag ID to add
   */
  async bulkAddTag(ids, tagId) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const filter = ids.map(id => `id="${id}"`).join(' || ')
    const tasks = await pb.collection('tasks').getFullList({ filter })

    const promises = tasks.map(task => {
      const currentTags = task.tags || []
      if (currentTags.includes(tagId)) return Promise.resolve()

      return pb.collection('tasks').update(task.id, {
        tags: [...currentTags, tagId]
      })
    })

    await Promise.all(promises)
  }

  /**
   * Bulk restore tasks
   * @param {string[]} ids 
   */
  async bulkRestore(ids) {
    const promises = ids.map(id => this.restore(id))
    await Promise.all(promises)
  }

  /**
   * Bulk move to trash
   * @param {string[]} ids 
   */
  async bulkMoveToTrash(ids) {
    const promises = ids.map(id => this.moveToTrash(id))
    await Promise.all(promises)
  }

  /**
   * Bulk permanent delete
   * @param {string[]} ids 
   */
  async bulkPermanentDelete(ids) {
    const promises = ids.map(id => this.permanentDelete(id))
    await Promise.all(promises)
  }

  /**
   * Empty trash (delete all soft-deleted)
   * @returns {Promise<number>} Count of deleted tasks
   */
  async emptyTrash() {
    const user = pb.authStore.model
    if (!user) return 0

    const tasks = await pb.collection('tasks').getFullList({
      filter: `user_id = "${user.id}" && deleted_at != ""`
    })

    if (tasks.length === 0) return 0

    await Promise.all(tasks.map(t => pb.collection('tasks').delete(t.id)))
    return tasks.length
  }

  /**
   * Empty archive (move all archived to trash)
   * @returns {Promise<number>} Count of moved tasks
   */
  async emptyArchive() {
    const user = pb.authStore.model
    if (!user) return 0

    const tasks = await pb.collection('tasks').getFullList({
      filter: `user_id = "${user.id}" && archived_at != "" && deleted_at = ""`
    })

    if (tasks.length === 0) return 0

    await Promise.all(tasks.map(t => this.moveToTrash(t.id)))
    return tasks.length
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Build PocketBase filter string based on workspace selection
   *
   * @private
   * @param {string|null} workspaceId - Workspace ID or special value ('all', 'trash', 'archive')
   * @param {string|null} type - Task type
   * @param {string|null} status - Task status
   * @returns {string[]} Array of filter conditions
   */
  _buildFilters(workspaceId, type, status) {
    const filters = []

    // Handle special views
    if (workspaceId === 'trash') {
      filters.push('(deleted_at != "" && deleted_at != null)')
    } else if (workspaceId === 'archive') {
      filters.push('(deleted_at = "" || deleted_at = null)')
      filters.push('(archived_at != "" && archived_at != null)')
    } else {
      // Default view: non-deleted, non-archived tasks
      filters.push('(deleted_at = "" || deleted_at = null)')
      filters.push('(archived_at = "" || archived_at = null)')

      // Filter by workspace if specified
      if (workspaceId && workspaceId !== 'all') {
        filters.push(`context_id = "${workspaceId}"`)
      }
    }

    if (type) {
      filters.push(`type = "${type}"`)
    }

    if (status) {
      filters.push(`status = "${status}"`)
    }

    return filters
  }

  /**
   * Sanitize data by converting empty strings to null
   * PocketBase requires null for optional fields, not empty strings
   *
   * @private
   * @param {Object} data - Data to sanitize
   * @returns {Object} Sanitized data
   */
  _sanitize(data) {
    const sanitized = { ...data }
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === '') {
        sanitized[key] = null
      }
    })
    return sanitized
  }

  /**
   * Handle task recurrence
   * Creates next occurrence if task is recurring and marked as done
   *
   * @private
   * @param {Object} task - Current task record
   * @returns {Promise<Object|null>} Next task record or null
   */
  async _handleRecurrence(task) {
    // Only handle if task has recurrence and a due date
    if (!task.recurrence || (!task.due_date && !task.scheduled_time)) {
      return null
    }

    try {
      // Use due_date if available, otherwise extract date from scheduled_time
      const referenceDate = task.due_date ||
        (task.scheduled_time ? task.scheduled_time.split('T')[0] : null)

      if (!referenceDate) return null

      const dueDate = new Date(referenceDate)
      let nextDate = new Date(dueDate)

      // Calculate next occurrence based on recurrence pattern
      switch (task.recurrence) {
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
        default:
          return null
      }

      // Check if next date exceeds recurrence_end
      if (task.recurrence_end && nextDate > new Date(task.recurrence_end)) {
        return null
      }

      const user = pb.authStore.model
      if (!user) return null

      // Format new due date
      const newDueDate = nextDate.toISOString().split('T')[0]

      // Update scheduled_time if it exists
      let newScheduledTime = null
      if (task.scheduled_time) {
        const originalTime = task.scheduled_time.split('T')[1]
        newScheduledTime = `${newDueDate}T${originalTime}`
      }

      // Create next task instance
      const newTask = {
        user_id: user.id,
        title: task.title,
        description: task.description,
        status: 'todo',
        priority: task.priority,
        due_date: newDueDate,
        duration: task.duration,
        scheduled_time: newScheduledTime,
        category_id: task.category_id,
        project_id: task.project_id,
        context_id: task.context_id,
        recurrence: task.recurrence,
        recurrence_end: task.recurrence_end,
        type: task.type,
        agenda: task.agenda
      }

      const nextTaskRecord = await pb.collection('tasks').create(newTask)
      return nextTaskRecord
    } catch (error) {
      console.error('❌ Recurrence handling error:', error)
      // Don't throw - recurrence failure shouldn't fail the update
      return null
    }
  }
}

// Export singleton instance
export const tasksService = new TasksService()
