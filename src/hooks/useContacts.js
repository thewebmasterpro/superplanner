import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import pb from '../lib/pocketbase'
import toast from 'react-hot-toast'

export function useContacts(filters = {}) {
    const queryClient = useQueryClient()

    // Fetch contacts with filters
    const contactsQuery = useQuery({
        queryKey: ['contacts', filters],
        queryFn: async () => {
            const user = pb.authStore.model
            if (!user) return []

            const queryFilters = [`user_id = "${user.id}"`]

            if (filters.status && filters.status !== 'all') {
                queryFilters.push(`status = "${filters.status}"`)
            }

            if (filters.workspaceId && filters.workspaceId !== 'all') {
                // Filter by workspace - need subquery or relation filter
                // Assuming 'contact_contexts' is a junction collection or 'contexts' is a relation on contacts.
                // If 1:1 migration of join table:
                // We find contacts that have a matching contact_context

                // PocketBase Subrequest filter style:
                // id IN (contact_contexts.contact_id ? context_id = '...') - not directly supported in simple filter string easily without 'expand' magic or multiple requests.
                // Easiest is to fetch contact_ids first like Supabase code did.

                const links = await pb.collection('contact_contexts').getFullList({
                    filter: `context_id = "${filters.workspaceId}"`,
                    fields: 'contact_id'
                })

                if (links.length > 0) {
                    const ids = links.map(l => `"${l.contact_id}"`).join(',')
                    queryFilters.push(`id IN [${ids}]`) // THIS SYNTAX ID IN [...] is not valid PB, it's 'id = "a" || id = "b"'
                    // specific PB syntax for IN:  (id='a' || id='b')
                    // optimization: use batching or just big string if not too many
                    const idFilter = links.map(l => `id = "${l.contact_id}"`).join(' || ')
                    queryFilters.push(`(${idFilter})`)
                } else {
                    return []
                }
            }

            if (filters.search) {
                queryFilters.push(`(name ~ "${filters.search}" || email ~ "${filters.search}" || company ~ "${filters.search}")`)
            }

            const records = await pb.collection('contacts').getFullList({
                filter: queryFilters.join(' && '),
                sort: 'name',
                expand: 'contact_contexts(contact_id).context_id' // This is getting complicated with indirect expansion.
                // If we want nested context info:
                // If contact keys back to contexts via 'contact_contexts' collection...
                // Maybe simpler to not expand for now or assume contacts have "contexts" relation field if reworked.
                // Proceeding with NO expansion of contexts for the list view to stay safe, 
                // OR trying to expand if the UI needs it.
                // Supabase code: contact_contexts(context:contexts(...))
                // This implies fetching the contexts linked to the contact.
                // In PB, if we use a join collection, we need to fetch that separately or reverse expand.
            })

            // To get contexts for each contact (if using join table), we might need reverse expansion
            // records = await pb.collection('contacts').getFullList({ expand: 'contact_contexts(contact_id).context_id' }) 
            // Syntax: expand 'collection_via_field'
            // expand: 'contact_contexts(contact_id)' will give us the join records.
            // THEN we need the context info? 
            // It's complex. Let's stick to basic contact info first.

            return records
        }
    })

    // Create contact
    const createContact = useMutation({
        mutationFn: async (contactData) => {
            const user = pb.authStore.model

            const { contextIds, ...contact } = contactData

            // Create contact
            const record = await pb.collection('contacts').create({
                ...contact,
                user_id: user.id
            })

            // Link contexts
            if (contextIds && contextIds.length > 0) {
                const promises = contextIds.map(contextId =>
                    pb.collection('contact_contexts').create({
                        contact_id: record.id,
                        context_id: contextId
                    })
                )
                await Promise.all(promises)
            }

            return record
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            toast.success('Contact created')
        },
        onError: (error) => {
            // PB returns 400 for unique constraint
            if (error.status === 400 && error.message.includes('email')) {
                toast.error('A contact with this email already exists')
            } else {
                toast.error('Failed to create contact')
            }
        }
    })

    // Update contact
    const updateContact = useMutation({
        mutationFn: async ({ id, contextIds, ...contactData }) => {
            const updated = await pb.collection('contacts').update(id, {
                ...contactData,
                updated_at: new Date().toISOString()
            })

            // Update contexts
            if (contextIds !== undefined) {
                // Find existing links
                const existing = await pb.collection('contact_contexts').getFullList({
                    filter: `contact_id = "${id}"`
                })

                // Delete all (simplest strategy, though naive)
                await Promise.all(existing.map(link => pb.collection('contact_contexts').delete(link.id)))

                // Add new
                if (contextIds.length > 0) {
                    await Promise.all(contextIds.map(contextId =>
                        pb.collection('contact_contexts').create({
                            contact_id: id,
                            context_id: contextId
                        })
                    ))
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            toast.success('Contact updated')
        },
        onError: (error) => {
            toast.error('Failed to update contact')
        }
    })

    // Delete contact
    const deleteContact = useMutation({
        mutationFn: async (id) => {
            await pb.collection('contacts').delete(id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            toast.success('Contact deleted')
        },
        onError: () => {
            toast.error('Failed to delete contact')
        }
    })

    // Send email - Placeholder for PB
    const sendEmail = useMutation({
        mutationFn: async ({ to, subject, html, contactId }) => {
            // TODO: Implement server-side email sending via PocketBase hooks or custom endpoint
            console.warn("Email sending via Edge Functions is not directly supported in PocketBase client. Use a custom backend route.")
            throw new Error("Email sending not configured for PocketBase yet.")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
        }
    })

    return {
        contacts: contactsQuery.data || [],
        isLoading: contactsQuery.isLoading,
        createContact: createContact.mutate,
        updateContact: updateContact.mutate,
        deleteContact: deleteContact.mutate,
        sendEmail: sendEmail.mutate,
        isCreating: createContact.isPending,
        isUpdating: updateContact.isPending,
        isSendingEmail: sendEmail.isPending
    }
}

export function useContactsList() {
    return useQuery({
        queryKey: ['contactsList'],
        queryFn: async () => {
            const user = pb.authStore.model
            if (!user) return []

            const records = await pb.collection('contacts').getFullList({
                filter: `user_id = "${user.id}"`,
                sort: 'name',
                fields: 'id,name,company,status'
            })
            return records
        }
    })
}
