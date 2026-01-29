import { useState, useEffect } from 'react'
import { Trash2, FolderOpen, Tag, Layers, X, Check, Calendar, Rocket, User, Archive, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
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
import pb from '../lib/pocketbase'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useQueryClient } from '@tanstack/react-query'
import { useContactsList } from '../hooks/useContacts'
import toast from 'react-hot-toast'

/**
 * Bulk actions bar shown when tasks are selected
 */
export function BulkActionsBar({ selectedIds, onClear, onSuccess }) {
    const queryClient = useQueryClient()
    const { workspaces } = useWorkspaceStore()
    const [tags, setTags] = useState([])
    const [categories, setCategories] = useState([])
    const [meetings, setMeetings] = useState([])
    const [campaigns, setCampaigns] = useState([])
    const { data: contactsList = [] } = useContactsList()
    const [teamMembers, setTeamMembers] = useState([])
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showScheduleDialog, setShowScheduleDialog] = useState(false)
    const [scheduleData, setScheduleData] = useState({ due_date: '', scheduled_time: '' })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadOptions()
    }, [])

    const loadOptions = async () => {
        const user = pb.authStore.model
        if (!user) return

        try {
            const [tagsRes, catsRes, meetingsRes, campaignsRes] = await Promise.all([
                pb.collection('tags').getFullList({ sort: 'name' }),
                pb.collection('task_categories').getFullList({ sort: 'name' }),
                pb.collection('tasks').getFullList({ filter: `user_id = "${user.id}" && type = "meeting"`, sort: 'title' }),
                pb.collection('campaigns').getFullList({ filter: `user_id = "${user.id}" && status = "active"`, sort: 'name' })
            ])

            setTags(tagsRes)
            setCategories(catsRes)
            setMeetings(meetingsRes)
            setCampaigns(campaignsRes)

            // Fetch team members
            // 1. Get user's teams
            const myMemberships = await pb.collection('team_members').getFullList({
                filter: `user_id = "${user.id}"`,
                expand: 'team_id'
            })

            const teamIds = myMemberships.map(m => m.team_id)
            if (teamIds.length > 0) {
                // 2. Get all members of those teams
                // Using filter 'team_id' in [list] is not directly supported in PB syntax like SQL 'IN'. 
                // We use OR syntax.
                const filter = teamIds.map(id => `team_id = "${id}"`).join(' || ')
                const allMembers = await pb.collection('team_members').getFullList({
                    filter: `(${filter})`,
                    expand: 'user_id'
                })

                // Deduplicate by user_id
                const uniqueMembers = []
                const seen = new Set()
                allMembers.forEach(m => {
                    if (m.expand?.user_id && !seen.has(m.user_id)) {
                        seen.add(m.user_id)
                        uniqueMembers.push(m)
                    }
                })
                setTeamMembers(uniqueMembers)
            }

        } catch (error) {
            console.error('Error loading options:', error)
        }
    }

    const count = selectedIds.length

    const updateTasks = async (updates) => {
        setLoading(true)
        try {
            // Parallelize updates
            // PB doesn't have bulk update filter. We iterate.
            // Ideally we limit concurrency.
            const promises = selectedIds.map(id => pb.collection('tasks').update(id, updates))
            await Promise.all(promises)

            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            return true
        } catch (error) {
            console.error('Update failed:', error)
            toast.error('Operation failed')
            return false
        } finally {
            setLoading(false)
        }
    }

    // Bulk soft delete (Trash)
    const handleDelete = async () => {
        const success = await updateTasks({ deleted_at: new Date().toISOString() })
        if (success) {
            toast.success(`${count} task(s) moved to trash`)
            onClear()
            onSuccess?.()
        }
        setShowDeleteConfirm(false)
    }

    // Bulk archive
    const handleArchive = async () => {
        const success = await updateTasks({ archived_at: new Date().toISOString() })
        if (success) {
            toast.success(`${count} task(s) archived`)
            onClear()
            onSuccess?.()
        }
    }

    // Bulk update workspace
    const handleWorkspaceChange = async (workspaceId) => {
        const success = await updateTasks({ context_id: workspaceId === 'none' ? null : workspaceId })
        if (success) {
            const workspaceName = workspaces.find(w => w.id === workspaceId)?.name || 'None'
            toast.success(`${count} task(s) moved to ${workspaceName}`)
            onClear()
            onSuccess?.()
        }
    }

    // Bulk add tag
    const handleAddTag = async (tagId) => {
        setLoading(true)
        try {
            // We need to append the tag to each task's existing tags
            // 1. Fetch current tags for tasks
            // PB filter IN not supported, use loop or parallel fetch
            const tasks = await Promise.all(selectedIds.map(id => pb.collection('tasks').getOne(id)))

            // 2. Update with new tag
            const promises = tasks.map(task => {
                const currentTags = task.tags || []
                if (currentTags.includes(tagId)) return Promise.resolve() // Already has tag

                return pb.collection('tasks').update(task.id, {
                    tags: [...currentTags, tagId]
                })
            })

            await Promise.all(promises)

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
        const success = await updateTasks({ category_id: categoryId === 'none' ? null : categoryId })
        if (success) {
            const catName = categories.find(c => c.id === categoryId)?.name || 'None'
            toast.success(`${count} task(s) assigned to ${catName}`)
            onClear()
            onSuccess?.()
        }
    }

    // Bulk update status
    const handleStatusChange = async (status) => {
        const success = await updateTasks({ status })
        if (success) {
            toast.success(`${count} task(s) marked as ${status.replace('_', ' ')}`)
            onClear()
            onSuccess?.()
        }
    }

    // Bulk add to meeting agenda
    const handleAddToMeeting = async (meetingId) => {
        setLoading(true)
        try {
            // Get current max position for this meeting
            // We can't easily aggregate max in PB API. We iterate or fetch all items 1 page sort desc.
            const existingItems = await pb.collection('meeting_items').getList(1, 1, {
                filter: `meeting_id = "${meetingId}"`,
                sort: '-position'
            })

            let nextPosition = existingItems.items.length > 0 ? existingItems.items[0].position + 1 : 0

            // Insert all selected tasks as meeting items
            const promises = selectedIds.map((taskId, index) => {
                return pb.collection('meeting_items').create({
                    meeting_id: meetingId,
                    type: 'task', // Ensure field matches schema (item_type or type?)
                    task_id: taskId, // Assuming schema has task_id relation
                    // If schema used generic 'item_id' and 'item_type', adjust.
                    // Based on previous Supabase 'item_type' and 'item_id'.
                    // PB usually prefers explicit relations. Let's assume 'task_id'.
                    // If migration used 'item_id' (text), use that.
                    // Previous Supabase: item_type='task', item_id=taskId.
                    // Let's assume PB schema mirrors this or has task_id.
                    // Safest: Use same fields if migration copied them.
                    item_type: 'task',
                    task_id: taskId,
                    title: 'Task Reference', // Mandatory?
                    position: nextPosition + index
                }).catch(err => {
                    // Ignore duplicates if any unique constraint
                    console.warn(err)
                })
            })

            await Promise.all(promises)

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
        const success = await updateTasks({ campaign_id: campaignId === 'none' ? null : campaignId })
        if (success) {
            const campaignName = campaigns.find(c => c.id === campaignId)?.name || 'None'
            toast.success(`${count} task(s) added to campaign "${campaignName}"`)
            onClear()
            onSuccess?.()
        }
    }

    // Bulk assignee
    const handleAssigneeChange = async (userId) => {
        const success = await updateTasks({ assigned_to: userId === 'none' ? null : userId })
        if (success) {
            toast.success(`${count} task(s) assigned`)
            onClear()
            onSuccess?.()
        }
    }

    // Bulk schedule (Due Date / Time)
    const handleScheduleSubmit = async () => {
        const updates = {}
        if (scheduleData.due_date) updates.due_date = new Date(scheduleData.due_date).toISOString()
        if (scheduleData.scheduled_time) updates.scheduled_time = new Date(scheduleData.scheduled_time).toISOString()

        if (Object.keys(updates).length === 0) return

        const success = await updateTasks(updates)
        if (success) {
            toast.success(`${count} task(s) scheduled`)
            setShowScheduleDialog(false)
            onClear()
            onSuccess?.()
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
                    const success = await updateTasks({ contact_id: contactId === 'none' ? null : contactId })
                    if (success) {
                        const contactName = contactsList.find(c => c.id === contactId)?.name || 'None'
                        toast.success(`${count} task(s) assigned to ${contactName}`)
                        onClear()
                        onSuccess?.()
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

                {/* Assignee */}
                {teamMembers.length > 0 && (
                    <Select onValueChange={handleAssigneeChange} disabled={loading}>
                        <SelectTrigger className="w-[130px] h-9">
                            <Users className="w-4 h-4 mr-1" />
                            <SelectValue placeholder="Assignee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {teamMembers.map(member => (
                                <SelectItem key={member.user_id} value={member.user_id}>
                                    {member.expand?.user_id?.name || member.expand?.user_id?.email || 'Unknown User'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Schedule Dialog Trigger */}
                <Button variant="outline" size="sm" onClick={() => setShowScheduleDialog(true)} disabled={loading}>
                    <Clock className="w-4 h-4 mr-1" />
                    Schedule
                </Button>

                {/* Workspace */}
                <Select onValueChange={handleWorkspaceChange} disabled={loading}>
                    <SelectTrigger className="w-[130px] h-9">
                        <FolderOpen className="w-4 h-4 mr-1" />
                        <SelectValue placeholder="Workspace" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {workspaces.map(w => (
                            <SelectItem key={w.id} value={w.id}>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color }} />
                                    {w.name}
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

                {/* Archive */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleArchive}
                    disabled={loading}
                >
                    <Archive className="w-4 h-4 mr-1" />
                    Archive
                </Button>

                {/* Delete */}
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Trash
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
                        <AlertDialogTitle>Move {count} task(s) to trash?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Items in trash can be restored later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Move to Trash
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Schedule Dialog */}
            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule {count} Tasks</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input
                                type="date"
                                value={scheduleData.due_date}
                                onChange={e => setScheduleData({ ...scheduleData, due_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Scheduled Time</Label>
                            <Input
                                type="datetime-local"
                                value={scheduleData.scheduled_time}
                                onChange={e => setScheduleData({ ...scheduleData, scheduled_time: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
                        <Button onClick={handleScheduleSubmit} disabled={loading}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
