/**
 * Backup Service
 *
 * Centralized service for data backup and restoration.
 * Handles extensive data operations across collections.
 *
 * @module services/backup.service
 */

import pb from '../lib/pocketbase'

class BackupService {
    /**
     * Get lookup data for importing tasks (contexts, campaigns, projects)
     * @returns {Promise<Object>} Object with arrays of records
     */
    async getImportMetadata() {
        const [contexts, campaigns, projects] = await Promise.all([
            pb.collection('contexts').getFullList(),
            pb.collection('campaigns').getFullList(),
            pb.collection('projects').getFullList()
        ])
        return { contexts, campaigns, projects }
    }

    /**
     * Import a single task
     * @param {Object} taskData 
     * @returns {Promise<Object>} Created task
     */
    async importTask(taskData) {
        return await pb.collection('tasks').create(taskData)
    }

    /**
     * Create multiple tasks (sequentially or parallelized by caller)
     * PocketBase SDK doesn't support bulk create natively yet.
     * @param {Array} tasksData 
     * @returns {Promise<Array>} Results
     */
    async importTasks(tasksData) {
        // Run in parallel for speed, though rate limits might apply
        // Use with caution for large imports
        const promises = tasksData.map(t => this.importTask(t))
        return await Promise.all(promises)
    }

    /**
     * Full data export (if needed later)
     * @returns {Promise<Object>}
     */
    async exportAllData() {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const [tasks, campaigns, contexts, projects] = await Promise.all([
            pb.collection('tasks').getFullList({ filter: `user_id = "${user.id}"` }),
            pb.collection('campaigns').getFullList({ filter: `user_id = "${user.id}"` }),
            pb.collection('contexts').getFullList({ filter: `user_id = "${user.id}"` }),
            pb.collection('projects').getFullList({ filter: `user_id = "${user.id}"` })
        ])

        return { tasks, campaigns, contexts, projects }
    }
}

export const backupService = new BackupService()
