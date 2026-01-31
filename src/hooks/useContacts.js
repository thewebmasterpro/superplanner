import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsService } from '../services/contacts.service'
import toast from 'react-hot-toast'

export function useContacts(filters = {}) {
    const queryClient = useQueryClient()

    // Fetch contacts with filters
    const contactsQuery = useQuery({
        queryKey: ['contacts', filters],
        queryFn: () => contactsService.getAll(filters)
    })

    // Create contact
    const createContact = useMutation({
        mutationFn: (contactData) => contactsService.create(contactData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            queryClient.invalidateQueries({ queryKey: ['contactsList'] })
            toast.success('Contact created')
        },
        onError: (error) => {
            // PB returns 400 for unique constraint
            if (error.status === 400 && error.message?.includes('email')) {
                toast.error('A contact with this email already exists')
            } else {
                toast.error('Failed to create contact')
            }
        }
    })

    // Update contact
    const updateContact = useMutation({
        mutationFn: ({ id, ...updates }) => contactsService.update(id, updates),
        onMutate: async ({ id, ...updates }) => {
            await queryClient.cancelQueries({ queryKey: ['contacts'] })
            const previousContacts = queryClient.getQueryData(['contacts', filters])

            if (previousContacts) {
                queryClient.setQueryData(['contacts', filters],
                    previousContacts.map(contact =>
                        contact.id === id ? { ...contact, ...updates } : contact
                    )
                )
            }

            return { previousContacts }
        },
        onError: (error, variables, context) => {
            if (context?.previousContacts) {
                queryClient.setQueryData(['contacts', filters], context.previousContacts)
            }
            toast.error('Failed to update contact')
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            queryClient.invalidateQueries({ queryKey: ['contactsList'] })
        },
        onSuccess: () => {
            toast.success('Contact updated')
        }
    })

    // Delete contact
    const deleteContact = useMutation({
        mutationFn: (id) => contactsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            queryClient.invalidateQueries({ queryKey: ['contactsList'] })
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

export function useContactsList() {
    return useQuery({
        queryKey: ['contactsList'],
        queryFn: () => contactsService.getAll()
    })
}
