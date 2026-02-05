/**
 * Tags Service
 *
 * Centralized service for tag operations.
 *
 * @module services/tags.service
 */

import pb from '../lib/pocketbase'
import { escapeFilterValue } from '../lib/filterUtils'

class TagsService {
    /**
     * Fetch all tags
     *
     * @returns {Promise<Array>} Array of tag records
     */
    async getAll() {
        const user = pb.authStore.model
        if (!user) return []

        try {
            return await pb.collection('tags').getFullList({
                sort: 'name',
                requestKey: null // Disable auto-cancellation
            })
        } catch (error) {
            console.error('❌ Error fetching tags:', error)
            return []
        }
    }

    /**
     * Create a tag
     * @param {Object} data 
     */
    async create(data) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        // Sanitize data
        const sanitized = { ...data }

        return await pb.collection('tags').create(sanitized)
    }

    /**
     * Delete a tag
     * @param {string} id 
     */
    async delete(id) {
        return await pb.collection('tags').delete(id)
    }
}

export const tagsService = new TagsService()
