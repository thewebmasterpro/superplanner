/**
 * Search Service
 *
 * Simple PocketBase text search on tasks.
 */

import pb from '../lib/pocketbase'

class SearchService {
    /**
     * Search tasks by title or description
     * @param {string} query - The search query
     * @returns {Promise<Array>} List of matching tasks
     */
    async search(query) {
        if (!query.trim()) return []

        const user = pb.authStore.model
        if (!user) return []

        try {
            const escaped = query.replace(/"/g, '\\"')
            const records = await pb.collection('tasks').getList(1, 20, {
                filter: `user_id = "${user.id}" && (title ~ "${escaped}" || description ~ "${escaped}")`,
                sort: '-updated',
                requestKey: null
            })

            return records.items
        } catch (error) {
            console.error('Search error:', error)
            return []
        }
    }
}

export const aiService = new SearchService()
