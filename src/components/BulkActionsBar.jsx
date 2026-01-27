import { useState, useEffect } from 'react'
import { Trash2, FolderOpen, Tag, Layers, X, Check, Calendar, Rocket, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { supabase } from '../lib/supabase'
import { useContextStore } from '../stores/contextStore'
import { useQueryClient } from '@tanstack/react-query'
import { useContactsList } from '../hooks/useContacts'
import toast from 'react-hot-toast'

/**
 * Bulk actions bar shown when tasks are selected
 */
export function BulkActionsBar({ selectedIds, onClear, onSuccess }) {
    const queryClient = useQueryClient()
    const { contexts } = useContextStore()
    const [tags, setTags] = useState([])
    const [categories, setCategories] = useState([])
    const [meetings, setMeetings] = useState([])
    const [campaigns, setCampaigns] = useState([])
    const { data: contactsList = [] } = useContactsList()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadOptions()
    }, [])

    const loadOptions = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        const [tagsRes, catsRes, meetingsRes, campaignsRes] = await Promise.all([
            supabase.from('tags').select('id, name, color').eq('user_id', user.id).order('name'),
            supabase.from('task_categories').select('id, name').eq('user_id', user.id).order('name'),
            supabase.from('tasks').select('id, title').eq('user_id', user.id).eq('type', 'meeting').order('title'),
            supabase.from('campaigns').select('id, name').eq('user_id', user.id).eq('status', 'active').order('name')
        ])

        setTags(tagsRes.data || [])
        setCategories(catsRes.data || [])
        setMeetings(meetingsRes.data || [])
        setCampaigns(campaignsRes.data || [])
    }

    const count = selectedIds.length

    // Bulk delete
    const handleDelete = async () => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .in('id', selectedIds)

            if (error) throw error

            toast.success(`${count} task(s) deleted`)
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            onClear()
            onSuccess?.()
        } catch (error) {
            toast.error('Failed to delete tasks')
        } finally {
            setLoading(false)
            setShowDeleteConfirm(false)
        }
    }

    // Bulk update context
    const handleContextChange = async (contextId) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ context_id: contextId === 'none' ? null : contextId })
                .in('id', selectedIds)

            if (error) throw error

            const contextName = contexts.find(c => c.id === contextId)?.name || 'None'
            toast.success(`${count} task(s) moved to ${contextName}`)
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            onClear()
            onSuccess?.()
        } catch (error) {
            toast.error('Failed to update context')
        } finally {
            setLoading(false)
        }
    }

    // Bulk add tag
    const handleAddTag = async (tagId) => {
        setLoading(true)
        try {
            const inserts = selectedIds.map(taskId => ({
                task_id: taskId,
                tag_id: tagId
            }))

            const { error } = await supabase
                .from('task_tags')
                .upsert(inserts, { onConflict: 'task_id,tag_id', ignoreDuplicates: true })

            if (error) throw error

            const tagName = tags.find(t => t.id === tagId)?.name
            toast.success(`Tag "${tagName}" added to ${count} task(s)`)
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            onClear()
            onSuccess?.()
        } catch (error) {
            toast.error('Failed to add tag')
        } finally {
            setLoading(false)
        }
    }

    // Bulk update category
    const handleCategoryChange = async (categoryId) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ category_id: categoryId === 'none' ? null : categoryId })
                .in('id', selectedIds)

            if (error) throw error

            const catName = categories.find(c => c.id === categoryId)?.name || 'None'
            toast.success(`${count} task(s) assigned to ${catName}`)
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            onClear()
            onSuccess?.()
        } catch (error) {
            toast.error('Failed to update category')
        } finally {
            setLoading(false)
        }
    }

    // Bulk update status
    const handleStatusChange = async (status) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status })
                .in('id', selectedIds)

            if (error) throw error

            toast.success(`${count} task(s) marked as ${status.replace('_', ' ')}`)
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            onClear()
            onSuccess?.()
        } catch (error) {
            toast.error('Failed to update status')
        } finally {
            setLoading(false)
        }
    }

    // Bulk add to meeting agenda
    const handleAddToMeeting = async (meetingId) => {
        setLoading(true)
        try {
            // Get current max position for this meeting
            const { data: existing } = await supabase
                .from('meeting_items')
                .select('position')
                .eq('meeting_id', meetingId)
                .order('position', { ascending: false })
                .limit(1)

            let nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0

            // Insert all selected tasks as meeting items
            const inserts = selectedIds.map((taskId, index) => ({
                meeting_id: meetingId,
                item_type: 'task',
                item_id: taskId,
                position: nextPosition + index
            }))

            const { error } = await supabase
                .from('meeting_items')
                .upsert(inserts, { onConflict: 'meeting_id,item_id', ignoreDuplicates: true })

            if (error) throw error

            const meetingName = meetings.find(m => m.id === meetingId)?.title
            toast.success(`${count} task(s) added to "${meetingName}" agenda`)
            queryClient.invalidateQueries({ queryKey: ['meetingAgenda', meetingId] })
            onClear()
            onSuccess?.()
        } catch (error) {
            toast.error('Failed to add to meeting')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Bulk add to campaign
    const handleAddToCampaign = async (campaignId) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ campaign_id: campaignId === 'none' ? null : campaignId })
                .in('id', selectedIds)

            if (error) throw error

            const campaignName = campaigns.find(c => c.id === campaignId)?.name || 'None'
            toast.success(`${count} task(s) added to campaign "${campaignName}"`)
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            onClear()
            onSuccess?.()
        } catch (error) {
            toast.error('Failed to add to campaign')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4 flex-wrap max-w-[95vw]">
                <Badge variant="secondary" className="text-sm shrink-0">
                    {count} selected
                </Badge>

                {/* Status */}
                <Select onValueChange={handleStatusChange} disabled={loading}>
                    <SelectTrigger className="w-[120px] h-9">
                        <Check className="w-4 h-4 mr-1" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                </Select>

                {/* Client assignment */}
                <Select onValueChange={async (contactId) => {
                    setLoading(true)
                    try {
                        const { error } = await supabase
                            .from('tasks')
                            .update({ contact_id: contactId === 'none' ? null : contactId })
                            .in('id', selectedIds)

                        if (error) throw error

                        const contactName = contactsList.find(c => c.id === contactId)?.name || 'None'
                        toast.success(`${count} task(s) assigned to ${contactName}`)
                        queryClient.invalidateQueries({ queryKey: ['tasks'] })
                        onClear()
                        onSuccess?.()
                    } catch (error) {
                        toast.error('Failed to assign client')
                    } finally {
                        setLoading(false)
                    }
                }} disabled={loading}>
                    <SelectTrigger className="w-[130px] h-9">
                        <User className="w-4 h-4 mr-1" />
                        <SelectValue placeholder="Client" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {contactsList.map(contact => (
                            <SelectItem key={contact.id} value={contact.id}>
                                {contact.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Context */}
                <Select onValueChange={handleContextChange} disabled={loading}>
                    <SelectTrigger className="w-[130px] h-9">
                        <FolderOpen className="w-4 h-4 mr-1" />
                        <SelectValue placeholder="Context" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {contexts.map(ctx => (
                            <SelectItem key={ctx.id} value={ctx.id}>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ctx.color }} />
                                    {ctx.name}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Campaign */}
                {campaigns.length > 0 && (
                    <Select onValueChange={handleAddToCampaign} disabled={loading}>
                        <SelectTrigger className="w-[130px] h-9">
                            <Rocket className="w-4 h-4 mr-1" />
                            <SelectValue placeholder="Campaign" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {campaigns.map(camp => (
                                <SelectItem key={camp.id} value={camp.id}>{camp.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Meeting */}
                {meetings.length > 0 && (
                    <Select onValueChange={handleAddToMeeting} disabled={loading}>
                        <SelectTrigger className="w-[130px] h-9">
                            <Calendar className="w-4 h-4 mr-1" />
                            <SelectValue placeholder="Meeting" />
                        </SelectTrigger>
                        <SelectContent>
                            {meetings.map(meeting => (
                                <SelectItem key={meeting.id} value={meeting.id}>
                                    📅 {meeting.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Tag */}
                {tags.length > 0 && (
                    <Select onValueChange={handleAddTag} disabled={loading}>
                        <SelectTrigger className="w-[100px] h-9">
                            <Tag className="w-4 h-4 mr-1" />
                            <SelectValue placeholder="Tag" />
                        </SelectTrigger>
                        <SelectContent>
                            {tags.map(tag => (
                                <SelectItem key={tag.id} value={tag.id}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                        {tag.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Category */}
                {categories.length > 0 && (
                    <Select onValueChange={handleCategoryChange} disabled={loading}>
                        <SelectTrigger className="w-[120px] h-9">
                            <Layers className="w-4 h-4 mr-1" />
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Delete */}
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                </Button>

                {/* Clear selection */}
                <Button variant="ghost" size="icon" onClick={onClear} className="h-8 w-8 shrink-0">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {count} task(s)?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. All selected tasks will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
