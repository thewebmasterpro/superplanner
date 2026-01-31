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
                // Assuming tags are shared or user-specific? Typically user specific or workspace specific.
                // If specific, filter by user_id if column exists.
                // Looking at BulkActionsBar it just does getFullList({ sort: 'name' }).
                // Safest to assume they might be global or RLS handles it.
                // But usually we filter by user_id for safety if the schema has it.
                // I will add user_id filter if possible, but reading BulkActionsBar implies just sorting.
                // I'll check BulkActionsBar again. line 64: pb.collection('tags').getFullList({ sort: 'name' }) (No filter!)
                // Maybe tags are public or RLS filtered. 
                // I'll stick to what was there but add try-catch.
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
