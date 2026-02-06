import { useState, useEffect } from 'react'
import { useCreateTask, useUpdateTask, useDeleteTask, useArchiveTask } from '../hooks/useTasks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle, Archive, Trash2, ChevronRight } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TaskNotes } from './TaskNotes'
import { TaskComments } from './TaskComments'
import { BlockerManager } from './BlockerManager'
import { MeetingAgendaManager } from './MeetingAgendaManager'
import { ReminderPicker } from './pickers/ReminderPicker'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useUserStore } from '../stores/userStore'
import { useContactsList } from '../hooks/useContacts'
import toast from 'react-hot-toast'
import { categoriesService } from '../services/categories.service'
import { projectsService } from '../services/projects.service'
import { tagsService } from '../services/tags.service'
import { campaignsService } from '../services/campaigns.service'
import { teamsService } from '../services/teams.service'

export function TaskModal({ open, onOpenChange, task = null }) {
  const isEditing = !!task?.id
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const archiveTask = useArchiveTask()
  const { workspaces, activeWorkspaceId, defaultWorkspaceId, getActiveWorkspace } = useWorkspaceStore()
  const { currentTeam } = useUserStore()
  const { data: contactsList = [] } = useContactsList()

  const [categories, setCategories] = useState([])
  const [projects, setProjects] = useState([])
  const [tags, setTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [campaigns, setCampaigns] = useState([])

  const [assignmentMode, setAssignmentMode] = useState('individual') // 'individual' or 'team'

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    duration: 60,
    scheduled_time: '',
    reminder_minutes: null,
    category_id: '',
    project_id: '',
    blocked_reason: '',
    recurrence: '',
    recurrence_end: '',
    recurrence_rule: '',
    type: 'task',    // 'task' or 'meeting'
    agenda: '',       // for meetings (deprecated, replaced by agendaItems)
    // Meeting-specific fields
    start_time: '',
    end_time: '',
    location: '',
    meeting_link: '',
    // Task Pool fields
    claimed_at: '',
    claimed_by: '',
    claim_deadline: '',
    campaign_id: '',   // Link to campaign
    context_id: '',    // Link to workspace (auto-filled from activeWorkspaceId)
    contact_id: '',    // Link to client/contact
    team_id: '',       // Link to team
    assigned_to: ''    // Link to team member
  })

  // Load categories, projects, and agenda items
  useEffect(() => {
    if (open) {
      loadCategoriesAndProjects()
      if (task) {
        // Load tags from task 'tags' relation field (array of IDs)
        // If task comes from useTasks with 'expand', task.tags might be IDs or objects depending on SDK version/expansion.
        // Usually plain field access gives IDs.
        if (task.tags && Array.isArray(task.tags)) {
          setSelectedTags(task.tags)
        } else {
          // Fallback if using join table or not expanded properly initially
          // For now assume tasks have tags array.
          setSelectedTags([])
        }

        // Load users for assignment
        loadTeamMembers()
      } else {
        setSelectedTags([])
        loadTeamMembers()
      }
    } else {
      // Reset when modal closes
      setSelectedTags([])
    }
  }, [open, task])

  // Populate form when editing or reset for creation
  useEffect(() => {
    if (task?.id) {
      // Editing existing task - populate from task data
      // Determine assignment mode based on task data
      const isTeamTask = task.team_id && !task.assigned_to && task.status === 'unassigned'
      setAssignmentMode(isTeamTask ? 'team' : 'individual')

      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        // Truncate ISO date to YYYY-MM-DD for date input
        due_date: task.due_date ? task.due_date.substring(0, 10) : '',
        duration: task.duration || 60,
        // scheduled_time is datetime-local, needs YYYY-MM-DDTHH:mm
        scheduled_time: task.scheduled_time ? task.scheduled_time.substring(0, 16) : '',
        reminder_minutes: task.reminder_minutes ?? null,
        category_id: task.category_id || '',
        project_id: task.project_id || '',
        blocked_reason: task.blocked_reason || '',
        recurrence: task.recurrence || '',
        recurrence_end: task.recurrence_end ? task.recurrence_end.substring(0, 10) : '',
        recurrence_rule: task.recurrence_rule || '',
        type: task.type || 'task',
        agenda: task.agenda || '',
        // Meeting-specific fields
        start_time: task.start_time ? task.start_time.substring(0, 16) : '',
        end_time: task.end_time ? task.end_time.substring(0, 16) : '',
        location: task.location || '',
        meeting_link: task.meeting_link || '',
        // Task Pool fields
        claimed_at: task.claimed_at || '',
        claimed_by: task.claimed_by || '',
        claim_deadline: task.claim_deadline ? task.claim_deadline.substring(0, 10) : '',
        campaign_id: task.campaign_id || '',
        context_id: task.context_id || '',
        contact_id: task.contact_id || '',
        team_id: task.team_id || '',
        assigned_to: task.assigned_to || ''
      })
    } else {
      // Creating new task/meeting - use defaults + type from task prop if provided
      setAssignmentMode('individual')

      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        duration: task?.type === 'meeting' ? 30 : 60,
        scheduled_time: task?.scheduled_time || '',
        reminder_minutes: null,
        category_id: '',
        project_id: '',
        blocked_reason: '',
        recurrence: '',
        recurrence_end: '',
        recurrence_rule: '',
        type: task?.type || 'task',
        agenda: '',
        // Meeting-specific fields
        start_time: task?.start_time || '',
        end_time: task?.end_time || '',
        location: '',
        meeting_link: '',
        // Task Pool fields
        claimed_at: '',
        claimed_by: '',
        claim_deadline: '',
        campaign_id: '',
        context_id: (activeWorkspaceId === 'trash' || activeWorkspaceId === 'archive') ? (defaultWorkspaceId || '') : (activeWorkspaceId || defaultWorkspaceId || ''),
        contact_id: '',
        team_id: currentTeam ? currentTeam.id : '',
        assigned_to: ''
      })
    }
  }, [task, activeWorkspaceId])

  const loadTeamMembers = async () => {
    try {
      // Fetch users directly via service
      const records = await teamsService.getAllUsers()

      // Map to structure expected
      const members = records.map(user => ({
        user_id: user.id,
        auth_user: user
      }))
      setTeamMembers(members)
    } catch (error) {
      console.error('Error loading team members:', error)
    }
  }

  const loadCategoriesAndProjects = async () => {
    try {
      const [categoriesRes, projectsRes, tagsRes, campaignsRes] = await Promise.all([
        categoriesService.getAll(),
        projectsService.getAll(),
        tagsService.getAll(),
        campaignsService.getAll()
      ])

      // Handle raw array or ListResult wrapper if necessary
      // Services return array usually.

      setCategories(categoriesRes || [])
      setProjects(projectsRes || [])
      setTags(tagsRes?.items || tagsRes || [])
      setCampaigns(campaignsRes || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      return
    }

    const isSpecialView = activeWorkspaceId === 'trash' || activeWorkspaceId === 'archive'
    if (!isEditing && (!activeWorkspaceId || isSpecialView) && !formData.context_id) {
      toast.error('Please select a workspace before creating')
      return
    }

    setLoading(true)

    try {
      // Include selected tags in the payload
      const payload = {
        ...formData,
        tags: selectedTags
      }

      if (isEditing) {
        await updateTask.mutateAsync({
          id: task.id,
          updates: payload
        })
      } else {
        await createTask.mutateAsync(payload)
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Move this task to trash?')) {
      return
    }

    setLoading(true)
    try {
      await deleteTask.mutateAsync(task.id)
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    setLoading(true)
    try {
      await archiveTask.mutateAsync(task.id)
      onOpenChange(false)
    } catch (error) {
      console.error('Error archiving task:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? (formData.type === 'meeting' ? 'Edit Meeting' : 'Edit Task')
              : (formData.type === 'meeting' ? 'Create New Meeting' : 'Create New Task')
            }
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? (formData.type === 'meeting' ? 'Update meeting details below' : 'Update task details below')
              : (formData.type === 'meeting' ? 'Fill in the meeting details below' : 'Fill in the task details below')
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className={`grid w-full mb-4 ${formData.type === 'meeting' ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="details">Details</TabsTrigger>
            {formData.type === 'meeting' && (
              <TabsTrigger value="agenda" disabled={!isEditing}>Agenda</TabsTrigger>
            )}
            <TabsTrigger value="blockers" disabled={!isEditing}>Blockers</TabsTrigger>
            <TabsTrigger value="comments" disabled={!isEditing}>💬 Comments</TabsTrigger>
            <TabsTrigger value="notes" disabled={!isEditing}>Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <form onSubmit={handleSubmit} className="space-y-1">

              {/* Essential: Title + Description (always visible) */}
              <div className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={formData.type === 'meeting' ? 'Meeting title...' : 'Task title...'}
                    className="text-base font-semibold h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add details..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Section: Planification */}
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer py-3 border-t border-base-200 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80 transition-opacity select-none">
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                  Planification
                </summary>
                <div className="pb-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.status === 'blocked' && (
                    <div className="space-y-2">
                      <Label htmlFor="blocked_reason">Blocked Reason</Label>
                      <Input
                        id="blocked_reason"
                        value={formData.blocked_reason}
                        onChange={(e) => setFormData({ ...formData, blocked_reason: e.target.value })}
                        placeholder="Why is this task blocked?"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (min)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                        min="5"
                        step="5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduled_time">Scheduled Time</Label>
                    <Input
                      id="scheduled_time"
                      type="datetime-local"
                      value={formData.scheduled_time}
                      onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    />
                  </div>

                  <ReminderPicker
                    value={formData.reminder_minutes}
                    onChange={(value) => setFormData({ ...formData, reminder_minutes: value })}
                  />

                  {/* Meeting-specific fields */}
                  {formData.type === 'meeting' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start_time">Start Time</Label>
                          <Input
                            id="start_time"
                            type="datetime-local"
                            value={formData.start_time}
                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end_time">End Time</Label>
                          <Input
                            id="end_time"
                            type="datetime-local"
                            value={formData.end_time}
                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="Meeting location or address..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="meeting_link">Meeting Link</Label>
                        <Input
                          id="meeting_link"
                          type="url"
                          value={formData.meeting_link}
                          onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                          placeholder="https://zoom.us/j/..."
                        />
                      </div>
                    </>
                  )}
                </div>
              </details>

              {/* Section: Organisation */}
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer py-3 border-t border-base-200 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80 transition-opacity select-none">
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                  Organisation
                </summary>
                <div className="pb-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category_id || undefined} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project">Département</Label>
                      <Select value={formData.project_id || undefined} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un département" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((proj) => (
                            <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 rounded-xl bg-base-200/30 p-3 min-h-[2.5rem]">
                      {tags.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No tags available</p>
                      ) : (
                        tags.map(tag => {
                          const isSelected = selectedTags.includes(tag.id)
                          return (
                            <Badge
                              key={tag.id}
                              variant={isSelected ? "default" : "outline"}
                              className="cursor-pointer select-none transition-all hover:scale-105 rounded-lg"
                              style={isSelected ? { backgroundColor: tag.color, color: 'white' } : { borderColor: tag.color, color: tag.color }}
                              onClick={() => {
                                setSelectedTags(prev =>
                                  isSelected ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                                )
                              }}
                            >
                              {tag.name}
                            </Badge>
                          )
                        })
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign">Projet</Label>
                    <Select value={formData.campaign_id || 'none'} onValueChange={(value) => setFormData({ ...formData, campaign_id: value === 'none' ? null : value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un projet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {campaigns.map((camp) => (
                          <SelectItem key={camp.id} value={camp.id}>{camp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </details>

              {/* Section: Liens */}
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer py-3 border-t border-base-200 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80 transition-opacity select-none">
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                  Liens
                </summary>
                <div className="pb-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact">Client</Label>
                    <Select value={formData.contact_id || 'none'} onValueChange={(value) => setFormData({ ...formData, contact_id: value === 'none' ? null : value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {contactsList.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name} {contact.company && `(${contact.company})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assignment Mode Selection */}
                  {currentTeam && teamMembers.length > 0 && (
                    <div className="space-y-4 p-4 rounded-xl bg-base-200/30 dark:bg-white/5">
                      <Label>Mode d'assignation</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="assignmentMode"
                            value="individual"
                            checked={assignmentMode === 'individual'}
                            onChange={(e) => {
                              setAssignmentMode(e.target.value)
                              setFormData({ ...formData, assigned_to: '', status: 'todo' })
                            }}
                            className="radio radio-sm radio-primary"
                          />
                          <span className="text-sm">Assigner à un membre</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="assignmentMode"
                            value="team"
                            checked={assignmentMode === 'team'}
                            onChange={(e) => {
                              setAssignmentMode(e.target.value)
                              setFormData({ ...formData, assigned_to: null, status: 'unassigned' })
                            }}
                            className="radio radio-sm radio-primary"
                          />
                          <span className="text-sm">Assigner à l'équipe (Pool)</span>
                        </label>
                      </div>

                      {assignmentMode === 'individual' && (
                        <div className="space-y-2">
                          <Label htmlFor="assigned_to">Membre assigné</Label>
                          <Select value={formData.assigned_to || 'none'} onValueChange={(value) => setFormData({ ...formData, assigned_to: value === 'none' ? null : value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Non assigné" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Non assigné</SelectItem>
                              {teamMembers.map((member) => (
                                <SelectItem key={member.user_id} value={member.user_id}>
                                  {member.auth_user?.email || `User ${member.user_id.slice(0, 8)}...`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {assignmentMode === 'team' && (
                        <div className="space-y-2">
                          <Label htmlFor="claim_deadline">Date limite pour prendre la tâche (optionnel)</Label>
                          <Input
                            id="claim_deadline"
                            type="date"
                            value={formData.claim_deadline}
                            onChange={(e) => setFormData({ ...formData, claim_deadline: e.target.value })}
                          />
                          <p className="text-xs opacity-60">
                            ⚡ Cette tâche sera disponible dans le pool de l'équipe. Les membres pourront la prendre librement.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Workspace Selector */}
                  {(!activeWorkspaceId || activeWorkspaceId === 'trash' || activeWorkspaceId === 'archive') ? (
                    <div className="space-y-2 p-3 rounded-xl bg-base-200/30">
                      <Label htmlFor="context" className="flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        Workspace *
                      </Label>
                      <Select
                        value={formData.context_id || 'none'}
                        onValueChange={(value) => setFormData({ ...formData, context_id: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger className={!formData.context_id ? 'border-amber-500' : ''}>
                          <SelectValue placeholder="Select a workspace" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" disabled>Select a workspace...</SelectItem>
                          {workspaces.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color || '#6366f1' }} />
                                {w.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Creating in:</span>
                      <Badge variant="outline" className="rounded-lg" style={{ borderColor: getActiveWorkspace()?.color, color: getActiveWorkspace()?.color }}>
                        {getActiveWorkspace()?.name || 'Unknown Workspace'}
                      </Badge>
                    </div>
                  )}
                </div>
              </details>

              {/* Section: Recurrence (only when relevant) */}
              {(formData.recurrence || isEditing) && (
                <details className="group" open={!!formData.recurrence}>
                  <summary className="flex items-center gap-2 cursor-pointer py-3 border-t border-base-200 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80 transition-opacity select-none">
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                    Recurrence
                  </summary>
                  <div className="pb-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recurrence">Frequency</Label>
                        <Select value={formData.recurrence || 'none'} onValueChange={(value) => setFormData({ ...formData, recurrence: value === 'none' ? '' : value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="No recurrence" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No recurrence</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.recurrence && (
                        <div className="space-y-2">
                          <Label htmlFor="recurrence_end">End Date</Label>
                          <Input
                            id="recurrence_end"
                            type="date"
                            value={formData.recurrence_end}
                            onChange={(e) => setFormData({ ...formData, recurrence_end: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-base-200">
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleArchive}
                        disabled={loading}
                        title="Archive"
                        className="opacity-50 hover:opacity-100"
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleDelete}
                        disabled={loading}
                        title="Move to Trash"
                        className="opacity-50 hover:opacity-100 hover:text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isEditing ? 'Save Changes' : (formData.type === 'meeting' ? 'Create Meeting' : 'Create Task')}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          {/* Agenda Tab (for meetings only) */}
          {formData.type === 'meeting' && (
            <TabsContent value="agenda" className="min-h-[300px]">
              {isEditing ? (
                <MeetingAgendaManager meetingId={task.id} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <p>Please create the meeting first to manage the agenda.</p>
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="blockers" className="min-h-[300px]">
            {isEditing ? (
              <BlockerManager taskId={task.id} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Please create the task first to manage blockers.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="h-[400px]">
            {isEditing ? (
              <TaskComments taskId={task.id} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Please create the task first to add comments.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="h-[400px]">
            {isEditing ? (
              <TaskNotes taskId={task.id} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Please create the task first to add notes.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent >
    </Dialog >
  )
}
