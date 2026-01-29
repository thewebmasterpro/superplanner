import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import pb from '../lib/pocketbase'

export const useWorkspaceStore = create(
    persist(
        (set, get) => ({
            workspaces: [],
            activeWorkspaceId: null, // null = Global view
            loading: false,

            loadWorkspaces: async () => {
                set({ loading: true })
                try {
                    const user = pb.authStore.model
                    if (!user) return

                    const records = await pb.collection('workspaces').getFullList({
                        filter: `user_id = "${user.id}" && status = "active"`,
                        sort: 'name'
                    })

                    set({ workspaces: records || [], loading: false })
                } catch (error) {
                    console.error('Error loading workspaces:', error)
                    set({ loading: false })
                }
            },

            setActiveWorkspace: (workspaceId) => {
                set({ activeWorkspaceId: workspaceId })
            },

            getActiveWorkspace: () => {
                const { workspaces, activeWorkspaceId } = get()
                if (!activeWorkspaceId) return null
                return workspaces.find(w => w.id === activeWorkspaceId) || null
            },

            createWorkspace: async (workspaceData) => {
                try {
                    const user = pb.authStore.model
                    if (!user) throw new Error('Not authenticated')

                    const record = await pb.collection('workspaces').create({
                        ...workspaceData,
                        user_id: user.id
                    })

                    set(state => ({ workspaces: [...state.workspaces, record] }))
                    return record
                } catch (error) {
                    console.error('Error creating workspace:', error)
                    throw error
                }
            },

            updateWorkspace: async (id, updates) => {
                try {
                    const record = await pb.collection('workspaces').update(id, updates)

                    set(state => ({
                        workspaces: state.workspaces.map(w => w.id === id ? record : w)
                    }))
                    return record
                } catch (error) {
                    console.error('Error updating workspace:', error)
                    throw error
                }
            },

            deleteWorkspace: async (id, mode = 'soft') => {
                try {
                    if (mode === 'soft') {
                        // Soft delete = archive
                        await pb.collection('workspaces').update(id, { status: 'archived' })
                    } else {
                        // Hard delete (orphan tasks)
                        await pb.collection('workspaces').delete(id)
                    }

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
                workspaces: state.workspaces
            })
        }
    )
)
