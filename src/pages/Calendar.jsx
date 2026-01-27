import { useState, useMemo, useCallback } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useTasks, useUpdateTask } from '../hooks/useTasks'
import { usePrayerTimes, getPrayerEvents } from '../hooks/usePrayerTimes'
import { TaskModal } from '@/components/TaskModal'
import { useUIStore } from '../stores/uiStore'
import { useUserStore } from '../stores/userStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar as CalendarIcon } from 'lucide-react'
import { expandTasksWithVirtualOccurrences } from '../utils/recurrence'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export function Calendar() {
  const { data: tasks = [] } = useTasks()
  const updateTask = useUpdateTask()
  const { isTaskModalOpen, setTaskModalOpen } = useUIStore()
  const { preferences } = useUserStore()
  const [selectedTask, setSelectedTask] = useState(null)
  const [view, setView] = useState('week')

  // Fetch prayer times if location is configured
  const { data: prayerData } = usePrayerTimes(
    preferences?.prayerLocation?.city,
    preferences?.prayerLocation?.country
  )

  // Convert tasks to calendar events (including virtual occurrences and prayer times)
  const events = useMemo(() => {
    const expandedTasks = expandTasksWithVirtualOccurrences(tasks)

    const taskEvents = expandedTasks
      .filter(task => task.scheduled_time)
      .map(task => {
        // Strip timezone to avoid day shifts (parse as local time)
        const timeStr = task.scheduled_time.replace(/\+00:00$/, '').replace('Z', '')
        const start = new Date(timeStr)
        const end = new Date(start.getTime() + (task.duration || 60) * 60000) // duration in minutes

        return {
          id: task.id,
          title: task.title,
          start,
          end,
          resource: task,
        }
      })

    // Add prayer times as events
    const prayerEvents = prayerData ? getPrayerEvents(prayerData) : []

    return [...taskEvents, ...prayerEvents]
  }, [tasks, prayerData])

  // Handle event selection
  const handleSelectEvent = useCallback((event) => {
    // Don't open modal for prayer times
    if (event.isPrayer) return

    setSelectedTask(event.resource)
    setTaskModalOpen(true)
  }, [setTaskModalOpen])

  // Handle event drop (drag and drop)
  const handleEventDrop = useCallback(async ({ event, start, end }) => {
    try {
      await updateTask.mutateAsync({
        id: event.id,
        updates: {
          scheduled_time: start.toISOString(),
          duration: Math.round((end - start) / 60000), // convert ms to minutes
        },
      })
    } catch (error) {
      console.error('Error updating task schedule:', error)
    }
  }, [updateTask])

  // Handle slot selection (create new task)
  const handleSelectSlot = useCallback(({ start }) => {
    setSelectedTask({
      scheduled_time: start.toISOString().slice(0, 16), // format for datetime-local input
      duration: 60,
    })
    setTaskModalOpen(true)
  }, [setTaskModalOpen])

  // Event style getter
  const eventStyleGetter = (event) => {
    // Style for prayer times
    if (event.isPrayer) {
      return {
        style: {
          backgroundColor: '#10b981', // Green color
          borderRadius: '5px',
          opacity: 0.9,
          color: 'white',
          border: '2px solid #059669',
          display: 'block',
          fontWeight: '600',
        },
      }
    }

    const task = event.resource
    const statusColors = {
      todo: '#3b82f6',
      in_progress: '#f59e0b',
      blocked: '#ef4444',
      done: '#10b981',
      cancelled: '#6b7280',
    }

    const baseStyle = {
      backgroundColor: statusColors[task.status] || '#3b82f6',
      borderRadius: '5px',
      color: 'white',
      border: '0px',
      display: 'block',
    }

    // Style virtual occurrences differently
    if (task.isVirtual) {
      return {
        style: {
          ...baseStyle,
          opacity: 0.5,
          border: '2px dashed rgba(255, 255, 255, 0.7)',
        },
      }
    }

    return {
      style: {
        ...baseStyle,
        opacity: 0.8,
      },
    }
  }

  return (
    <div className="container-tight py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-8 h-8" />
            Calendar
          </h1>
          <p className="text-muted-foreground">Schedule and manage your tasks</p>
        </div>
        <Button
          onClick={() => {
            setSelectedTask(null)
            setTaskModalOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Scheduled Tasks</p>
          <p className="text-2xl font-bold">{events.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">This Week</p>
          <p className="text-2xl font-bold">
            {events.filter(e => {
              const now = new Date()
              const weekStart = startOfWeek(now)
              const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
              return e.start >= weekStart && e.start <= weekEnd
            }).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {events.filter(e => e.resource?.status === 'done').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold text-orange-600">
            {events.filter(e => e.resource?.status === 'in_progress').length}
          </p>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="p-4">
        <div style={{ height: '600px' }}>
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            onEventDrop={handleEventDrop}
            eventPropGetter={eventStyleGetter}
            view={view}
            onView={setView}
            selectable
            resizable
            draggableAccessor={(event) => !event.resource?.isVirtual && !event.isPrayer} // Only real events can be dragged, not virtual or prayers
            popup
            views={['month', 'week', 'day', 'agenda']}
          />
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Status Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }} />
            <span className="text-sm">To Do</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
            <span className="text-sm">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-sm">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
            <span className="text-sm">Done</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6b7280' }} />
            <span className="text-sm">Cancelled</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Click on a time slot to create a new task. Click on an event to edit it. Drag and drop events to reschedule.
          <br />
          <strong>Future Recurrences:</strong> Events with dashed borders are virtual future occurrences of recurring tasks. They cannot be edited individually until they become the active occurrence.
        </p>
      </Card>

      {/* Task Modal */}
      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={setTaskModalOpen}
        task={selectedTask}
      />
    </div>
  )
}
