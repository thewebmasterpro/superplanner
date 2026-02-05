/**
 * Projects Service
 *
 * Centralized service for all project-related operations.
 * Abstracts PocketBase API calls and provides clean, reusable methods.
 *
 * @module services/projects.service
 */

import pb from '../lib/pocketbase'
import { escapeFilterValue } from '../lib/filterUtils'

class ProjectsService {
    /**
     * Fetch all projects with optional filtering
     *
     * @param {Object} options - Filter options
     * @param {string|null} options.workspaceId - Filter by workspace ('all' or specific ID)
     * @param {string} options.status - Filter by status ('active', 'archived', 'all')
     * @param {string} options.search - Search term
     * @returns {Promise<Array>} Array of project records
     */
    async getAll({ workspaceId = null, status = 'all', search = '' } = {}) {
        const user = pb.authStore.model
        if (!user) return []

        const filters = this._buildFilters(workspaceId, status, search, user.id)
        const filterString = filters.join(' && ')

        try {
            const options = {
                sort: '-created',
                expand: 'context_id,contact_id',
                requestKey: null
            }

            if (filterString) {
                options.filter = filterString
            }

            return await pb.collection('projects').getFullList(options)
        } catch (error) {
            console.error('Error fetching projects:', error)
            return []
        }
    }

    /**
     * Get a single project by ID
     *
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async getOne(id) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const record = await pb.collection('projects').getOne(id)
        if (record.user_id !== user.id) {
            throw new Error('Unauthorized: Cannot access this project')
        }
        return record
    }

    /**
     * Create a new project
     *
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async create(data) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const sanitized = this._sanitize(data)

        return await pb.collection('projects').create({
            ...sanitized,
            user_id: user.id
        })
    }

    /**
     * Update a project
     *
     * @param {string} id
     * @param {Object} updates
     * @returns {Promise<Object>}
     */
    async update(id, updates) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        // Verify ownership
        const existing = await this.getOne(id)
        if (existing.user_id !== user.id) {
            throw new Error('Unauthorized')
        }

        const sanitized = this._sanitize(updates)
        return await pb.collection('projects').update(id, sanitized)
    }

    /**
     * Delete a project
     *
     * @param {string} id
     * @returns {Promise<void>}
     */
    async delete(id) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const existing = await this.getOne(id)
        if (existing.user_id !== user.id) {
            throw new Error('Unauthorized')
        }

        return await pb.collection('projects').delete(id)
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Build PocketBase filter string
     */
    _buildFilters(workspaceId, status, search, userId) {
        const filters = []

        filters.push(`user_id = "${userId}"`)

        if (workspaceId && workspaceId !== 'all') {
            // MIGRATION FIX: Include projects with NO workspace so they don't disappear
            filters.push(`(context_id = "${workspaceId}" || context_id = "" || context_id = null)`)
        }

        if (status && status !== 'all') {
            filters.push(`status = "${status}"`)
        }

        if (search) {
            // ✅ SECURITY: Using escapeFilterValue
            const escaped = escapeFilterValue(search)
            filters.push(`name ~ "${escaped}"`)
        }

        return filters
    }

    /**
     * Sanitize data
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

export const projectsService = new ProjectsService()
