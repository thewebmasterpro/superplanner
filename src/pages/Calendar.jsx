import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useTasks, useUpdateTask } from '../hooks/useTasks'
import { usePrayerTimes, getPrayerEvents } from '../hooks/usePrayerTimes'
import { TaskModal } from '@/components/TaskModal'
import { useUIStore } from '../stores/uiStore'
import { useUserStore } from '../stores/userStore'
import { Plus, Calendar as CalendarIcon, Info, CheckSquare, Video } from 'lucide-react'
import { expandTasksWithVirtualOccurrences } from '../utils/recurrence'

const locales = {
  'fr': fr,
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
  const [slotPopup, setSlotPopup] = useState(null) // { x, y, start }
  const popupRef = useRef(null)

  // Fetch prayer times if location is configured
  const { data: prayerData } = usePrayerTimes(
    preferences?.prayerLocation?.city || null,
    preferences?.prayerLocation?.country || null
  )

  // Convert tasks to calendar events (including virtual occurrences and prayer times)
  const events = useMemo(() => {
    const expandedTasks = expandTasksWithVirtualOccurrences(tasks)

    const taskEvents = expandedTasks
      .filter(task => {
        // Accept if it has EITHER scheduled_time OR due_date
        return task.scheduled_time || task.due_date;
      })
      .map(task => {
        let start, end, isAllDay = false;

        if (task.scheduled_time) {
          // Strip timezone to avoid day shifts (parse as local time)
          const timeStr = task.scheduled_time.replace(/\+00:00$/, '').replace('Z', '')
          start = new Date(timeStr)
          end = new Date(start.getTime() + (task.duration || 60) * 60000) // duration in minutes
        } else if (task.due_date) {
          // Fallback to due_date as All Day event
          const dateOnly = task.due_date.substring(0, 10);
          const [year, month, day] = dateOnly.split('-').map(Number);

          // Month is 0-indexed in JS Date
          start = new Date(year, month - 1, day);
          end = new Date(year, month - 1, day, 23, 59, 59);
          isAllDay = true;
        }

        return {
          id: task.id,
          title: task.title,
          start,
          end,
          resource: task,
          allDay: isAllDay
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

  // Handle slot selection - show type picker
  const handleSelectSlot = useCallback(({ start, box, bounds }) => {
    const pos = box || bounds
    if (!pos) return
    setSlotPopup({
      x: pos.clientX ?? pos.x,
      y: pos.clientY ?? pos.y,
      start,
    })
  }, [])

  // Pick task or meeting from slot popup
  const handleSlotTypePick = useCallback((type) => {
    if (!slotPopup) return
    setSelectedTask({
      type,
      scheduled_time: slotPopup.start.toISOString().slice(0, 16),
      duration: type === 'meeting' ? 30 : 60,
    })
    setSlotPopup(null)
    setTaskModalOpen(true)
  }, [slotPopup, setTaskModalOpen])

  // Close popup on outside click
  useEffect(() => {
    if (!slotPopup) return
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setSlotPopup(null)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [slotPopup])

  // Event style getter
  const eventStyleGetter = (event) => {
    // Style for prayer times
    if (event.isPrayer) {
      return {
        style: {
          backgroundColor: '#10b981', // Green color
          borderRadius: '8px',
          opacity: 0.9,
          color: 'white',
          border: '2px solid #059669',
          display: 'block',
          fontWeight: '700',
          fontSize: '11px',
          padding: '2px 4px'
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
      borderRadius: '8px',
      color: 'white',
      border: '0px',
      display: 'block',
      fontSize: '11px',
      fontWeight: '600',
      padding: '2px 4px'
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

    // Style meetings differently
    if (task.type === 'meeting') {
      return {
        style: {
          backgroundColor: '#8b5cf6', // Violet
          borderRadius: '8px',
          color: 'white',
          border: '2px solid #7c3aed',
          display: 'block',
          opacity: 0.9,
          fontSize: '11px',
          fontWeight: '700',
          padding: '2px 4px'
        },
      }
    }

    return {
      style: {
        ...baseStyle,
        opacity: 0.9,
      },
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-2 text-primary">
            <CalendarIcon className="w-8 h-8" />
            Calendrier
          </h1>
          <p className="text-muted-foreground">Planifiez et gérez vos tâches visuellement.</p>
        </div>
        <button
          data-tour="calendar-create"
          onClick={() => {
            setSelectedTask(null)
            setTaskModalOpen(true)
          }}
          className="btn gap-2 shadow-none transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Tâche
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger-fast">
        <div className="stats shadow bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all">
          <div className="stat">
            <div className="stat-title text-[10px] uppercase font-bold opacity-50 tracking-widest">Événements</div>
            <div className="stat-value text-primary font-black">{events.length}</div>
          </div>
        </div>
        <div className="stats shadow bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all">
          <div className="stat">
            <div className="stat-title text-[10px] uppercase font-bold opacity-50 tracking-widest">Cette Semaine</div>
            <div className="stat-value text-secondary font-black">
              {events.filter(e => {
                const now = new Date()
                const weekStart = startOfWeek(now)
                const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
                return e.start >= weekStart && e.start <= weekEnd
              }).length}
            </div>
          </div>
        </div>
        <div className="stats shadow bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all">
          <div className="stat">
            <div className="stat-title text-[10px] uppercase font-bold opacity-50 tracking-widest">Terminés</div>
            <div className="stat-value text-success font-black">
              {events.filter(e => e.resource?.status === 'done').length}
            </div>
          </div>
        </div>
        <div className="stats shadow bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all">
          <div className="stat">
            <div className="stat-title text-[10px] uppercase font-bold opacity-50 tracking-widest">En cours</div>
            <div className="stat-value text-warning font-black">
              {events.filter(e => e.resource?.status === 'in_progress').length}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div data-tour="calendar-view" className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all rounded-2xl overflow-hidden">
        <div className="card-body p-0">
          <div style={{ height: '700px' }} className="p-4">
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
              draggableAccessor={(event) => !event.resource?.isVirtual && !event.isPrayer}
              popup
              views={['month', 'week', 'day', 'agenda']}
              culture="fr"
              messages={{
                next: "Suivant",
                previous: "Précédent",
                today: "Aujourd'hui",
                month: "Mois",
                week: "Semaine",
                day: "Jour",
                agenda: "Agenda",
                date: "Date",
                time: "Heure",
                event: "Événement",
                noEventsInRange: "Aucun événement dans cette plage",
                showMore: total => `+ ${total} de plus`
              }}
            />
          </div>
        </div>
      </div>

      {/* Legend & Help */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-sm border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all rounded-2xl">
          <div className="card-body p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest opacity-60">Légende des statuts</h3>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: '#3b82f6' }} />
                <span className="text-xs font-bold text-base-content/70">À faire</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: '#f59e0b' }} />
                <span className="text-xs font-bold text-base-content/70">En cours</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: '#ef4444' }} />
                <span className="text-xs font-bold text-base-content/70">Bloqué</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: '#10b981' }} />
                <span className="text-xs font-bold text-base-content/70">Terminé</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: '#6b7280' }} />
                <span className="text-xs font-bold text-base-content/70">Annulé</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: '#8b5cf6' }} />
                <span className="text-xs font-bold text-base-content/70">Réunion</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-primary text-primary-content shadow-lg rounded-2xl">
          <div className="card-body p-6 justify-center">
            <p className="text-xs font-bold leading-relaxed flex flex-col gap-2">
              <span className="uppercase tracking-widest opacity-80">Astuce Pro</span>
              <span>Cliquez sur un créneau vide pour créer une tâche. Glissez-déposez pour replanifier vos engagements.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Slot type picker popup */}
      {slotPopup && (
        <div
          ref={popupRef}
          className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
          style={{ top: slotPopup.y, left: slotPopup.x, transform: 'translate(-50%, -50%)' }}
        >
          <div className="flex flex-col gap-1 p-2 rounded-xl bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border border-base-300 dark:border-white/20 shadow-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-1">Ajouter</span>
            <div className="flex gap-1">
            <button
              onClick={() => handleSlotTypePick('task')}
              className="btn btn-sm gap-2 shadow-none transition-transform hover:scale-105 active:scale-95"
            >
              <CheckSquare className="w-4 h-4" />
              Tâche
            </button>
            <button
              onClick={() => handleSlotTypePick('meeting')}
              className="btn btn-sm gap-2 shadow-none transition-transform hover:scale-105 active:scale-95"
            >
              <Video className="w-4 h-4" />
              Réunion
            </button>
            </div>
          </div>
        </div>
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
