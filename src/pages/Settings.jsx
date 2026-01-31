import { useState, useEffect } from 'react'
import { useUserStore } from '../stores/userStore'
import { useTelegramNotifications } from '../hooks/useTelegramNotifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings as SettingsIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { DataBackupSettings } from '@/components/settings/DataBackupSettings'
import { settingsService } from '../services/settings.service'

const AVAILABLE_CITIES = [
  { label: 'Los Angeles (PST)', value: 'America/Los_Angeles', city: 'Los Angeles' },
  { label: 'New York (EST)', value: 'America/New_York', city: 'New York' },
  { label: 'London (GMT)', value: 'Europe/London', city: 'London' },
  { label: 'Paris (CET)', value: 'Europe/Paris', city: 'Paris' },
  { label: 'Berlin (CET)', value: 'Europe/Berlin', city: 'Berlin' },
  { label: 'Moscow (MSK)', value: 'Europe/Moscow', city: 'Moscow' },
  { label: 'Dubai (GST)', value: 'Asia/Dubai', city: 'Dubai' },
  { label: 'Mumbai (IST)', value: 'Asia/Kolkata', city: 'Mumbai' },
  { label: 'Singapore (SGT)', value: 'Asia/Singapore', city: 'Singapore' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo', city: 'Tokyo' },
  { label: 'Sydney (AEDT)', value: 'Australia/Sydney', city: 'Sydney' },
]

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
      const payload = {
        telegram: preferences.telegram,
        dashboardWidgets: preferences.dashboardWidgets,
        prayerLocation: preferences.prayerLocation,
        spotify_playlist_url: preferences.spotify_playlist_url,
        world_clock_cities: preferences.world_clock_cities
      }
      await settingsService.updatePreferences(payload)
      toast.success('Preferences saved successfully!')
    } catch (e) {
      console.error(e)
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

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="eisenhower" className="text-base">Eisenhower Matrix</Label>
                  <p className="text-xs text-muted-foreground">Show "Do It Now" urgent task widget</p>
                </div>
                <input
                  type="checkbox"
                  id="eisenhower"
                  checked={preferences?.dashboardWidgets?.eisenhower ?? true}
                  onChange={(e) => setPreferences({
                    dashboardWidgets: {
                      ...(preferences?.dashboardWidgets || {}),
                      eisenhower: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="scratchpad" className="text-base">Scratchpad</Label>
                  <p className="text-xs text-muted-foreground">Show auto-saving note widget</p>
                </div>
                <input
                  type="checkbox"
                  id="scratchpad"
                  checked={preferences?.dashboardWidgets?.scratchpad ?? true}
                  onChange={(e) => setPreferences({
                    dashboardWidgets: {
                      ...(preferences?.dashboardWidgets || {}),
                      scratchpad: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="worldClock" className="text-base">World Clock</Label>
                  <p className="text-xs text-muted-foreground">Show New York/Tokyo/London time</p>
                </div>
                <input
                  type="checkbox"
                  id="worldClock"
                  checked={preferences?.dashboardWidgets?.worldClock ?? true}
                  onChange={(e) => setPreferences({
                    dashboardWidgets: {
                      ...(preferences?.dashboardWidgets || {}),
                      worldClock: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>

              {preferences?.dashboardWidgets?.worldClock !== false && (
                <div className="ml-1 pl-4 border-l-2 border-muted grid grid-cols-1 md:grid-cols-3 gap-3 pb-2 animate-in slide-in-from-top-2">
                  {[0, 1, 2].map(index => {
                    const currentCity = preferences?.world_clock_cities?.[index]

                    return (
                      <div key={index} className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">City {index + 1}</Label>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Input
                              className="h-8 text-xs bg-background"
                              placeholder="Type city & Enter..."
                              defaultValue={currentCity?.city || ''}
                              onKeyDown={async (e) => {
                                // Fix: only trigger on initial Enter press, avoid duplicates
                                if (e.key === 'Enter') {
                                  const val = e.currentTarget.value
                                  if (!val) return
                                  e.preventDefault()

                                  const toastId = toast.loading('Searching...')
                                  try {
                                    const { searchCityTimezone } = await import('../services/prayerTimesApi')
                                    const result = await searchCityTimezone(val)

                                    toast.dismiss(toastId)
                                    toast.success(`Found: ${result.city}`)

                                    const newCities = [...(preferences?.world_clock_cities || [])]
                                    while (newCities.length <= index) newCities.push(null)

                                    newCities[index] = {
                                      label: result.city,
                                      city: result.city,
                                      value: result.timezone, // Compatibility: store timezone in value key
                                      timezone: result.timezone,
                                      country: result.country
                                    }
                                    setPreferences({ world_clock_cities: newCities })

                                    // Auto-save to backend
                                    await settingsService.updatePreferences({
                                      ...preferences,
                                      world_clock_cities: newCities
                                    })
                                    toast.success('City saved!')
                                  } catch (err) {
                                    toast.dismiss(toastId)
                                    toast.error('City not found')
                                  }
                                }
                              }}
                            />
                          </div>
                          {currentCity?.value && (
                            <p className="text-[10px] text-green-600 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                              {currentCity.value}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  💡 Inspiration Grid
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'inspiration_growth', label: 'Growth Hack 🚀', desc: 'Astuce Croissance' },
                    { id: 'inspiration_bias', label: 'Biais Cognitif 🧠', desc: 'Psychologie & Vente' },
                    { id: 'inspiration_business', label: 'Business Tip 💼', desc: 'Stratégie & Croissance' },
                    { id: 'inspiration_body', label: 'Corps Humain 💖', desc: 'Secrets de ton corps' },
                    { id: 'inspiration_quran', label: 'Verset du Jour 📖', desc: 'Parole sacrée' },
                    { id: 'inspiration_challenge', label: 'Défi du Jour 🎯', desc: 'Passe à l\'action' },
                    { id: 'inspiration_tip', label: 'Conseil Prod ⚡', desc: 'Booster productivité' },
                    { id: 'inspiration_zen', label: 'Minute Zen 🌬️', desc: 'Respire un coup' },
                    { id: 'inspiration_word', label: 'Mot du Jour 📚', desc: 'Enrichir vocabulaire' },
                    { id: 'inspiration_quote', label: 'Citation 💬', desc: 'Sagesse & motivation' },
                    { id: 'inspiration_joke', label: 'Blague 💡', desc: 'Un peu d\'humour' },
                    { id: 'inspiration_fact', label: 'Savoir Inutile 🧠', desc: 'Culture générale' }
                  ].map(widget => (
                    <div key={widget.id} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                      <div>
                        <Label htmlFor={widget.id} className="text-sm font-medium">{widget.label}</Label>
                        <p className="text-[10px] text-muted-foreground">{widget.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        id={widget.id}
                        checked={preferences?.dashboardWidgets?.[widget.id] ?? true}
                        onChange={(e) => setPreferences({
                          dashboardWidgets: {
                            ...(preferences?.dashboardWidgets || {}),
                            [widget.id]: e.target.checked
                          }
                        })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>
                  ))}
                </div>
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
