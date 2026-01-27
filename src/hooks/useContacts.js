import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useContacts(filters = {}) {
    const queryClient = useQueryClient()

    // Fetch contacts with filters
    const contactsQuery = useQuery({
        queryKey: ['contacts', filters],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()

            let query = supabase
                .from('contacts')
                .select(`
          *,
          contact_contexts(
            context:contexts(id, name, color)
          )
        `)
                .eq('user_id', user.id)
                .order('name')

            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status)
            }

            if (filters.contextId && filters.contextId !== 'all') {
                // Filter by context - need subquery
                const { data: contactIds } = await supabase
                    .from('contact_contexts')
                    .select('contact_id')
                    .eq('context_id', filters.contextId)

                if (contactIds && contactIds.length > 0) {
                    query = query.in('id', contactIds.map(c => c.contact_id))
                } else {
                    return [] // No contacts in this context
                }
            }

            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`)
            }

            const { data, error } = await query

            if (error) throw error
            return data || []
        }
    })

    // Create contact
    const createContact = useMutation({
        mutationFn: async (contactData) => {
            const { data: { user } } = await supabase.auth.getUser()

            const { contextIds, ...contact } = contactData

            // Create contact
            const { data, error } = await supabase
                .from('contacts')
                .insert({ ...contact, user_id: user.id })
                .select()
                .single()

            if (error) throw error

            // Link contexts
            if (contextIds && contextIds.length > 0) {
                const contextLinks = contextIds.map(contextId => ({
                    contact_id: data.id,
                    context_id: contextId
                }))

                await supabase.from('contact_contexts').insert(contextLinks)
            }

            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            toast.success('Contact created')
        },
        onError: (error) => {
            if (error.code === '23505') {
                toast.error('A contact with this email already exists')
            } else {
                toast.error('Failed to create contact')
            }
        }
    })

    // Update contact
    const updateContact = useMutation({
        mutationFn: async ({ id, contextIds, ...contactData }) => {
            const { error } = await supabase
                .from('contacts')
                .update({ ...contactData, updated_at: new Date().toISOString() })
                .eq('id', id)

            if (error) throw error

            // Update contexts
            if (contextIds !== undefined) {
                // Remove existing
                await supabase.from('contact_contexts').delete().eq('contact_id', id)

                // Add new
                if (contextIds.length > 0) {
                    const contextLinks = contextIds.map(contextId => ({
                        contact_id: id,
                        context_id: contextId
                    }))
                    await supabase.from('contact_contexts').insert(contextLinks)
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            toast.success('Contact updated')
        },
        onError: () => {
            toast.error('Failed to update contact')
        }
    })

    // Delete contact
    const deleteContact = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('contacts')
                .delete()
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            toast.success('Contact deleted')
        },
        onError: () => {
            toast.error('Failed to delete contact')
        }
    })

    return {
        contacts: contactsQuery.data || [],
        isLoading: contactsQuery.isLoading,
        createContact: createContact.mutate,
        updateContact: updateContact.mutate,
        deleteContact: deleteContact.mutate,
        isCreating: createContact.isPending,
        isUpdating: updateContact.isPending
    }
}

// Simple hook to get all contacts for dropdowns
export function useContactsList() {
    return useQuery({
        queryKey: ['contactsList'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()

            const { data, error } = await supabase
                .from('contacts')
                .select('id, name, company, status')
                .eq('user_id', user.id)
                .order('name')

            if (error) throw error
            return data || []
        }
    })
}
