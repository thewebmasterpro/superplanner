/**
 * Comments Service
 *
 * Centralized service for task comments.
 *
 * @module services/comments.service
 */

import pb from '../lib/pocketbase'

class CommentsService {
    /**
     * Get comments for a task
     * @param {string} taskId 
     * @returns {Promise<Array>}
     */
    async getCommentsForTask(taskId) {
        if (!taskId) return []

        try {
            return await pb.collection('task_comments').getFullList({
                filter: `task_id = "${taskId}"`,
                sort: 'created',
                expand: 'user_id'
            })
        } catch (error) {
            console.error('Error fetching comments:', error)
            return []
        }
    }

    /**
     * Create a comment
     * @param {string} taskId 
     * @param {string} content 
     * @returns {Promise<Object>}
     */
    async create(taskId, content) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        return await pb.collection('task_comments').create({
            task_id: taskId,
            content: content,
            user_id: user.id
        })
    }

    /**
     * Delete a comment
     * @param {string} commentId 
     */
    async delete(commentId) {
        return await pb.collection('task_comments').delete(commentId)
    }

    /**
     * Subscribe to comments for a task
     * @param {string} taskId
     * @param {Function} callback
     * @returns {Promise<Function>} unsubscribe function
     */
    async subscribe(taskId, callback) {
        if (!taskId) return () => { }

        // Subscribe to all comment changes, filter inside if needed, 
        // or just subscribe globally to the collection and filter by task_id in the event?
        // PB subscriptions are collection-level or record-level. 
        // If we want all comments for text, we subscribe to key '*' and filter? 
        // Or simpler: subscribe to '*' and valid check task_id.

        await pb.collection('task_comments').subscribe('*', (e) => {
            if (e.record.task_id === taskId) {
                callback(e)
            }
        })

        return async () => {
            await pb.collection('task_comments').unsubscribe('*')
        }
    }
}

export const commentsService = new CommentsService()
