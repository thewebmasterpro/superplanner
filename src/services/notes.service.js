/**
 * Notes Service
 *
 * Centralized service for task notes.
 *
 * @module services/notes.service
 */

import pb from '../lib/pocketbase'

class NotesService {
    /**
     * Get notes for a task
     * @param {string} taskId 
     * @returns {Promise<Array>}
     */
    async getNotesForTask(taskId) {
        if (!taskId) return []

        try {
            return await pb.collection('task_notes').getFullList({
                filter: `task_id = "${taskId}"`,
                sort: '-created'
            })
        } catch (error) {
            console.error('Error fetching notes:', error)
            return []
        }
    }

    /**
     * Create a note
     * @param {string} taskId 
     * @param {string} content 
     * @returns {Promise<Object>}
     */
    async create(taskId, content) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        return await pb.collection('task_notes').create({
            task_id: taskId,
            content: content,
            user_id: user.id
        })
    }

    /**
     * Delete a note
     * @param {string} noteId 
     */
    async delete(noteId) {
        return await pb.collection('task_notes').delete(noteId)
    }

    /**
    * Update a note
    * @param {string} noteId 
    * @param {string} content
    */
    async update(noteId, content) {
        return await pb.collection('task_notes').update(noteId, {
            content
        })
    }
}

export const notesService = new NotesService()
