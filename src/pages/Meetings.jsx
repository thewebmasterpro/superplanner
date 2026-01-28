import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Loader2, Filter, X, ArrowUpDown, Columns, User, Video } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useContactsList } from '../hooks/useContacts'
import { useUIStore } from '../stores/uiStore'
import { useContextStore } from '../stores/contextStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card } from '@/components/ui/card'
import { TaskModal } from '@/components/TaskModal'
import { BulkActionsBar } from '@/components/BulkActionsBar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '../lib/supabase'
import { CampaignModal } from '../components/CampaignModal'
import { KanbanView } from '../components/KanbanView'
import { useUpdateTask } from '../hooks/useTasks'

export function Meetings() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: contactsList = [] } = useContactsList()
  const updateTaskMutation = useUpdateTask()
  const { isTaskModalOpen, setTaskModalOpen } = useUIStore()
  const { contexts, activeContextId } = useContextStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [contextFilter, setContextFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('meeting')
  const [tagFilter, setTagFilter] = useState('all')
  const [dueDateFilter, setDueDateFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('created_desc')
  const [visibleColumns, setVisibleColumns] = useState({
    status: true,
    dueDate: true,
    priority: true
  })
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [isCampaignModalOpen, setCampaignModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState('table') // 'table' or 'kanban'
  const [completingTaskId, setCompletingTaskId] = useState(null)

  // Fetch tags and campaigns for filters
  const [tags, setTags] = useState([])
  const [campaigns, setCampaigns] = useState([])

  useEffect(() => {
    loadFilterOptions()
  }, [])

  // Reset context filter when active context changes (e.g. switching to Trash/Archive or between contexts)
  useEffect(() => {
    setContextFilter('all')
    // We might want to reset other filters too, but context filter is critical to avoid empty states
    // if switching from Context A to Context B while filtering by Context A.
  }, [activeContextId])

  const loadFilterOptions = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const [tagsRes, campaignsRes] = await Promise.all([
      supabase.from('tags').select('id, name, color').eq('user_id', user.id).order('name'),
      supabase.from('campaigns').select('id, name').eq('user_id', user.id).order('name')
    ])

    setTags(tagsRes.data || [])
    setCampaigns(campaignsRes.data || [])
  }

  const statusColors = {
    todo: 'bg-status-todo/20 text-status-todo border-status-todo/30',
    in_progress: 'bg-status-in_progress/20 text-status-in_progress border-status-in_progress/30',
    blocked: 'bg-status-blocked/20 text-status-blocked border-status-blocked/30',
    done: 'bg-status-done/20 text-status-done border-status-done/30',
    cancelled: 'bg-status-cancelled/20 text-status-cancelled border-status-cancelled/30',
  }

  const priorityColors = {
    1: 'bg-priority-1',
    2: 'bg-priority-2',
    3: 'bg-priority-3',
    4: 'bg-priority-4',
    5: 'bg-priority-5',
  }

  // Get today and week dates for due date filter
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(today)
  endOfWeek.setDate(today.getDate() + 7)

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const result = tasks.filter((task) => {
      const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || task.priority === parseInt(priorityFilter)
      const matchesContext = contextFilter === 'all' ||
        (contextFilter === 'none' ? !task.context_id : task.context_id === contextFilter)
      const matchesCampaign = campaignFilter === 'all' ||
        (campaignFilter === 'none' ? !task.campaign_id : task.campaign_id === campaignFilter)
      const matchesType = typeFilter === 'all' || task.type === typeFilter
      const matchesTag = tagFilter === 'all' ||
        task.task_tags?.some(tt => tt.tag?.id === tagFilter)
      const matchesClient = clientFilter === 'all' ||
        task.contact_id === clientFilter

      // Assignee Filter (My Tasks)
      // We need current user ID. Assuming we fetch it or pass it. 
      // For now, let's assume we filter by "assigned to me" if specific value 'me' is selected.
      // But we need user ID.
      // Let's use `supabase.auth.getUser()` in useEffect or store?
      // Better: filter. assigneeFilter === 'me'
      let matchesAssignee = true
      // Note: we can't easily filter by 'me' without the ID synchronously here unless we store it.
      // Assuming tasks have assigned_to UUID.
      if (assigneeFilter === 'assigned') {
        matchesAssignee = !!task.assigned_to
      } else if (assigneeFilter === 'unassigned') {
        matchesAssignee = !task.assigned_to
      }

      // Due date filter
      let matchesDueDate = true
      if (dueDateFilter !== 'all' && task.due_date) {
        const dueDate = new Date(task.due_date)
        dueDate.setHours(0, 0, 0, 0)

        if (dueDateFilter === 'overdue') {
          matchesDueDate = dueDate < today && task.status !== 'done'
        } else if (dueDateFilter === 'today') {
          matchesDueDate = dueDate.getTime() === today.getTime()
        } else if (dueDateFilter === 'week') {
          matchesDueDate = dueDate >= today && dueDate <= endOfWeek
        } else if (dueDateFilter === 'no_date') {
          matchesDueDate = false
        }
      } else if (dueDateFilter === 'no_date') {
        matchesDueDate = !task.due_date
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesContext &&
        matchesCampaign && matchesType && matchesTag && matchesDueDate && matchesClient && matchesAssignee
    })

    // Sort tasks
    return result.sort((a, b) => {
      switch (sortOrder) {
        case 'priority_desc': // High to Low
          return (b.priority || 0) - (a.priority || 0)
        case 'priority_asc': // Low to High
          return (a.priority || 0) - (b.priority || 0)
        case 'duedate_asc': // Soonest first
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date) - new Date(b.due_date)
        case 'duedate_desc': // Furthest first
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(b.due_date) - new Date(a.due_date)
        case 'title_asc':
          return (a.title || '').localeCompare(b.title || '')
        case 'created_asc':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'created_desc':
        default:
          return new Date(b.created_at) - new Date(a.created_at)
      }
    })
  }, [tasks, searchQuery, statusFilter, priorityFilter, contextFilter, campaignFilter, typeFilter, tagFilter, dueDateFilter, clientFilter, assigneeFilter, sortOrder])

  // Count active filters
  const activeFilterCount = [
    statusFilter !== 'all',
    priorityFilter !== 'all',
    contextFilter !== 'all',
    campaignFilter !== 'all',
    typeFilter !== 'all',
    tagFilter !== 'all',
    clientFilter !== 'all',
    tagFilter !== 'all',
    clientFilter !== 'all',
    dueDateFilter !== 'all',
    assigneeFilter !== 'all',
  ].filter(Boolean).length

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setContextFilter('all')
    setCampaignFilter('all')
    setTypeFilter('all')
    setTagFilter('all')
    setDueDateFilter('all')
    setTagFilter('all')
    setDueDateFilter('all')
    setClientFilter('all')
    setAssigneeFilter('all')
  }

  // Selection handlers
  const toggleSelect = (taskId, e) => {
    e?.stopPropagation?.()
    setSelectedIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTasks.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredTasks.map(t => t.id))
    }
  }

  const clearSelection = () => setSelectedIds([])

  const isAllSelected = filteredTasks.length > 0 && selectedIds.length === filteredTasks.length
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < filteredTasks.length

  return (
    <div className="container-tight py-8 section-gap context-transition animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-display flex items-center gap-2">
            <Video className="w-8 h-8" style={activeContextId && contexts.find(c => c.id === activeContextId) ? { color: contexts.find(c => c.id === activeContextId).color } : { color: 'var(--primary)' }} />
            Meetings
          </h1>
          <p className="text-muted-foreground font-medium">Manage your scheduled meetings and agendas</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-muted p-1 rounded-lg flex mr-2">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-3"
            >
              List
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="h-8 px-3"
            >
              Board
            </Button>
          </div>
          <Button variant="outline" onClick={() => setCampaignModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
          <Button variant="outline" onClick={() => {
            setSelectedTask({ type: 'task' })
            setTaskModalOpen(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
          <Button onClick={() => {
            setSelectedTask({ type: 'meeting' })
            setTaskModalOpen(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            New Meeting
          </Button>
        </div>
      </div>

      {/* Search + Filter Toggle */}
      <Card className="glass-panel p-4 border-border/40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-border/50 focus:bg-background transition-all"
              />
            </div>
          </div>

          <Button
            variant={showFilters ? "secondary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {(activeFilterCount > 0 || searchQuery) && (
            <Button variant="ghost" onClick={clearAllFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-4 pt-4 border-t">
            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="5">P5 (High)</SelectItem>
                <SelectItem value="4">P4</SelectItem>
                <SelectItem value="3">P3</SelectItem>
                <SelectItem value="2">P2</SelectItem>
                <SelectItem value="1">P1 (Low)</SelectItem>
              </SelectContent>
            </Select>

            {/* Context */}
            <Select value={contextFilter} onValueChange={setContextFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Context</SelectItem>
                <SelectItem value="none">No Context</SelectItem>
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
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaign</SelectItem>
                <SelectItem value="none">No Campaign</SelectItem>
                {campaigns.map(camp => (
                  <SelectItem key={camp.id} value={camp.id}>{camp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter Removed */}

            {/* Tag */}
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
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

            {/* Due Date */}
            <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Due Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="overdue">🔴 Overdue</SelectItem>
                <SelectItem value="today">📅 Today</SelectItem>
                <SelectItem value="week">📆 This Week</SelectItem>
                <SelectItem value="no_date">No Date</SelectItem>
              </SelectContent>
            </Select>
            {/* Client (New) */}
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {contactsList.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} {contact.company && `(${contact.company})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Assignee Filter */}
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="assigned">👷 Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>

            {/* Sorting (New) */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="border-dashed">
                <ArrowUpDown className="w-4 h-4 mr-2 opacity-50" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Newest Created</SelectItem>
                <SelectItem value="created_asc">Oldest Created</SelectItem>
                <SelectItem value="priority_desc">Highest Priority</SelectItem>
                <SelectItem value="priority_asc">Lowest Priority</SelectItem>
                <SelectItem value="duedate_asc">Due Soonest</SelectItem>
                <SelectItem value="duedate_desc">Due Latest</SelectItem>
                <SelectItem value="title_asc">Title (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            {/* Column Visibility (New) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-dashed">
                  <Columns className="w-4 h-4 mr-2 opacity-50" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.status}
                  onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, status: checked }))}
                >
                  Status
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.dueDate}
                  onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, dueDate: checked }))}
                >
                  Due Date
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.priority}
                  onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, priority: checked }))}
                >
                  Priority
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </Card>

      {/* Selection count */}
      {selectedIds.length > 0 && viewMode === 'table' && (
        <div className="flex items-center gap-2 px-1">
          <Badge variant="secondary" className="px-3 py-1">
            {selectedIds.length} meetings selected
          </Badge>
          <Button variant="ghost" size="sm" onClick={clearSelection} className="h-8">
            Clear Selection
          </Button>
        </div>
      )}

      {/* Content: Table or Kanban */}
      {viewMode === 'table' ? (
        <Card className="glass-panel overflow-hidden border-border/40 shadow-xl rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <Checkbox
                      checked={isAllSelected}
                      ref={el => el && (el.indeterminate = isSomeSelected)}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                      className="border-border/50"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Title</th>
                  {visibleColumns.status && <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>}
                  {visibleColumns.dueDate && <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Due Date</th>}
                  {visibleColumns.priority && <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Priority</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p>Loading meetings...</p>
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                      {tasks.length === 0
                        ? 'No meetings yet. Create one to get started!'
                        : 'No meetings match your filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const isOverdue = task.due_date && new Date(task.due_date) < today && task.status !== 'done'

                    return (
                      <TaskRow
                        key={task.id}
                        task={task}
                        isSelected={selectedIds.includes(task.id)}
                        isCompleting={completingTaskId === task.id}
                        onSelect={(e) => {
                          e?.stopPropagation()
                          toggleSelect(task.id)
                        }}
                        onComplete={async () => {
                          setCompletingTaskId(task.id)
                          await updateTaskMutation.mutateAsync({ id: task.id, updates: { status: 'done' } })
                          setTimeout(() => setCompletingTaskId(null), 1000)
                        }}
                        onClick={() => {
                          setSelectedTask(task)
                          setTaskModalOpen(true)
                        }}
                        isOverdue={isOverdue}
                        statusColors={statusColors}
                        priorityColors={priorityColors}
                        visibleColumns={visibleColumns}
                      />
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <KanbanView
          tasks={filteredTasks}
          onStatusChange={(taskId, newStatus) => {
            updateTaskMutation.mutate({ id: taskId, updates: { status: newStatus } })
          }}
          onTaskClick={(task) => {
            setSelectedTask(task)
            setTaskModalOpen(true)
          }}
        />
      )}

      {/* Results count */}
      {
        filteredTasks.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </p>
        )
      }

      {/* Bulk Actions Bar */}
      {
        selectedIds.length > 0 && (
          <BulkActionsBar
            selectedIds={selectedIds}
            onClear={clearSelection}
            onSuccess={clearSelection}
          />
        )
      }

      {/* Task Modal */}
      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={setTaskModalOpen}
        task={selectedTask}
      />

      <CampaignModal
        open={isCampaignModalOpen}
        onOpenChange={setCampaignModalOpen}
        onSuccess={loadFilterOptions}
      />
    </div >
  )
}

// Task Row Component with polish
function TaskRow({ task, isSelected, isCompleting, onSelect, onComplete, onClick, isOverdue, statusColors, priorityColors, visibleColumns }) {

  const handleCheck = (checked) => {
    if (checked && task.status !== 'done') {
      onComplete()
    }
    onSelect()
  }

  return (
    <tr
      className={`border-b border-border/30 transition-all duration-300 cursor-pointer group relative
        ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'}
      `}
      style={{
        borderLeft: isSelected && task.context?.color
          ? `3px solid ${task.context.color}`
          : '3px solid transparent'
      }}
      onClick={onClick}
    >
      <td className="px-4 py-4 w-[50px]">
        <div className="relative flex items-center justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheck}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </td>
      <td className="px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            {task.type === 'meeting' && <span className="text-xl">📅</span>}
            <p className={`font-medium transition-all ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </p>
            {task.context && (
              <Badge
                variant="outline"
                className="text-xs transition-colors"
                style={{
                  backgroundColor: `${task.context.color}15`,
                  borderColor: task.context.color,
                  color: task.context.color
                }}
              >
                {task.context.name}
              </Badge>
            )}
            {task.campaign && (
              <Badge
                variant="outline"
                className="text-xs border-indigo-200 bg-indigo-50 text-indigo-700 bg-gradient-to-r from-indigo-50 to-white"
              >
                🚀 {task.campaign.name}
              </Badge>
            )}
            {task.contact_id && (
              <Badge
                variant="outline"
                className="text-xs border-blue-200 bg-blue-50 text-blue-700"
              >
                👤 Client
              </Badge>
            )}
            {task.assigned_to && (
              <div className="ml-1" title="Assigned">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
          {task.task_tags && task.task_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {task.task_tags.map(({ tag }) => tag && (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-[10px] px-1 py-0 h-5 border-none"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1 group-hover:text-foreground/80 transition-colors">
              {task.description}
            </p>
          )}
        </div>
      </td>

      {
        visibleColumns.status && (
          <td className="px-6 py-4">
            <Badge className={`${statusColors[task.status]} transition-all duration-300 shadow-sm border border-border/20 group-hover:scale-105 group-hover:shadow-md`}>
              {task.status?.replace('_', ' ')}
            </Badge>
          </td>
        )
      }

      {
        visibleColumns.dueDate && (
          <td className={`px-6 py-4 text-sm transition-colors ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
            {task.due_date ? (
              <span className="flex items-center gap-1">
                {isOverdue && '🔴'}
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            ) : '-'}
          </td>
        )
      }

      {
        visibleColumns.priority && (
          <td className="px-6 py-4">
            <div className={`w-3 h-3 rounded-full ${priorityColors[task.priority] || 'bg-gray-300'} shadow-sm`} />
          </td>
        )
      }
    </tr >
  )
}
