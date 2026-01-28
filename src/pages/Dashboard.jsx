import { useState, useEffect, useMemo } from 'react'
import { Plus, CheckCircle2, Clock, AlertCircle, ListTodo, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTasks } from '../hooks/useTasks'
import { supabase } from '../lib/supabase'
import { useUserStore } from '../stores/userStore'
import PrayerTimes from '../components/PrayerTimes'
import PrayerCountdown from '../components/PrayerCountdown'
import QuranVerse from '../components/QuranVerse'
import Pomodoro from '../components/Pomodoro'
import TaskTimer from '../components/TaskTimer'
import { TaskModal } from '../components/TaskModal'
import { useUIStore } from '../stores/uiStore'
import { CampaignProgressBar } from '../components/CampaignProgressBar'
import { useContextStore } from '../stores/contextStore'
import { Skeleton } from '../components/ui/skeleton'


export function Dashboard() {
  const { data: tasks = [], isLoading } = useTasks()
  const { user, preferences } = useUserStore()
  const [prayerSchedule, setPrayerSchedule] = useState([])
  const [userPreferences, setUserPreferences] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const { isTaskModalOpen, setTaskModalOpen } = useUIStore()
  const { contexts, activeContextId } = useContextStore()
  const [activeCampaigns, setActiveCampaigns] = useState([])

  // Load prayer schedule and preferences
  useEffect(() => {
    if (!user) return

    // Load prayer schedule
    supabase
      .from('prayer_schedule')
      .select('*')
      .order('date', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Error loading prayer times:', error)
        else setPrayerSchedule(data || [])
      })

    // Load user preferences
    supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') console.error('Error loading preferences:', error)
        else setUserPreferences(data)
      })

    // Load active campaigns for progress tracking
    supabase
      .from('campaigns')
      .select(`
        *,
        context:contexts(name, color),
        tasks(id, status)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(3)
      .then(({ data, error }) => {
        if (!error && data) {
          const processed = data.map(c => ({
            ...c,
            totalItems: c.tasks?.length || 0,
            completedItems: c.tasks?.filter(t => t.status === 'done').length || 0
          }))
          setActiveCampaigns(processed)
        }
      })
  }, [user])

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]

    return [
      {
        label: 'Total Tasks',
        value: tasks.length.toString(),
        icon: ListTodo,
        color: 'text-blue-500'
      },
      {
        label: 'In Progress',
        value: tasks.filter(t => t.status === 'in_progress').length.toString(),
        icon: Clock,
        color: 'text-orange-500'
      },
      {
        label: 'Overdue',
        value: tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < today).length.toString(),
        icon: AlertCircle,
        color: 'text-red-500'
      },
      {
        label: 'Completed',
        value: tasks.filter(t => t.status === 'done').length.toString(),
        icon: CheckCircle2,
        color: 'text-green-500'
      },
    ]
  }, [tasks])

  const upcomingTasks = useMemo(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayStr = today.toISOString().split('T')[0]
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    return tasks
      .filter(t =>
        t.status !== 'done' &&
        t.status !== 'cancelled' &&
        (t.due_date === todayStr || t.due_date === tomorrowStr)
      )
      .sort((a, b) => {
        if (a.due_date === b.due_date) {
          return (b.priority || 0) - (a.priority || 0)
        }
        return a.due_date.localeCompare(b.due_date)
      })
      .slice(0, 5)
      .map(t => ({
        ...t,
        dueDate: t.due_date === todayStr ? 'Today' : 'Tomorrow'
      }))
  }, [tasks])

  const todayPrayerTimes = prayerSchedule.find(
    p => p.date === new Date().toISOString().split('T')[0]
  )

  if (isLoading) {
    return (
      <div className="container-tight py-8 section-gap">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[300px] lg:col-span-1" />
          <Skeleton className="h-[300px] lg:col-span-1" />
          <Skeleton className="h-[300px] lg:col-span-1" />
        </div>
      </div>
    )
  }

  return (
    <div className="container-tight py-8 section-gap animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-display">Dashboard</h1>
          <p className="text-muted-foreground font-medium">Welcome back! Here's your overview.</p>
        </div>
        <div className="flex gap-2">
          {/* Centralized creation handled by Navbar */}
        </div>
      </div>

      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={setTaskModalOpen}
        task={selectedTask}
      />

      {/* Stats Grid */}
      {preferences?.dashboardWidgets?.stats !== false && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            const isUrgent = stat.label === 'Overdue' && stat.value > 0
            const isTotal = stat.label === 'Total Tasks'

            return (
              <Card key={stat.label} className="glass-card card-hover group cursor-default border-border/40 relative overflow-hidden">
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
          })}
        </div>
      )}

      {/* Productivity & Spiritual Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Prayer Times */}
        {preferences?.dashboardWidgets?.prayerTimes !== false && (
          <Card className="lg:col-span-1">
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
        )}

        {/* Column 2: Quran Verse */}
        {preferences?.dashboardWidgets?.quranVerse !== false && (
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quran Verse</CardTitle>
              <CardDescription>Daily inspiration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="[&>div]:!shadow-none [&>div]:!border-0 [&>div]:!p-0">
                <QuranVerse />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Column 3: Productivity Tools & Campaign Progress */}
        <div className="lg:col-span-1 section-gap">
          {preferences?.dashboardWidgets?.focusTools !== false && (
            <Card className="glass-panel border-border/40 shadow-sm">
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
          )}

          {activeCampaigns.length > 0 && (
            <Card className="glass-panel border-border/40 shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Active Projects</CardTitle>
                  <Badge variant="secondary" className="bg-primary/5 text-primary">Live</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {activeCampaigns.map(campaign => (
                  <CampaignProgressBar
                    key={campaign.id}
                    label={campaign.name}
                    total={campaign.totalItems}
                    completed={campaign.completedItems}
                    color={campaign.context?.color}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Upcoming Tasks */}
      {preferences?.dashboardWidgets?.upcomingTasks !== false && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Your tasks for today and tomorrow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No upcoming tasks</p>
                <Button onClick={() => window.location.href = '/tasks'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first task
                </Button>
              </div>
            ) : (
              <>
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-all duration-200 cursor-pointer hover:translate-x-1"
                    onClick={() => window.location.href = '/tasks'}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-1 h-12 rounded-full ${task.status === 'in_progress' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                        }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                      </div>
                    </div>
                    <Badge variant={task.priority >= 4 ? 'destructive' : 'secondary'} className="shadow-sm">
                      P{task.priority}
                    </Badge>
                  </div>
                ))}
                <div className="pt-2 text-center">
                  <Button variant="outline" onClick={() => window.location.href = '/tasks'} className="w-full sm:w-auto">
                    View all tasks
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
