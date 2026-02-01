import { useUserStore } from '../stores/userStore'
import { supabase } from '../lib/supabase'
import { useTelegramNotifications } from '../hooks/useTelegramNotifications'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Settings as SettingsIcon,
  Building,
  FolderKanban,
  LayoutGrid,
  Tags,
  MapPin,
  Bell,
  LayoutDashboard,
  Database,
  Music
} from 'lucide-react'
import toast from 'react-hot-toast'
import { DataBackupSettings } from '@/components/settings/DataBackupSettings'
import { WorkspaceManager } from '@/components/WorkspaceManager'
import { ProjectManager } from '@/components/ProjectManager'
import { CategoryManager } from '@/components/CategoryManager'
import { TagManager } from '@/components/TagManager'

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

  const handleSavePreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const safePayload = {
        user_id: user.id,
        telegram: preferences.telegram,
        dashboardWidgets: preferences.dashboardWidgets,
        prayerLocation: preferences.prayerLocation,
        spotify_playlist_url: preferences.spotify_playlist_url
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert(safePayload, { onConflict: 'user_id' })

      if (error) throw error
      toast.success('Preferences saved successfully!')
    } catch (e) {
      toast.error('Failed to save: ' + e.message)
    }
  }

  return (
    <div className="container-tight py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-xl">
          <SettingsIcon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display">Settings</h1>
          <p className="text-muted-foreground font-medium">Manage your workspaces, preferences, and application settings</p>
        </div>
      </div>

      {/* Accordion Sections */}
      <Accordion type="multiple" defaultValue={["workspaces"]} className="space-y-3">

        {/* ─── 1. WORKSPACES ─── */}
        <AccordionItem value="workspaces" className="border rounded-xl px-4 bg-card shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Building className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">Workspaces</div>
                <div className="text-xs text-muted-foreground font-normal">Create and manage your work contexts</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <WorkspaceManager />
          </AccordionContent>
        </AccordionItem>

        {/* ─── 2. PROJECTS ─── */}
        <AccordionItem value="projects" className="border rounded-xl px-4 bg-card shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FolderKanban className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">Projects</div>
                <div className="text-xs text-muted-foreground font-normal">Organize tasks into projects within workspaces</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ProjectManager />
          </AccordionContent>
        </AccordionItem>

        {/* ─── 3. CATEGORIES ─── */}
        <AccordionItem value="categories" className="border rounded-xl px-4 bg-card shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <LayoutGrid className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">Categories</div>
                <div className="text-xs text-muted-foreground font-normal">Define task categories for better organization</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CategoryManager />
          </AccordionContent>
        </AccordionItem>

        {/* ─── 4. TAGS ─── */}
        <AccordionItem value="tags" className="border rounded-xl px-4 bg-card shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Tags className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">Tags</div>
                <div className="text-xs text-muted-foreground font-normal">Create tags to label and filter your tasks</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <TagManager />
          </AccordionContent>
        </AccordionItem>

        {/* ─── 5. PRAYER TIMES ─── */}
        <AccordionItem value="prayer" className="border rounded-xl px-4 bg-card shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <MapPin className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">Prayer Times</div>
                <div className="text-xs text-muted-foreground font-normal">Configure your location for accurate prayer times</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ─── 6. NOTIFICATIONS ─── */}
        <AccordionItem value="notifications" className="border rounded-xl px-4 bg-card shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">Notifications</div>
                <div className="text-xs text-muted-foreground font-normal">Configure Telegram reminders for deadlines and meetings</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 py-2">
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
                  To get your Chat ID: Send <code className="bg-muted px-1 py-0.5 rounded">/start</code> to your bot on Telegram
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
                Send Test Notification
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ─── 7. DASHBOARD WIDGETS ─── */}
        <AccordionItem value="dashboard" className="border rounded-xl px-4 bg-card shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500/10 rounded-lg">
                <LayoutDashboard className="w-5 h-5 text-sky-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">Dashboard Widgets</div>
                <div className="text-xs text-muted-foreground font-normal">Customize what appears on your dashboard</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 py-2">
              {[
                { id: 'prayerTimes', label: 'Prayer Times', desc: 'Show 5 daily prayers and countdown' },
                { id: 'quranVerse', label: 'Quran Verse', desc: 'Show daily inspirational verse' },
                { id: 'focusTools', label: 'Focus Tools', desc: 'Show Pomodoro timer and task timer' },
                { id: 'spotify', label: 'Spotify Player', desc: 'Show music player (if playlist URL is set)' },
                { id: 'stats', label: 'Statistics', desc: 'Show task counts and progress' },
                { id: 'upcomingTasks', label: 'Upcoming Tasks', desc: 'Show list of tasks for today and tomorrow' },
              ].map(widget => (
                <div key={widget.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <Label htmlFor={widget.id} className="text-sm font-medium cursor-pointer">{widget.label}</Label>
                    <p className="text-xs text-muted-foreground">{widget.desc}</p>
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
                    className="h-4 w-4 rounded border-gray-300 shrink-0"
                  />
                </div>
              ))}

              {/* Spotify Playlist URL */}
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-green-500" />
                  <Label>Spotify Playlist URL</Label>
                </div>
                <Input
                  type="text"
                  value={preferences?.spotify_playlist_url || ''}
                  onChange={(e) => setPreferences({ spotify_playlist_url: e.target.value })}
                  placeholder="https://open.spotify.com/playlist/..."
                />
                <p className="text-xs text-muted-foreground">
                  Paste your favorite Spotify playlist link to display the player in the sidebar.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ─── 8. DATA & BACKUP ─── */}
        <AccordionItem value="data" className="border rounded-xl px-4 bg-card shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <Database className="w-5 h-5 text-rose-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">Data & Backup</div>
                <div className="text-xs text-muted-foreground font-normal">Export your tasks or import from other tools</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <DataBackupSettings />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4 flex justify-end md:left-64 z-10">
        <Button
          onClick={handleSavePreferences}
          className="px-8 shadow-lg"
        >
          Save Preferences
        </Button>
      </div>
      <div className="h-20" />
    </div>
  )
}
