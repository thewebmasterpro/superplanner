import { useState, useEffect } from 'react'
import { useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks'
import { supabase } from '../lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TaskNotes } from './TaskNotes'

export function TaskModal({ open, onOpenChange, task = null }) {
  const isEditing = !!task
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [categories, setCategories] = useState([])
  const [projects, setProjects] = useState([])
  const [tags, setTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [loading, setLoading] = useState(false)

  // Agenda Items (sub-tasks) for meetings
  const [agendaItems, setAgendaItems] = useState([])
  const [newAgendaItem, setNewAgendaItem] = useState({ title: '', description: '', priority: 3 })
  const [showAgendaForm, setShowAgendaForm] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 3,
    due_date: '',
    duration: 60,
    scheduled_time: '',
    category_id: '',
    project_id: '',
    blocked_reason: '',
    recurrence: '',
    recurrence_end: '',
    type: 'task',    // 'task' or 'meeting'
    agenda: ''       // for meetings (deprecated, replaced by agendaItems)
  })

  // Load categories, projects, and agenda items
  useEffect(() => {
    if (open) {
      loadCategoriesAndProjects()
      if (task) {
        if (task.type === 'meeting') {
          loadAgendaItems(task.id)
        }
        loadTaskTags(task.id)
      } else {
        setSelectedTags([])
      }
    } else {
      // Reset when modal closes
      setAgendaItems([])
      setShowAgendaForm(false)
      setNewAgendaItem({ title: '', description: '', priority: 3 })
      setSelectedTags([])
    }
  }, [open, task])

  // Populate form when editing
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 3,
        due_date: task.due_date || '',
        duration: task.duration || 60,
        scheduled_time: task.scheduled_time || '',
        category_id: task.category_id || '',
        project_id: task.project_id || '',
        blocked_reason: task.blocked_reason || '',
        recurrence: task.recurrence || '',
        recurrence_end: task.recurrence_end || '',
        type: task.type || 'task',
        agenda: task.agenda || ''
      })
    } else {
      // Reset form for creation
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 3,
        due_date: '',
        duration: 60,
        scheduled_time: '',
        category_id: '',
        project_id: '',
        blocked_reason: '',
        recurrence: '',
        recurrence_end: '',
        type: 'task',
        agenda: ''
      })
    }
  }, [task])

  const loadCategoriesAndProjects = async () => {
    try {
      const [categoriesRes, projectsRes, tagsRes] = await Promise.all([
        supabase.from('task_categories').select('*').order('name'),
        supabase.from('projects').select('*').order('name'),
        supabase.from('tags').select('*').order('name')
      ])

      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (projectsRes.data) setProjects(projectsRes.data)
      if (tagsRes.data) setTags(tagsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadTaskTags = async (taskId) => {
    try {
      const { data, error } = await supabase
        .from('task_tags')
        .select('tag_id')
        .eq('task_id', taskId)

      if (error) throw error
      setSelectedTags(data.map(t => t.tag_id))
    } catch (error) {
      console.error('Error loading task tags:', error)
    }
  }

  const loadAgendaItems = async (meetingId) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('parent_meeting_id', meetingId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setAgendaItems(data || [])
    } catch (error) {
      console.error('Error loading agenda items:', error)
    }
  }

  const createAgendaItem = async () => {
    if (!newAgendaItem.title.trim() || !task?.id) return

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        parent_meeting_id: task.id,
        title: newAgendaItem.title,
        description: newAgendaItem.description || null,
        priority: newAgendaItem.priority,
        status: 'todo',
        type: 'task',
        due_date: task.due_date // Inherit meeting date
      })

      if (error) throw error

      // Reload agenda items
      await loadAgendaItems(task.id)

      // Reset form
      setNewAgendaItem({ title: '', description: '', priority: 3 })
      setShowAgendaForm(false)
    } catch (error) {
      console.error('Error creating agenda item:', error)
    }
  }

  const toggleAgendaItemStatus = async (itemId, currentStatus) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done'

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null })
        .eq('id', itemId)

      if (error) throw error
      await loadAgendaItems(task.id)
    } catch (error) {
      console.error('Error updating agenda item:', error)
    }
  }

  const deleteAgendaItem = async (itemId) => {
    if (!confirm('Delete this agenda item?')) return

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', itemId)
      if (error) throw error
      await loadAgendaItems(task.id)
    } catch (error) {
      console.error('Error deleting agenda item:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      return
    }

    setLoading(true)

    try {
      let taskId = task?.id

      if (isEditing) {
        await updateTask.mutateAsync({
          id: task.id,
          updates: formData
        })
      } else {
        const newTask = await createTask.mutateAsync(formData)
        taskId = newTask.id // Ensure backend returns the full object or ID
      }

      // Handle Tags (Delete all and re-insert for simplicity)
      if (taskId) {
        // 1. Delete existing tags
        await supabase.from('task_tags').delete().eq('task_id', taskId)

        // 2. Insert new tags
        if (selectedTags.length > 0) {
          const tagsToInsert = selectedTags.map(tagId => ({
            task_id: taskId,
            tag_id: tagId
          }))
          const { error: tagError } = await supabase.from('task_tags').insert(tagsToInsert)
          if (tagError) console.error('Error saving tags:', tagError)
        }
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? (formData.type === 'meeting' ? 'Edit Meeting' : 'Edit Task') : (formData.type === 'meeting' ? 'Create New Meeting' : 'Create New Task')}</DialogTitle>
          <DialogDescription>
            {isEditing ? (formData.type === 'meeting' ? 'Update meeting details below' : 'Update task details below') : (formData.type === 'meeting' ? 'Fill in the meeting details below' : 'Fill in the task details below')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes" disabled={!isEditing}>Notes & Comments</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-4">
            {/* Task/Meeting Type Toggle (only when creating) */}
            {!isEditing && (
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                  type="button"
                  variant={formData.type === 'task' ? 'default' : 'ghost'}
                  className="flex-1"
                  onClick={() => setFormData({ ...formData, type: 'task' })}
                >
                  ✅ Task
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'meeting' ? 'default' : 'ghost'}
                  className="flex-1"
                  onClick={() => setFormData({ ...formData, type: 'meeting' })}
                >
                  📅 Meeting
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Task title"
                  required
                />
              </div>

              {/* Description OR Agenda Items based on type */}
              {formData.type === 'meeting' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>📝 Meeting Agenda Items</Label>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAgendaForm(!showAgendaForm)}
                      >
                        {showAgendaForm ? 'Cancel' : '+ Add Item'}
                      </Button>
                    )}
                  </div>

                  {/* Existing Agenda Items */}
                  {isEditing && agendaItems.length > 0 && (
                    <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                      {agendaItems.map((item) => (
                        <div key={item.id} className="flex items-start gap-2 group">
                          <input
                            type="checkbox"
                            checked={item.status === 'done'}
                            onChange={() => toggleAgendaItemStatus(item.id, item.status)}
                            className="mt-1 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className={`font-medium ${item.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            P{item.priority}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAgendaItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Agenda Item Form */}
                  {isEditing && showAgendaForm && (
                    <div className="border rounded-lg p-3 space-y-2 bg-background">
                      <Input
                        placeholder="Agenda item title *"
                        value={newAgendaItem.title}
                        onChange={(e) => setNewAgendaItem({ ...newAgendaItem, title: e.target.value })}
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        value={newAgendaItem.description}
                        onChange={(e) => setNewAgendaItem({ ...newAgendaItem, description: e.target.value })}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Select
                          value={String(newAgendaItem.priority)}
                          onValueChange={(value) => setNewAgendaItem({ ...newAgendaItem, priority: parseInt(value) })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Priority 1</SelectItem>
                            <SelectItem value="2">Priority 2</SelectItem>
                            <SelectItem value="3">Priority 3</SelectItem>
                            <SelectItem value="4">Priority 4</SelectItem>
                            <SelectItem value="5">Priority 5</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={createAgendaItem}
                          size="sm"
                          disabled={!newAgendaItem.title.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Info message for new meetings */}
                  {!isEditing && (
                    <p className="text-sm text-muted-foreground italic">
                      Save the meeting first, then you can add agenda items.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Task description (optional)"
                    rows={3}
                  />
                </div>
              )}

              {/* Row 1: Status, Priority */}
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
                  <Select value={String(formData.priority)} onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Priority 1 (Low)</SelectItem>
                      <SelectItem value="2">Priority 2</SelectItem>
                      <SelectItem value="3">Priority 3 (Medium)</SelectItem>
                      <SelectItem value="4">Priority 4</SelectItem>
                      <SelectItem value="5">Priority 5 (High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Blocked Reason (conditional) */}
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

              {/* Row 2: Category, Project */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category_id || undefined} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select value={formData.project_id || undefined} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((proj) => (
                        <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tags Selection */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 border rounded-md p-3 min-h-[2.5rem]">
                  {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tags available. Create them in Settings.</p>
                  ) : (
                    tags.map(tag => {
                      const isSelected = selectedTags.includes(tag.id)
                      return (
                        <Badge
                          key={tag.id}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer select-none transition-all"
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

              {/* Row 3: Due Date, Duration */}
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
                  <Label htmlFor="duration">Duration (minutes)</Label>
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

              {/* Scheduled Time */}
              <div className="space-y-2">
                <Label htmlFor="scheduled_time">Scheduled Time</Label>
                <Input
                  id="scheduled_time"
                  type="datetime-local"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
              </div>

              {/* Row 4: Recurrence */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recurrence">Recurrence</Label>
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
                    <Label htmlFor="recurrence_end">Recurrence End Date</Label>
                    <Input
                      id="recurrence_end"
                      type="date"
                      value={formData.recurrence_end}
                      onChange={(e) => setFormData({ ...formData, recurrence_end: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                {isEditing && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isEditing ? 'Save Changes' : (formData.type === 'meeting' ? '📅 Create Meeting' : '✅ Create Task')}
                </Button>
              </DialogFooter>
            </form>
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
      </DialogContent>
    </Dialog>
  )
}
