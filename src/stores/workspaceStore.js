/**
 * Workspace Store (Zustand)
 *
 * Manages workspace/context state using Zustand.
 * Uses workspaces service for all data operations.
 *
 * Benefits of this approach:
 * - Separation of concerns: Zustand manages state, service manages data
 * - Easy to test: service can be tested independently
 * - Reusable: service can be used in React Query hooks or standalone scripts
 *
 * @module stores/workspaceStore
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { workspacesService } from '../services/workspaces.service'

export const useWorkspaceStore = create(
    persist(
        (set, get) => ({
            workspaces: [],
            activeWorkspaceId: null, // null = Global view
            defaultWorkspaceId: null, // Default workspace for new items
            loading: false,

            /**
             * Load all workspaces for the current user
             */
            loadWorkspaces: async () => {
                set({ loading: true })

                try {
                    const workspaces = await workspacesService.getAll()
                    set({ workspaces, loading: false })
                } catch (error) {
                    console.error('❌ Error in loadWorkspaces:', error)
                    set({ workspaces: [], loading: false })
                }
            },

            /**
             * Set the active workspace
             * @param {string|null} workspaceId - Workspace ID or null for global view
             */
            setActiveWorkspace: (workspaceId) => {
                set({ activeWorkspaceId: workspaceId })
            },

            /**
             * Set the default workspace (used when creating new items)
             * @param {string|null} workspaceId - Workspace ID or null
             */
            setDefaultWorkspace: (workspaceId) => {
                set({ defaultWorkspaceId: workspaceId })
            },

            /**
             * Get the currently active workspace object
             * @returns {Object|null} Active workspace or null
             */
            getActiveWorkspace: () => {
                const { workspaces, activeWorkspaceId } = get()
                if (!activeWorkspaceId) return null
                return workspaces.find(w => w.id === activeWorkspaceId) || null
            },

            /**
             * Create a new workspace
             * @param {Object} workspaceData - Workspace data (name, description, etc.)
             * @returns {Promise<Object>} Created workspace
             */
            createWorkspace: async (workspaceData) => {
                try {
                    const record = await workspacesService.create(workspaceData)
                    set(state => ({ workspaces: [...state.workspaces, record] }))
                    return record
                } catch (error) {
                    console.error('Error creating workspace:', error)
                    throw error
                }
            },

            /**
             * Update an existing workspace
             * @param {string} id - Workspace ID
             * @param {Object} updates - Fields to update
             * @returns {Promise<Object>} Updated workspace
             */
            updateWorkspace: async (id, updates) => {
                try {
                    const record = await workspacesService.update(id, updates)
                    set(state => ({
                        workspaces: state.workspaces.map(w => w.id === id ? record : w)
                    }))
                    return record
                } catch (error) {
                    console.error('Error updating workspace:', error)
                    throw error
                }
            },

            /**
             * Delete a workspace (soft or hard delete)
             * @param {string} id - Workspace ID
             * @param {string} mode - 'soft' for archive, 'hard' for permanent delete
             */
            deleteWorkspace: async (id, mode = 'soft') => {
                try {
                    await workspacesService.delete(id, mode)

                    // Remove from local state
                    set(state => ({
                        workspaces: state.workspaces.filter(w => w.id !== id),
                        activeWorkspaceId: state.activeWorkspaceId === id ? null : state.activeWorkspaceId
                    }))
                } catch (error) {
                    console.error('Error deleting workspace:', error)
                    throw error
                }
            }
        }),
        {
            name: 'superplanner-workspace',
            partialize: (state) => ({
                workspaces: state.workspaces,
                defaultWorkspaceId: state.defaultWorkspaceId,
                // activeWorkspaceId: state.activeWorkspaceId  // Removed to enforce Global View on load
            })
        }
    )
)
