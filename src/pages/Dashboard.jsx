import { useState, useEffect, useMemo, useCallback } from 'react'
import { CheckCircle2, Clock, AlertCircle, ListTodo, Pencil, Save, X, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { tasksService } from '../services/tasks.service'
import { settingsService } from '../services/settings.service'
import { campaignsService } from '../services/campaigns.service'
import { useUserStore } from '../stores/userStore'
import PrayerTimes from '../components/PrayerTimes'
import PrayerCountdown from '../components/PrayerCountdown'
import DailyInspiration from '../components/DailyInspiration'
import Pomodoro from '../components/Pomodoro'
import TaskTimer from '../components/TaskTimer'

import { ScratchpadWidget } from '../components/ScratchpadWidget'
import { WorldClockWidget } from '../components/WorldClockWidget'
import { TaskModal } from '../components/TaskModal'
import { useUIStore } from '../stores/uiStore'
import { CampaignProgressBar } from '../components/CampaignProgressBar'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { Skeleton } from '../components/ui/skeleton'
import { EisenhowerWidget } from '../components/EisenhowerWidget'

// DnD Kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { SortableWidget } from '../components/SortableWidget';
import { toast } from 'react-hot-toast'

export function Dashboard() {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: () => tasksService.getAll({ workspaceId: 'all' }),
  })
  const { user, preferences, setPreferences } = useUserStore()
  const [prayerSchedule, setPrayerSchedule] = useState([])
  const [userPreferences, setUserPreferences] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const { isTaskModalOpen, setTaskModalOpen } = useUIStore()
  const [activeCampaigns, setActiveCampaigns] = useState([])

  // Layout State
  const [isEditing, setIsEditing] = useState(false)
  const [layout, setLayout] = useState({
    topRow: ['stat-total', 'stat-inprogress', 'stat-overdue', 'stat-completed'],
    mainGrid: ['prayer-times', 'inspiration', 'focus-tools', 'upcoming-tasks', 'eisenhower', 'world-clock', 'scratchpad', 'active-campaigns']
  })
  const [activeDragId, setActiveDragId] = useState(null)

  // Sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Sync layout from preferences on mount/change
  useEffect(() => {
    if (preferences?.dashboardLayout) {
      setLayout(preferences.dashboardLayout)
    } else if (userPreferences?.dashboard_layout) {
      setLayout(userPreferences.dashboard_layout)
    }
  }, [preferences?.dashboardLayout, userPreferences])


  // Load data ...
  useEffect(() => {
    if (!user) return

    const loadPrayers = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const record = await settingsService.getPrayerTimes(today)
        setPrayerSchedule(record ? [record] : [])
      } catch (e) {
        console.error("Error loading prayer times", e)
      }
    }
    loadPrayers()

    const loadPrefs = async () => {
      try {
        const record = await settingsService.getPreferences()
        setUserPreferences(record)
        // Sync layout from DB immediately if available
        if (record?.dashboard_layout) {
          // Migration: Ensure active-campaigns is in mainGrid if not present
          const layout = { ...record.dashboard_layout }
          if (layout.mainGrid && !layout.mainGrid.includes('active-campaigns')) {
            layout.mainGrid = [...layout.mainGrid, 'active-campaigns']
          }
          setLayout(layout)
          // Update store to match
          setPreferences({ dashboardLayout: layout })
        }
      } catch (e) {
        console.error('Error loading preferences:', e)
      }
    }
    loadPrefs()
  }, [user, setPreferences])

  // Load active campaigns (depends on tasks for stats calculation)
  useEffect(() => {
    if (!user) return

    const loadCampaigns = async () => {
      try {
        const records = await campaignsService.getAll()
        const active = records.filter(c => c.status === 'active').slice(0, 3)

        const campaignData = active.map(c => {
          const campaignTasks = tasks.filter(t => t.campaign_id === c.id || (t.campaign && t.campaign.id === c.id))
          return {
            ...c,
            totalItems: campaignTasks.length,
            completedItems: campaignTasks.filter(t => t.status === 'done').length,
            context: c.expand?.context_id
          }
        })
        setActiveCampaigns(campaignData)
      } catch (e) {
        console.error("Error loading campaigns", e)
      }
    }
    loadCampaigns()
  }, [user, tasks])

  // Computed Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return {
      'stat-total': { label: 'Total Tasks', value: tasks.length.toString(), icon: ListTodo, color: 'text-blue-500' },
      'stat-inprogress': { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length.toString(), icon: Clock, color: 'text-orange-500' },
      'stat-overdue': { label: 'Overdue', value: tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < today).length.toString(), icon: AlertCircle, color: 'text-red-500' },
      'stat-completed': { label: 'Completed', value: tasks.filter(t => t.status === 'done').length.toString(), icon: CheckCircle2, color: 'text-green-500' },
    }
  }, [tasks])

  // Computed Upcoming Tasks
  const upcomingTasksData = useMemo(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const todayStr = today.toISOString().split('T')[0]
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    return tasks
      .filter(t => {
        const taskDate = t.due_date?.substring(0, 10)
        return t.status !== 'done' && t.status !== 'cancelled' && taskDate && (taskDate === todayStr || taskDate === tomorrowStr)
      })
      .sort((a, b) => {
        if (a.due_date === b.due_date) return (b.priority || 0) - (a.priority || 0)
        return a.due_date.localeCompare(b.due_date)
      })
      .slice(0, 5)
      .map(t => ({ ...t, dueDate: t.due_date?.substring(0, 10) === todayStr ? 'Today' : 'Tomorrow' }))
  }, [tasks])

  const todayPrayerTimes = prayerSchedule.find(p => p.date === new Date().toISOString().split('T')[0])

  // ----------- DnD Handlers -----------
  const handleDragStart = (event) => {
    setActiveDragId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setLayout((prev) => {
        const newLayout = { ...prev };

        // Check which container the item belongs to
        if (prev.topRow.includes(active.id)) {
          // Top Row Reorder
          if (prev.topRow.includes(over.id)) {
            const oldIndex = prev.topRow.indexOf(active.id);
            const newIndex = prev.topRow.indexOf(over.id);
            newLayout.topRow = arrayMove(prev.topRow, oldIndex, newIndex);
          }
        } else if (prev.mainGrid.includes(active.id)) {
          // Main Grid Reorder
          if (prev.mainGrid.includes(over.id)) {
            const oldIndex = prev.mainGrid.indexOf(active.id);
            const newIndex = prev.mainGrid.indexOf(over.id);
            newLayout.mainGrid = arrayMove(prev.mainGrid, oldIndex, newIndex);
          }
        }

        return newLayout;
      });
    }
    setActiveDragId(null);
  }

  const saveLayout = async () => {
    try {
      await settingsService.updatePreferences({ dashboard_layout: layout })
      setPreferences({ dashboardLayout: layout })
      setIsEditing(false)
      toast.success('Dashboard layout saved')
    } catch (e) {
      console.error('Failed to save layout', e)
      toast.error('Failed to save layout')
    }
  }

  const resetLayout = () => {
    const defaultLayout = {
      topRow: ['stat-total', 'stat-inprogress', 'stat-overdue', 'stat-completed'],
      mainGrid: ['prayer-times', 'inspiration', 'focus-tools', 'upcoming-tasks', 'eisenhower', 'world-clock', 'scratchpad', 'active-campaigns']
    }
    setLayout(defaultLayout)
  }

  // ----------- Widget Renderers -----------
  const renderStatWidget = (id) => {
    const stat = stats[id]
    if (!stat) return null
    const Icon = stat.icon
    const isUrgent = stat.label === 'Overdue' && parseInt(stat.value) > 0
    const isTotal = stat.label === 'Total Tasks'

    return (
      <Card className="glass-card card-hover group cursor-default border-border/40 relative overflow-hidden h-full">
        <div className={`absolute top-0 right-0 p-3 opacity-5 group-hover:scale-125 transition-transform duration-500`}>
          <Icon className="w-12 h-12" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
            {stat.label}
          </CardTitle>
          <div className="relative">
            {(isUrgent || isTotal) && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isUrgent ? 'bg-red-400' : 'bg-blue-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isUrgent ? 'bg-red-500' : 'bg-blue-500'}`}></span>
              </span>
            )}
            <Icon className={`w-4 h-4 ${stat.color} transition-transform group-hover:scale-110`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
        </CardContent>
      </Card>
    )
  }

  const renderWidget = (id) => {
    switch (id) {
      case 'prayer-times':
        return (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Prayer Times</CardTitle>
              <CardDescription>Today's prayer schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="[&>div]:!shadow-none [&>div]:!border-0 [&>div]:!p-0">
                <PrayerTimes />
              </div>
              {todayPrayerTimes && (
                <div className="[&>div]:!shadow-none [&>div]:!border-0 [&>div]:!p-0">
                  <PrayerCountdown prayerTimes={todayPrayerTimes} />
                </div>
              )}
            </CardContent>
          </Card>
        )
      case 'inspiration':
        return (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Make your day greater</CardTitle>
              <CardDescription>Daily inspiration & fun</CardDescription>
            </CardHeader>
            <CardContent>
              <DailyInspiration />
            </CardContent>
          </Card>
        )
      case 'focus-tools':
        return (
          <Card className="glass-panel border-border/40 shadow-sm h-full">
            <CardHeader className="pb-3 border-b border-border/10 mb-4">
              <CardTitle className="text-lg font-display">Focus Tools</CardTitle>
              <CardDescription>Pomodoro & time tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="[&>div]:!shadow-none [&>div]:!border-0 [&>div]:!p-0">
                <Pomodoro preferences={userPreferences} />
              </div>
              <div className="[&>div]:!shadow-none [&>div]:!border-0 [&>div]:!p-0">
                <TaskTimer tasks={tasks} />
              </div>
            </CardContent>
          </Card>
        )
      case 'upcoming-tasks':
        return (
          <Card className="h-full overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Upcoming Tasks</CardTitle>
              <CardDescription className="text-xs">Today & tomorrow</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2 overflow-y-auto max-h-[170px]">
              {upcomingTasksData.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No upcoming tasks</p>
                </div>
              ) : (
                upcomingTasksData.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50 hover:bg-muted/50 transition-all cursor-pointer" onClick={() => window.location.href = '/tasks'}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-1 h-8 rounded-full shrink-0 ${task.status === 'in_progress' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.dueDate}</p>
                      </div>
                    </div>
                    <Badge variant={task.priority >= 4 ? 'destructive' : 'secondary'} className="text-[10px] shrink-0 ml-2">P{task.priority}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )
      case 'eisenhower':
        return <div className="h-full min-h-[250px]"><EisenhowerWidget tasks={tasks} /></div>;
      case 'world-clock':
        return <div className="h-full min-h-[250px]"><WorldClockWidget /></div>;
      case 'scratchpad':
        return <div className="h-full min-h-[250px]"><ScratchpadWidget /></div>;
      case 'active-campaigns':
        return (
          <Card className="glass-panel border-border/40 shadow-sm overflow-hidden h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your Campaigns</CardTitle>
                <Badge variant="secondary" className="bg-primary/5 text-primary">Live</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {activeCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No active campaigns</p>
              ) : (
                activeCampaigns.map(campaign => (
                  <CampaignProgressBar
                    key={campaign.id}
                    label={campaign.name}
                    total={campaign.totalItems}
                    completed={campaign.completedItems}
                    color={campaign.context?.color}
                  />
                ))
              )}
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  }

  if (isLoading) {
    return (
      <div className="container-tight py-8 section-gap">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="container-tight py-8 section-gap animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight font-display">Dashboard</h1>
            <p className="text-muted-foreground font-medium">Welcome back! Here's your overview.</p>
          </div>
          <div className="flex gap-2 items-center">
            {isEditing ? (
              <>
                <Button size="sm" variant="ghost" onClick={resetLayout} title="Reset Default Layout">
                  <RotateCcw className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button size="sm" onClick={saveLayout}>
                  <Save className="w-4 h-4 mr-2" /> Save Layout
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Layout
              </Button>
            )}
          </div>
        </div>

        <TaskModal
          open={isTaskModalOpen}
          onOpenChange={setTaskModalOpen}
          task={selectedTask}
        />

        {/* Top Row: 4 Columns Stats */}
        {preferences?.dashboardWidgets?.stats !== false && (
          <SortableContext items={layout.topRow} strategy={rectSortingStrategy}>
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 p-2 rounded-xl border border-dashed transition-colors ${isEditing ? 'border-primary/20 bg-accent/5' : 'border-transparent'}`}>
              {layout.topRow.map((id) => (
                <SortableWidget key={id} id={id} isEditing={isEditing}>
                  {renderStatWidget(id)}
                </SortableWidget>
              ))}
            </div>
          </SortableContext>
        )}

        {/* Main Grid: 3 Columns */}
        <SortableContext items={layout.mainGrid} strategy={rectSortingStrategy}>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2 rounded-xl border border-dashed transition-colors ${isEditing ? 'border-primary/20 bg-accent/5' : 'border-transparent'}`}>
            {layout.mainGrid.map((id) => (
              <div key={id} className="h-full">
                <SortableWidget id={id} isEditing={isEditing}>
                  {renderWidget(id)}
                </SortableWidget>
              </div>
            ))}
          </div>
        </SortableContext>



      </div>

      {/* Drag Overlay for smooth visuals */}
      <DragOverlay>
        {activeDragId ? (
          <div className="opacity-80 scale-105 cursor-grabbing">
            {/* We render purely visual clone using the renderer. Stat or Widget? */}
            {layout.topRow.includes(activeDragId) ? renderStatWidget(activeDragId) : renderWidget(activeDragId)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

