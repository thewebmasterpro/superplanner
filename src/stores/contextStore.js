import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export const useContextStore = create(
    persist(
        (set, get) => ({
            contexts: [],
            activeContextId: null, // null = Global view
            loading: false,

            loadContexts: async () => {
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
                    set({ contexts: data || [], loading: false })
                } catch (error) {
                    console.error('Error loading contexts:', error)
                    set({ loading: false })
                }
            },

            setActiveContext: (contextId) => {
                set({ activeContextId: contextId })
            },

            getActiveContext: () => {
                const { contexts, activeContextId } = get()
                if (!activeContextId) return null
                return contexts.find(c => c.id === activeContextId) || null
            },

            createContext: async (contextData) => {
                try {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) throw new Error('Not authenticated')

                    const { data, error } = await supabase
                        .from('contexts')
                        .insert({ ...contextData, user_id: user.id })
                        .select()
                        .single()

                    if (error) throw error

                    set(state => ({ contexts: [...state.contexts, data] }))
                    return data
                } catch (error) {
                    console.error('Error creating context:', error)
                    throw error
                }
            },

            updateContext: async (id, updates) => {
                try {
                    const { data, error } = await supabase
                        .from('contexts')
                        .update(updates)
                        .eq('id', id)
                        .select()
                        .single()

                    if (error) throw error

                    set(state => ({
                        contexts: state.contexts.map(c => c.id === id ? data : c)
                    }))
                    return data
                } catch (error) {
                    console.error('Error updating context:', error)
                    throw error
                }
            },

            deleteContext: async (id, mode = 'soft') => {
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
                        contexts: state.contexts.filter(c => c.id !== id),
                        activeContextId: state.activeContextId === id ? null : state.activeContextId
                    }))
                } catch (error) {
                    console.error('Error deleting context:', error)
                    throw error
                }
            }
        }),
        {
            name: 'superplanner-context',
            partialize: (state) => ({ activeContextId: state.activeContextId })
        }
    )
)
