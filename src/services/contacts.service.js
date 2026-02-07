/**
 * Contacts Service
 *
 * Centralized service for all contact-related operations.
 * Abstracts PocketBase API calls and provides clean, reusable methods.
 *
 * @module services/contacts.service
 */

import pb from '../lib/pocketbase'
import { escapeFilterValue } from '../lib/filterUtils'

class ContactsService {
    /**
     * Fetch all contacts with optional filtering
     *
     * @param {Object} options - Filter options
     * @param {string} options.search - Search term
     * @returns {Promise<Array>} Array of contact records
     */
    async getAll({ search = '', workspaceId = null, status = 'all' } = {}) {
        const user = pb.authStore.model
        if (!user) return []

        const filters = this._buildFilters(search, user.id, status)

        // Handle workspace filtering via junction table
        if (workspaceId && workspaceId !== 'all') {
            try {
                const escapedWorkspaceId = escapeFilterValue(workspaceId)
                const links = await pb.collection('contact_contexts').getFullList({
                    filter: `context_id = "${escapedWorkspaceId}"`,
                    fields: 'contact_id'
                })

                if (links.length === 0) {
                    return [] // No contacts in this workspace
                }

                const contactIds = links.map(l => escapeFilterValue(l.contact_id))
                // Filter by IDs: id = "a" || id = "b"
                const idFilter = contactIds.map(id => `id = "${id}"`).join(' || ')
                filters.push(`(${idFilter})`)
            } catch (e) {
                console.error('Error fetching contact context links:', e)
                return []
            }
        }

        const filterString = filters.join(' && ')

        // Remove try-catch to let React Query handle errors
        const options = {
            sort: 'name',
            requestKey: null, // Disable auto-cancellation to prevent AbortErrors on rapid refetches
            expand: 'contact_contexts(contact_id).context', // Expand related contexts for display
            skipTotal: false, // Required for older PocketBase servers
        }

        if (filterString) {
            options.filter = filterString
        }

        return await pb.collection('contacts').getFullList(options)
    }

    /**
     * Get a single contact by ID
     * Verifies ownership before returning
     *
     * @param {string} id - Contact ID
     * @returns {Promise<Object>} Contact record
     * @throws {Error} If not authenticated or unauthorized
     */
    async getOne(id) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const record = await pb.collection('contacts').getOne(id)

        // Verify ownership
        if (record.user_id !== user.id) {
            throw new Error('Unauthorized: Cannot access this contact')
        }

        return record
    }

    /**
     * Create a new contact
     *
     * @param {Object} data - Contact data
     * @returns {Promise<Object>} Created contact record
     * @throws {Error} If user not authenticated
     */
    async create(data) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const { contextIds, ...contactData } = data
        const sanitized = this._sanitize(contactData)

        const record = await pb.collection('contacts').create({
            ...sanitized,
            user_id: user.id
        })

        // Link contexts if provided
        if (contextIds && contextIds.length > 0) {
            await this._updateContextLinks(record.id, contextIds)
        }

        return record
    }

    /**
     * Update a contact
     * Verifies ownership before updating
     *
     * @param {string} id - Contact ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated contact record
     * @throws {Error} If not authenticated or unauthorized
     */
    async update(id, updates) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const existing = await this.getOne(id)
        if (existing.user_id !== user.id) {
            throw new Error('Unauthorized: Cannot update this contact')
        }

        const { contextIds, ...contactUpdates } = updates
        const sanitized = this._sanitize(contactUpdates)

        const updatedRecord = await pb.collection('contacts').update(id, sanitized, {
            expand: 'contact_contexts(contact_id).context'
        })

        // Update contexts if contextIds is provided (even if empty array)
        if (contextIds !== undefined) {
            await this._updateContextLinks(id, contextIds)
        }

        return updatedRecord
    }

    /**
     * Delete a contact
     * Verifies ownership before deletion
     *
     * @param {string} id - Contact ID
     * @returns {Promise<void>}
     * @throws {Error} If not authenticated or unauthorized
     */
    async delete(id) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const existing = await this.getOne(id)
        if (existing.user_id !== user.id) {
            throw new Error('Unauthorized: Cannot delete this contact')
        }

        // Delete related context links first (though PB cascade delete might handle this if configured)
        try {
            const links = await pb.collection('contact_contexts').getFullList({
                filter: `contact_id = "${id}"`
            })
            await Promise.all(links.map(l => pb.collection('contact_contexts').delete(l.id)))
        } catch (e) {
            console.error('Error deleting context links:', e)
        }

        return await pb.collection('contacts').delete(id)
    }

    /**
     * Bulk update contacts
     *
     * @param {string[]} ids - Array of contact IDs
     * @param {Object} updates - Updates to apply
     * @returns {Promise<void>}
     */
    async bulkUpdate(ids, updates) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const sanitized = this._sanitize(updates)
        const promises = ids.map(id => this.update(id, sanitized))
        await Promise.all(promises)
    }

    /**
     * Bulk delete contacts
     *
     * @param {string[]} ids - Array of contact IDs
     * @returns {Promise<void>}
     */
    async bulkDelete(ids) {
        const promises = ids.map(id => this.delete(id))
        await Promise.all(promises)
    }

    /**
     * Send an email to a contact
     * Uses PocketBase custom endpoint or automation webhook
     *
     * @param {Object} data - Email data
     * @param {string} data.to - Recipient email
     * @param {string} data.subject - Email subject
     * @param {string} data.html - Email body (HTML)
     * @param {string} data.contactId - Contact ID for tracking
     * @returns {Promise<Object>}
     */
    async sendEmail({ to, subject, html, contactId }) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        try {
            // Try to send via PocketBase custom endpoint
            return await pb.send('/api/send-email', {
                method: 'POST',
                body: { to, subject, html, contactId, userId: user.id }
            })
        } catch (error) {
            throw new Error('Email sending is not configured. Set up an email provider in Settings > Automation.')
        }
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Update context links for a contact
     *
     * @private
     * @param {string} contactId
     * @param {string[]} contextIds
     */
    async _updateContextLinks(contactId, contextIds) {
        try {
            // 1. Fetch existing links
            const existingLinks = await pb.collection('contact_contexts').getFullList({
                filter: `contact_id = "${contactId}"`
            })

            // 2. Determine what to delete and what to add
            const existingContextIds = existingLinks.map(l => l.context_id)

            // Links to remove: present in existing but not in new list
            const toDelete = existingLinks.filter(l => !contextIds.includes(l.context_id))

            // Contexts to add: present in new list but not in existing
            const toAdd = contextIds.filter(cid => !existingContextIds.includes(cid))

            // 3. Execute changes
            const deletePromises = toDelete.map(l => pb.collection('contact_contexts').delete(l.id))
            const addPromises = toAdd.map(cid => pb.collection('contact_contexts').create({
                contact_id: contactId,
                context_id: cid
            }))

            await Promise.all([...deletePromises, ...addPromises])
        } catch (error) {
            console.error('Error updating context links:', error)
            // Don't throw, partial update is better than full failure? Or maybe throw?
            // For now log it.
        }
    }

    /**
     * Build PocketBase filter string
     *
     * @private
     * @param {string} search - Search term
     * @param {string} userId - User ID
     * @returns {string[]} Array of filter conditions
     */
    _buildFilters(search, userId, status) {
        const filters = []

        filters.push(`user_id = "${userId}"`)

        if (status && status !== 'all') {
            filters.push(`status = "${status}"`)
        }

        if (search) {
            const escaped = escapeFilterValue(search)
            // Search in name or email ideally, assuming email field exists, checking schema would be better but keeping simple for now
            filters.push(`name ~ "${escaped}"`)
        }

        return filters
    }

    /**
     * Sanitize data by converting empty strings to null
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

export const contactsService = new ContactsService()
