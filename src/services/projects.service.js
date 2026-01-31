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
    async getAll({ workspaceId = null, status = 'active', search = '' } = {}) {
        const user = pb.authStore.model
        if (!user) return []

        const filters = this._buildFilters(workspaceId, status, search, user.id)
        const filterString = filters.join(' && ')

        try {
            const options = {
                sort: '-id',
                expand: 'context_id,contact_id',
                requestKey: null
            }

            if (filterString) {
                options.filter = filterString
            }

            return await pb.collection('projects').getFullList(options)
        } catch (error) {
            console.error('❌ Error fetching projects:', error)

            // Level 1: Try without expand (Common failure point for new relations)
            try {
                const options = {
                    sort: '-id',
                    requestKey: null
                }
                if (filterString) {
                    options.filter = filterString
                }
                console.log('⚠️ Attempting Level 1 Fallback (No Expand)...')
                const records = await pb.collection('projects').getFullList(options)
                console.log('✅ Projects fetched (Level 1):', records.length)
                return records
            } catch (fallbackError) {
                console.error('❌ Level 1 Fallback Failed:', fallbackError)

                // Level 2: Minimal Filters (Protect against schema mismatch in filters)
                try {
                    console.log('⚠️ Attempting Level 2 Fallback (Minimal / Schema Safe)...')
                    // Only filter by user, remove sort if column missing
                    const records = await pb.collection('projects').getFullList({
                        filter: `user_id = "${user.id}"`,
                        sort: '-id', // 'created' system field always exists
                        requestKey: null
                    })
                    console.log('✅ Projects fetched (Level 2):', records.length)
                    return records
                } catch (level2Error) {
                    console.error('❌ Level 2 Fallback Failed:', level2Error)

                    // Level 3: Extreme Safe Mode (Raw Fetch)
                    try {
                        console.log('⚠️ Attempting Level 3 Fallback (Raw Fetch)...')
                        const records = await pb.collection('projects').getFullList({
                            requestKey: null
                        })
                        // Client-side filter
                        const userProjects = records.filter(p => p.user_id === user.id)
                        console.log('✅ Projects fetched (Level 3):', userProjects.length)
                        return userProjects
                    } catch (finalError) {
                        console.error('❌ Critical failure fetching projects:', finalError)
                        return []
                    }
                }
            }
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
