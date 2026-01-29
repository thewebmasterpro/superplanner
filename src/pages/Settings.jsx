import { useState, useEffect } from 'react'
import { useUserStore } from '../stores/userStore'
import pb from '../lib/pocketbase'
import { useTelegramNotifications } from '../hooks/useTelegramNotifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings as SettingsIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { DataBackupSettings } from '@/components/settings/DataBackupSettings'

export function Settings() {
  const { preferences, setPreferences } = useUserStore()
  const { sendTestNotification } = useTelegramNotifications()

  const handleTestTelegram = async () => {
    const result = await sendTestNotification()
    if (result.success) {
      toast.success('Test notification sent successfully! Check your Telegram.')
    } else {
      toast.error(`Failed to send notification: ${result.error}`)
    }
  }

  const savePreferences = async () => {
    try {
      const user = pb.authStore.model
      if (!user) return

      const safePayload = {
        user_id: user.id,
        telegram: preferences.telegram,
        dashboardWidgets: preferences.dashboardWidgets,
        prayerLocation: preferences.prayerLocation,
        spotify_playlist_url: preferences.spotify_playlist_url
      }

      // Check if exists
      try {
        const records = await pb.collection('user_preferences').getFullList({
          filter: `user_id = "${user.id}"`
        })

        if (records.length > 0) {
          await pb.collection('user_preferences').update(records[0].id, safePayload)
        } else {
          await pb.collection('user_preferences').create(safePayload)
        }
        toast.success('Preferences saved successfully!')
      } catch (e) {
        // If error in getFullList (e.g. 404 shouldn't happen for getFullList returns empty array)
        // But if it fails, try create? No, safer to log.
        // Actually getFullList returns empty array if none found.
        await pb.collection('user_preferences').create(safePayload)
        toast.success('Preferences saved successfully!')
      }

    } catch (e) {
      toast.error('Failed to save: ' + e.message)
    }
  }

  return (
    <div className="container-tight py-8 space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-primary/10 rounded-xl">
          <SettingsIcon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display">Settings</h1>
          <p className="text-muted-foreground font-medium">Manage your personal preferences and data</p>
        </div>
      </div>

      <Tabs defaultValue="preferences" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="data">💾 Data & Backup</TabsTrigger>
        </TabsList>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4 outline-none">
          <Card>
            <CardHeader>
              <CardTitle>🕌 Prayer Times Location</CardTitle>
              <CardDescription>Configure your location for accurate prayer times</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    type="text"
                    value={preferences?.prayerLocation?.city || ''}
                    onChange={(e) => setPreferences({
                      prayerLocation: {
                        ...(preferences?.prayerLocation || { country: '' }),
                        city: e.target.value
                      }
                    })}
                    placeholder="e.g., Paris, Casablanca"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    type="text"
                    value={preferences?.prayerLocation?.country || ''}
                    onChange={(e) => setPreferences({
                      prayerLocation: {
                        ...(preferences?.prayerLocation || { city: '' }),
                        country: e.target.value
                      }
                    })}
                    placeholder="e.g., France, Morocco"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Prayer times will be displayed in your calendar using Muslim World League calculation method.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📱 Telegram Notifications</CardTitle>
              <CardDescription>Configure reminders via telegram bot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Telegram Chat ID</Label>
                <Input
                  type="text"
                  value={preferences?.telegram?.chatId || ''}
                  onChange={(e) => setPreferences({
                    telegram: {
                      ...(preferences?.telegram || { enabled: false, advanceMinutes: 30 }),
                      chatId: e.target.value
                    }
                  })}
                  placeholder="123456789"
                />
                <p className="text-xs text-muted-foreground">
                  💡 To get your Chat ID: Send <code className="bg-muted px-1 py-0.5 rounded">/start</code> to your bot on Telegram
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableTelegram"
                  checked={preferences?.telegram?.enabled || false}
                  onChange={(e) => setPreferences({
                    telegram: {
                      ...(preferences?.telegram || { chatId: '', advanceMinutes: 30 }),
                      enabled: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="enableTelegram" className="font-normal">
                  Enable Telegram Notifications
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Reminder Time (minutes before)</Label>
                <Input
                  type="number"
                  value={preferences?.telegram?.advanceMinutes || 30}
                  onChange={(e) => setPreferences({
                    telegram: {
                      ...(preferences?.telegram || { chatId: '', enabled: false }),
                      advanceMinutes: parseInt(e.target.value)
                    }
                  })}
                  min="5"
                  max="1440"
                />
                <p className="text-xs text-muted-foreground">
                  Receive notifications X minutes before deadlines and meetings
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleTestTelegram}
                disabled={!preferences?.telegram?.chatId || !preferences?.telegram?.enabled}
              >
                🧪 Send Test Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <Card>
            <CardHeader>
              <CardTitle>📊 Dashboard Widgets</CardTitle>
              <CardDescription>Customize what appears on your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="prayerTimes" className="text-base">Prayer Times</Label>
                  <p className="text-xs text-muted-foreground">Show 5 daily prayers and countdown</p>
                </div>
                <input
                  type="checkbox"
                  id="prayerTimes"
                  checked={preferences?.dashboardWidgets?.prayerTimes ?? true}
                  onChange={(e) => setPreferences({
                    dashboardWidgets: {
                      ...(preferences?.dashboardWidgets || {}),
                      prayerTimes: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="quranVerse" className="text-base">Quran Verse</Label>
                  <p className="text-xs text-muted-foreground">Show daily inspirational verse</p>
                </div>
                <input
                  type="checkbox"
                  id="quranVerse"
                  checked={preferences?.dashboardWidgets?.quranVerse ?? true}
                  onChange={(e) => setPreferences({
                    dashboardWidgets: {
                      ...(preferences?.dashboardWidgets || {}),
                      quranVerse: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="focusTools" className="text-base">Focus Tools</Label>
                  <p className="text-xs text-muted-foreground">Show Pomodoro timer and task timer</p>
                </div>
                <input
                  type="checkbox"
                  id="focusTools"
                  checked={preferences?.dashboardWidgets?.focusTools ?? true}
                  onChange={(e) => setPreferences({
                    dashboardWidgets: {
                      ...(preferences?.dashboardWidgets || {}),
                      focusTools: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="spotify" className="text-base">Spotify Player</Label>
                  <p className="text-xs text-muted-foreground">Show music player (if playlist URL is set)</p>
                </div>
                <input
                  type="checkbox"
                  id="spotify"
                  checked={preferences?.dashboardWidgets?.spotify ?? true}
                  onChange={(e) => setPreferences({
                    dashboardWidgets: {
                      ...(preferences?.dashboardWidgets || {}),
                      spotify: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="stats" className="text-base">Statistics</Label>
                  <p className="text-xs text-muted-foreground">Show task counts and progress</p>
                </div>
                <input
                  type="checkbox"
                  id="stats"
                  checked={preferences?.dashboardWidgets?.stats ?? true}
                  onChange={(e) => setPreferences({
                    dashboardWidgets: {
                      ...(preferences?.dashboardWidgets || {}),
                      stats: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="upcomingTasks" className="text-base">Upcoming Tasks</Label>
                  <p className="text-xs text-muted-foreground">Show list of tasks for today and tomorrow</p>
                </div>
                <input
                  type="checkbox"
                  id="upcomingTasks"
                  checked={preferences?.dashboardWidgets?.upcomingTasks ?? true}
                  onChange={(e) => setPreferences({
                    dashboardWidgets: {
                      ...(preferences?.dashboardWidgets || {}),
                      upcomingTasks: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Backup Tab */}
        <TabsContent value="data" className="space-y-4 outline-none">
          <DataBackupSettings />
        </TabsContent>
      </Tabs>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4 flex justify-end md:left-64 z-10">
        <Button
          onClick={savePreferences}
          className="px-8 shadow-lg"
        >
          💾 Save Preferences
        </Button>
      </div>
      <div className="h-20" /> {/* Spacer for sticky button */}
    </div>
  )
}
