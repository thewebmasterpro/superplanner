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
import SpotifyPlayer from '../components/SpotifyPlayer'

export function Dashboard() {
  const { data: tasks = [], isLoading } = useTasks()
  const { user, preferences } = useUserStore()
  const [prayerSchedule, setPrayerSchedule] = useState([])
  const [userPreferences, setUserPreferences] = useState(null)

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
      <div className="container-tight py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container-tight py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.location.href = '/tasks'}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {preferences?.dashboardWidgets?.stats !== false && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.label}
                  </CardTitle>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Productivity & Spiritual Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

        {/* Column 3: Productivity Tools */}
        {preferences?.dashboardWidgets?.focusTools !== false && (
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Focus Tools</CardTitle>
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
      </div>

      {/* Spotify Player - Full width */}
      {preferences?.dashboardWidgets?.spotify !== false && userPreferences?.spotify_playlist_url && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Music</CardTitle>
            <CardDescription>Focus with your playlist</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="[&>div]:!shadow-none [&>div]:!border-0 [&>div]:!p-0">
              <SpotifyPlayer playlistUrl={userPreferences.spotify_playlist_url} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Tasks */}
      {preferences?.dashboardWidgets?.upcomingTasks !== false && (
        <Card>
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
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = '/tasks'}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-1 h-12 rounded-full ${task.status === 'in_progress' ? 'bg-orange-500' : 'bg-blue-500'
                        }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                      </div>
                    </div>
                    <Badge variant={task.priority >= 4 ? 'destructive' : 'secondary'}>
                      P{task.priority}
                    </Badge>
                  </div>
                ))}
                <div className="pt-2 text-center">
                  <Button variant="outline" onClick={() => window.location.href = '/tasks'}>
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
