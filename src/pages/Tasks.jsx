import { useState } from 'react'
import { Plus, Search, SlidersHorizontal, Loader2 } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useUIStore } from '../stores/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { TaskModal } from '@/components/TaskModal'

export function Tasks() {
  const { data: tasks = [], isLoading } = useTasks()
  const { isTaskModalOpen, setTaskModalOpen } = useUIStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedTask, setSelectedTask] = useState(null)

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

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === parseInt(priorityFilter)
    return matchesSearch && matchesStatus && matchesPriority
  })

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

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
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

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="5">Priority 5 (High)</SelectItem>
              <SelectItem value="4">Priority 4</SelectItem>
              <SelectItem value="3">Priority 3</SelectItem>
              <SelectItem value="2">Priority 2</SelectItem>
              <SelectItem value="1">Priority 1 (Low)</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all') && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setPriorityFilter('all')
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Tasks Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Due Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Priority</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>Loading tasks...</p>
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                    {tasks.length === 0
                      ? 'No tasks yet. Create one to get started!'
                      : 'No tasks match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedTask(task)
                      setTaskModalOpen(true)
                    }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{task.title}</p>
                          {task.parent_meeting && (
                            <Badge
                              variant="secondary"
                              className="text-xs cursor-pointer hover:bg-secondary/80"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTask({ id: task.parent_meeting_id })
                                setTaskModalOpen(true)
                              }}
                            >
                              📅 {task.parent_meeting.title}
                            </Badge>
                          )}
                        </div>
                        {task.task_tags && task.task_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {task.task_tags.map(({ tag }) => (
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
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[task.status]}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Results count */}
      {filteredTasks.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </p>
      )}

      {/* Task Modal */}
      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={setTaskModalOpen}
        task={selectedTask}
      />
    </div>
  )
}
