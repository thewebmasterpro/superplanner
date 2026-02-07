/**
 * Workspaces Service (Contexts)
 *
 * Centralized service for workspace/context-related operations.
 * Abstracts PocketBase API calls for the 'contexts' collection.
 *
 * @module services/workspaces.service
 */

import pb from '../lib/pocketbase'

class WorkspacesService {
  /**
   * Load all workspaces for the current user
   * Filters only active workspaces (status = 'active' or null)
   *
   * @returns {Promise<Array>} Array of workspace records
   */
  async getAll() {
    const user = pb.authStore.model
    if (!user) return []

    try {
      const records = await pb.collection('contexts').getFullList({
        filter: `user_id = "${user.id}"`,
        sort: 'name',
        requestKey: null,
        skipTotal: false, // Required for older PocketBase servers
      })

      // Filter only active ones (status is falsy or 'active')
      return records.filter(w => !w.status || w.status === 'active')
    } catch (error) {
      console.error('❌ Error loading workspaces:', error)
      return []
    }
  }

  /**
   * Get a single workspace by ID
   *
   * @param {string} id - Workspace ID
   * @returns {Promise<Object>} Workspace record
   */
  async getOne(id) {
    return await pb.collection('contexts').getOne(id)
  }

  /**
   * Create a new workspace
   *
   * @param {Object} workspaceData - Workspace data (name, description, etc.)
   * @returns {Promise<Object>} Created workspace record
   * @throws {Error} If user not authenticated
   */
  async create(workspaceData) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    return await pb.collection('contexts').create({
      ...workspaceData,
      user_id: user.id
    })
  }

  /**
   * Update a workspace
   *
   * @param {string} id - Workspace ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated workspace record
   */
  async update(id, updates) {
    return await pb.collection('contexts').update(id, updates)
  }

  /**
   * Delete a workspace
   * Supports soft delete (archive) or hard delete
   *
   * @param {string} id - Workspace ID
   * @param {string} mode - 'soft' for archive, 'hard' for permanent delete
   * @returns {Promise<Object|void>} Updated record (soft) or void (hard)
   */
  async delete(id, mode = 'soft') {
    if (mode === 'soft') {
      // Soft delete = archive
      return await pb.collection('contexts').update(id, { status: 'archived' })
    } else {
      // Hard delete (orphan tasks)
      return await pb.collection('contexts').delete(id)
    }
  }

  /**
   * Archive a workspace (soft delete)
   *
   * @param {string} id - Workspace ID
   * @returns {Promise<Object>} Updated workspace record
   */
  async archive(id) {
    return this.delete(id, 'soft')
  }

  /**
   * Permanently delete a workspace
   *
   * @param {string} id - Workspace ID
   * @returns {Promise<void>}
   */
  async permanentDelete(id) {
    return this.delete(id, 'hard')
  }
}

// Export singleton instance
export const workspacesService = new WorkspacesService()
