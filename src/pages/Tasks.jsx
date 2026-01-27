import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Loader2, Filter, X } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
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
import { Card } from '@/components/ui/card'
import { TaskModal } from '@/components/TaskModal'
import { BulkActionsBar } from '@/components/BulkActionsBar'
import { supabase } from '../lib/supabase'

export function Tasks() {
  const { data: tasks = [], isLoading } = useTasks()
  const { isTaskModalOpen, setTaskModalOpen } = useUIStore()
  const { contexts } = useContextStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [contextFilter, setContextFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [dueDateFilter, setDueDateFilter] = useState('all')
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  // Fetch tags and campaigns for filters
  const [tags, setTags] = useState([])
  const [campaigns, setCampaigns] = useState([])

  useEffect(() => {
    loadFilterOptions()
  }, [])

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
    return tasks.filter((task) => {
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
        matchesCampaign && matchesType && matchesTag && matchesDueDate
    })
  }, [tasks, searchQuery, statusFilter, priorityFilter, contextFilter, campaignFilter, typeFilter, tagFilter, dueDateFilter])

  // Count active filters
  const activeFilterCount = [
    statusFilter !== 'all',
    priorityFilter !== 'all',
    contextFilter !== 'all',
    campaignFilter !== 'all',
    typeFilter !== 'all',
    tagFilter !== 'all',
    dueDateFilter !== 'all',
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
    <div className="container-tight py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks and projects</p>
        </div>
        <Button onClick={() => {
          setSelectedTask(null)
          setTaskModalOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Search + Filter Toggle */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
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

            {/* Type */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="task">✅ Tasks</SelectItem>
                <SelectItem value="meeting">📅 Meetings</SelectItem>
              </SelectContent>
            </Select>

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
          </div>
        )}
      </Card>

      {/* Tasks Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <Checkbox
                    checked={isAllSelected}
                    ref={el => el && (el.indeterminate = isSomeSelected)}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Due Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Priority</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>Loading tasks...</p>
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    {tasks.length === 0
                      ? 'No tasks yet. Create one to get started!'
                      : 'No tasks match your filters.'}
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
                      onSelect={(e) => {
                        e?.stopPropagation()
                        toggleSelect(task.id)
                      }}
                      onClick={() => {
                        setSelectedTask(task)
                        setTaskModalOpen(true)
                      }}
                      isOverdue={isOverdue}
                      statusColors={statusColors}
                      priorityColors={priorityColors}
                    />
                  )
                    < div className = "flex items-center gap-2" >
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${priorityColors[task.priority || 1]}`}
                              style={{ width: `${((task.priority || 1) / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{task.priority || 1}</span>
                        </div>
          </td>
        </tr>
        )
                })
              )}
      </tbody>
    </table>
        </div >
      </Card >

    {/* Results count */ }
  {
    filteredTasks.length > 0 && (
      <p className="text-sm text-muted-foreground text-center">
        Showing {filteredTasks.length} of {tasks.length} tasks
      </p>
    )
  }

  {/* Bulk Actions Bar */ }
  {
    selectedIds.length > 0 && (
      <BulkActionsBar
        selectedIds={selectedIds}
        onClear={clearSelection}
        onSuccess={clearSelection}
      />
    )
  }

  {/* Task Modal */ }
  <TaskModal
    open={isTaskModalOpen}
    onOpenChange={setTaskModalOpen}
    task={selectedTask}
  />
    </div >
  )
}

// Task Row Component with polish
function TaskRow({ task, isSelected, onSelect, onClick, isOverdue, statusColors, priorityColors }) {
  const [completeAnim, setCompleteAnim] = useState(false)

  const handleCheck = () => {
    if (task.status !== 'done') {
      setCompleteAnim(true)
      setTimeout(() => {
        onSelect() // Actually this logic should move status to done, but for now we just toggle selection or status
      }, 300)
    }
    onSelect()
  }

  return (
    <tr
      className={`border-b transition-all duration-200 cursor-pointer group
        ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'}
        ${completeAnim ? 'opacity-50 scale-[0.98]' : ''}
      `}
      onClick={onClick}
    >
      <td className="px-4 py-4 w-[50px]">
        <div className="relative flex items-center justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheck}
            onClick={(e) => e.stopPropagation()}
            className={completeAnim ? 'animate-check' : ''}
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
      <td className="px-6 py-4">
        <Badge className={`${statusColors[task.status]} transition-transform group-hover:scale-105`}>
          {task.status?.replace('_', ' ')}
        </Badge>
      </td>
      <td className={`px-6 py-4 text-sm transition-colors ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
        {task.due_date ? (
          <span className="flex items-center gap-1">
            {isOverdue && '🔴'}
            {new Date(task.due_date).toLocaleDateString()}
          </span>
        ) : '-'}
      </td>
      <td className="px-6 py-4">
        <div className={`w-3 h-3 rounded-full ${priorityColors[task.priority] || 'bg-gray-300'} shadow-sm`} />
      </td>
    </tr>
  )
}
