import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export const useWorkspaceStore = create(
    persist(
        (set, get) => ({
            workspaces: [],
            activeWorkspaceId: null, // null = Global view
            loading: false,

            loadWorkspaces: async () => {
                set({ loading: true })
                try {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) return

                    const { data, error } = await supabase
                        .from('contexts')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('status', 'active')
                        .order('name')

                    if (error) throw error
                    set({ workspaces: data || [], loading: false })
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
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) throw new Error('Not authenticated')

                    const { data, error } = await supabase
                        .from('contexts')
                        .insert({ ...workspaceData, user_id: user.id })
                        .select()
                        .single()

                    if (error) throw error

                    set(state => ({ workspaces: [...state.workspaces, data] }))
                    return data
                } catch (error) {
                    console.error('Error creating workspace:', error)
                    throw error
                }
            },

            updateWorkspace: async (id, updates) => {
                try {
                    const { data, error } = await supabase
                        .from('contexts')
                        .update(updates)
                        .eq('id', id)
                        .select()
                        .single()

                    if (error) throw error

                    set(state => ({
                        workspaces: state.workspaces.map(w => w.id === id ? data : w)
                    }))
                    return data
                } catch (error) {
                    console.error('Error updating workspace:', error)
                    throw error
                }
            },

            deleteWorkspace: async (id, mode = 'soft') => {
                try {
                    if (mode === 'soft') {
                        // Soft delete = archive
                        await supabase
                            .from('contexts')
                            .update({ status: 'archived' })
                            .eq('id', id)
                    } else {
                        // Hard delete (orphan tasks)
                        await supabase.from('contexts').delete().eq('id', id)
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
