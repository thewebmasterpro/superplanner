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
        requestKey: null,
      }

      if (filterString) {
        options.filter = filterString
      }

      return await pb.collection('tasks').getFullList(options)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      return []
    }
  }

  /**
   * Fetch tasks by campaign ID
   *
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Array>} Array of task records
   */
  async getByCampaign(campaignId) {
    try {
      return await pb.collection('tasks').getFullList({
        filter: `campaign_id = "${campaignId}" && (deleted_at = "" || deleted_at = null)`,
        sort: 'due_date',
        requestKey: null,
      })
    } catch (error) {
      console.error('Failed to fetch campaign tasks:', error)
      return []
    }
  }

  /**
   * Get a single task by ID
   *
   * @param {string} id - Task ID
   * @returns {Promise<Object>} Task record
   */
  async getOne(id) {
    return await pb.collection('tasks').getOne(id)
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

    // Extract relation fields that PocketBase may silently reject during create
    const teamId = sanitized.team_id
    delete sanitized.team_id

    // Step 1: Create task without relation fields
    let createdTask = await pb.collection('tasks').create(sanitized)

    // Step 2: Update with relation fields if provided
    if (teamId) {
      createdTask = await pb.collection('tasks').update(createdTask.id, {
        team_id: teamId
      })
    }

    // Trigger automation for critical tasks
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

    // Handle Recurrence Logic and Gamification if task is done
    if (sanitized.status === 'done' || updatedTask.status === 'done') {
      await this._handleRecurrence(updatedTask)

      // Gamification hook - award points for task completion
      try {
        const { gamificationService } = await import('./gamification.service')
        await gamificationService.onTaskCompleted(updatedTask.id, updatedTask.user_id)
      } catch (e) {
        console.error('Gamification failed:', e)
      }
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

    // Use this.update() for each task to trigger gamification hooks
    const promises = ids.map(id => this.update(id, updates))
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

  /**
   * Fetch pool tasks for a team (unassigned team tasks)
   * @param {string} teamId - Team ID
   * @returns {Promise<Array>} Array of unassigned team tasks
   */
  async getPoolTasks(teamId) {
    if (!teamId) return []

    try {
      const results = await pb.collection('tasks').getFullList({
        filter: `team_id = "${teamId}" && status = "unassigned" && (deleted_at = "" || deleted_at = null) && (archived_at = "" || archived_at = null)`,
        sort: '-created',
        requestKey: null,
      })
      return results
    } catch (error) {
      console.warn('Pool server filter failed:', error.message)
      try {
        const allTasks = await pb.collection('tasks').getFullList({
          sort: '-created',
          requestKey: null,
        })
        return allTasks.filter(t =>
          t.team_id === teamId &&
          t.status === 'unassigned' &&
          !t.deleted_at &&
          !t.archived_at
        )
      } catch (fallbackError) {
        console.error('Pool fallback also failed:', fallbackError)
        return []
      }
    }
  }

  /**
   * Create a pool task (team task with unassigned status)
   * @param {Object} data - Task data
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} Created pool task
   */
  async createPoolTask(data, teamId) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')
    if (!teamId) throw new Error('Team ID is required for pool tasks')

    const sanitized = this._sanitize(data)

    // Pool-specific fields
    sanitized.user_id = user.id
    sanitized.status = 'unassigned'
    sanitized.assigned_to = null

    // Remove team_id from create payload (two-step pattern for relations)
    delete sanitized.team_id

    // Step 1: Create task without team_id relation
    const createdTask = await pb.collection('tasks').create(sanitized)

    // Step 2: Set team_id relation via update
    const finalTask = await pb.collection('tasks').update(createdTask.id, {
      team_id: teamId
    })

    return finalTask
  }

  /**
   * Claim a team task (member takes ownership)
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Updated task
   */
  async claimTask(taskId) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const task = await pb.collection('tasks').getOne(taskId)

    // Verify it's a team task and unassigned
    if (!task.team_id || task.assigned_to || task.status !== 'unassigned') {
      throw new Error('Task is not available in the pool')
    }

    // Claim the task
    return await pb.collection('tasks').update(taskId, {
      assigned_to: user.id,
      user_id: user.id,
      claimed_at: new Date().toISOString(),
      claimed_by: user.id,
      status: 'todo'
    })
  }

  /**
   * Release a claimed task back to the pool
   * @param {string} taskId - Task ID
   * @param {string} reason - Optional reason for releasing
   * @returns {Promise<Object>} Updated task
   */
  async releaseTask(taskId, reason = '') {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const task = await pb.collection('tasks').getOne(taskId)

    // Verify user owns this task
    if (task.assigned_to !== user.id) {
      throw new Error('You can only release tasks assigned to you')
    }

    // Verify it's a team task
    if (!task.team_id) {
      throw new Error('Only team tasks can be released to the pool')
    }

    // Release back to pool
    const updates = {
      assigned_to: null,
      user_id: null,
      status: 'unassigned'
    }

    // Add release reason as a comment if provided
    if (reason) {
      try {
        await pb.collection('task_comments').create({
          task_id: taskId,
          user_id: user.id,
          content: `📤 Tâche libérée: ${reason}`
        })
      } catch (e) {
        console.warn('Failed to add release comment:', e)
      }
    }

    return await pb.collection('tasks').update(taskId, updates)
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
        reminder_minutes: task.reminder_minutes,
        category_id: task.category_id,
        project_id: task.project_id,
        context_id: task.context_id,
        recurrence: task.recurrence,
        recurrence_end: task.recurrence_end,
        recurrence_rule: task.recurrence_rule,
        type: task.type,
        agenda: task.agenda,
        // Meeting-specific fields
        location: task.location,
        meeting_link: task.meeting_link,
        // Note: start_time and end_time need to be shifted like scheduled_time
        start_time: task.start_time ? `${newDueDate}T${task.start_time.split('T')[1]}` : null,
        end_time: task.end_time ? `${newDueDate}T${task.end_time.split('T')[1]}` : null,
      }

      return await pb.collection('tasks').create(newTask)
    } catch (error) {
      console.error('Recurrence handling error:', error)
      return null
    }
  }
}

// Export singleton instance
export const tasksService = new TasksService()
