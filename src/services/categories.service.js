/**
 * Categories Service
 *
 * Centralized service for all category-related operations.
 * Abstracts PocketBase API calls and provides clean, reusable methods.
 *
 * @module services/categories.service
 */

import pb from '../lib/pocketbase'
import { escapeFilterValue } from '../lib/filterUtils'

class CategoriesService {
    /**
     * Fetch all categories with optional filtering
     *
     * @param {Object} options - Filter options
     * @param {string} options.search - Search term
     * @returns {Promise<Array>} Array of category records
     */
    async getAll({ search = '', workspaceId = null } = {}) {
        const user = pb.authStore.model
        if (!user) return []

        const filters = this._buildFilters(search, user.id, workspaceId)
        const filterString = filters.join(' && ')

        try {
            const options = {
                sort: 'name',
                skipTotal: false, // Required for older PocketBase servers
            }

            if (filterString) {
                options.filter = filterString
            }

            return await pb.collection('task_categories').getFullList(options)
        } catch (error) {
            console.error('❌ Error fetching categories:', error)
            return []
        }
    }

    /**
     * Get a single category by ID
     * Verifies ownership before returning
     *
     * @param {string} id - Category ID
     * @returns {Promise<Object>} Category record
     * @throws {Error} If not authenticated or unauthorized
     */
    async getOne(id) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        // Note: getOne(id) is safe by design, ID comes from DB
        const record = await pb.collection('task_categories').getOne(id)

        // Verify ownership
        if (record.user_id !== user.id) {
            throw new Error('Unauthorized: Cannot access this category')
        }

        return record
    }

    /**
     * Create a new category
     *
     * @param {Object} data - Category data
     * @returns {Promise<Object>} Created category record
     * @throws {Error} If user not authenticated
     */
    async create(data) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const sanitized = this._sanitize(data)

        return await pb.collection('task_categories').create({
            ...sanitized,
            user_id: user.id
        })
    }

    /**
     * Update a category
     * Verifies ownership before updating
     *
     * @param {string} id - Category ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated category record
     * @throws {Error} If not authenticated or unauthorized
     */
    async update(id, updates) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const existing = await this.getOne(id)
        if (existing.user_id !== user.id) {
            throw new Error('Unauthorized: Cannot update this category')
        }

        const sanitized = this._sanitize(updates)
        return await pb.collection('task_categories').update(id, sanitized)
    }

    /**
     * Delete a category
     * Verifies ownership before deletion
     *
     * @param {string} id - Category ID
     * @returns {Promise<void>}
     * @throws {Error} If not authenticated or unauthorized
     */
    async delete(id) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const existing = await this.getOne(id)
        if (existing.user_id !== user.id) {
            throw new Error('Unauthorized: Cannot delete this category')
        }

        return await pb.collection('task_categories').delete(id)
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Build PocketBase filter string
     *
     * @private
     * @param {string} search - Search term
     * @param {string} userId - User ID
     * @returns {string[]} Array of filter conditions
     */
    _buildFilters(search, userId, workspaceId = null) {
        const filters = []

        filters.push(`user_id = "${userId}"`)

        if (workspaceId && workspaceId !== 'all') {
            filters.push(`(context_id = "${workspaceId}" || context_id = "" || context_id = null)`)
        }

        if (search) {
            const escaped = escapeFilterValue(search)
            filters.push(`name ~ "${escaped}"`)
        }

        return filters
    }

    /**
     * Sanitize data
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
}

export const categoriesService = new CategoriesService()
