/**
 * Time Tracking Service
 *
 * Centralized service for task time tracking operations.
 * Manages time logs for tasks (start, stop, pause, resume).
 *
 * @module services/timeTracking.service
 */

import pb from '../lib/pocketbase'

class TimeTrackingService {
    /**
     * Start tracking time for a task
     *
     * @param {string} taskId - Task ID
     * @param {string} description - Optional description
     * @returns {Promise<Object>} Created time log
     * @throws {Error} If not authenticated
     */
    async startTracking(taskId, description = '') {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        return await pb.collection('task_time_logs').create({
            task_id: taskId,
            user_id: user.id,
            start_time: new Date().toISOString(),
            description: description,
            is_running: true
        })
    }

    /**
     * Stop tracking time for a log
     *
     * @param {string} logId - Time log ID
     * @param {number} duration - Duration in seconds
     * @returns {Promise<Object>} Updated time log
     * @throws {Error} If not authenticated
     */
    async stopTracking(logId, duration) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        return await pb.collection('task_time_logs').update(logId, {
            end_time: new Date().toISOString(),
            duration: duration,
            is_running: false
        })
    }

    /**
     * Get a time log by ID
     *
     * @param {string} logId - Time log ID
     * @returns {Promise<Object>} Time log record
     * @throws {Error} If not authenticated or unauthorized
     */
    async getLogById(logId) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const log = await pb.collection('task_time_logs').getOne(logId)

        // Verify ownership
        if (log.user_id !== user.id) {
            throw new Error('Unauthorized: Cannot access this time log')
        }

        return log
    }

    /**
     * Get all time logs for a task
     *
     * @param {string} taskId - Task ID
     * @param {Object} options - Filter options
     * @returns {Promise<Array>} Array of time logs
     */
    async getLogsForTask(taskId, options = {}) {
        const user = pb.authStore.model
        if (!user) return []

        try {
            const filters = [`task_id = "${taskId}"`, `user_id = "${user.id}"`]

            const queryOptions = {
                filter: filters.join(' && '),
                sort: '-start_time'
            }

            return await pb.collection('task_time_logs').getFullList(queryOptions)
        } catch (error) {
            console.error('❌ Error fetching time logs:', error)
            return []
        }
    }

    /**
     * Get total time spent on a task
     *
     * @param {string} taskId - Task ID
     * @returns {Promise<number>} Total duration in seconds
     */
    async getTotalTimeForTask(taskId) {
        const logs = await this.getLogsForTask(taskId)
        return logs.reduce((total, log) => total + (log.duration || 0), 0)
    }

    /**
     * Pause tracking (optional - if needed)
     *
     * @param {string} logId - Time log ID
     * @returns {Promise<Object>} Updated time log
     */
    async pauseTracking(logId) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        return await pb.collection('task_time_logs').update(logId, {
            is_running: false,
            paused_at: new Date().toISOString()
        })
    }

    /**
     * Resume tracking (optional - if needed)
     *
     * @param {string} logId - Time log ID
     * @returns {Promise<Object>} Updated time log
     */
    async resumeTracking(logId) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        return await pb.collection('task_time_logs').update(logId, {
            is_running: true,
            paused_at: null
        })
    }

    /**
     * Delete a time log
     *
     * @param {string} logId - Time log ID
     * @returns {Promise<void>}
     * @throws {Error} If not authenticated or unauthorized
     */
    async delete(logId) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        // Verify ownership
        const log = await this.getLogById(logId)
        if (log.user_id !== user.id) {
            throw new Error('Unauthorized: Cannot delete this time log')
        }

        return await pb.collection('task_time_logs').delete(logId)
    }
}

export const timeTrackingService = new TimeTrackingService()
