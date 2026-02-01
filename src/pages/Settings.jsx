import { useUserStore } from '../stores/userStore'
import { supabase } from '../lib/supabase'
import { useTelegramNotifications } from '../hooks/useTelegramNotifications'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
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
  Music,
  Save
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { DataBackupSettings } from '@/components/settings/DataBackupSettings'
import { WorkspaceManager } from '@/components/WorkspaceManager'
import { ProjectManager } from '@/components/ProjectManager'
import { CategoryManager } from '@/components/CategoryManager'
import { TagManager } from '@/components/TagManager'

const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

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

  const dashboardWidgets = [
    { id: 'prayerTimes', label: 'Prayer Times', desc: 'Show 5 daily prayers and countdown' },
    { id: 'quranVerse', label: 'Quran Verse', desc: 'Show daily inspirational verse' },
    { id: 'focusTools', label: 'Focus Tools', desc: 'Show Pomodoro timer and task timer' },
    { id: 'spotify', label: 'Spotify Player', desc: 'Show music player (if playlist URL is set)' },
    { id: 'stats', label: 'Statistics', desc: 'Show task counts and progress' },
    { id: 'upcomingTasks', label: 'Upcoming Tasks', desc: 'Show list of tasks for today and tomorrow' },
  ]

  const sections = [
    { value: 'workspaces', icon: Building, iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10', label: 'Workspaces', desc: 'Create and manage your work contexts' },
    { value: 'projects', icon: FolderKanban, iconColor: 'text-blue-500', iconBg: 'bg-blue-500/10', label: 'Projects', desc: 'Organize tasks into projects within workspaces' },
    { value: 'categories', icon: LayoutGrid, iconColor: 'text-green-500', iconBg: 'bg-green-500/10', label: 'Categories', desc: 'Define task categories for better organization' },
    { value: 'tags', icon: Tags, iconColor: 'text-purple-500', iconBg: 'bg-purple-500/10', label: 'Tags', desc: 'Create tags to label and filter your tasks' },
    { value: 'prayer', icon: MapPin, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/10', label: 'Prayer Times', desc: 'Configure your location for accurate prayer times' },
    { value: 'notifications', icon: Bell, iconColor: 'text-amber-500', iconBg: 'bg-amber-500/10', label: 'Notifications', desc: 'Configure Telegram reminders for deadlines and meetings' },
    { value: 'dashboard', icon: LayoutDashboard, iconColor: 'text-sky-500', iconBg: 'bg-sky-500/10', label: 'Dashboard Widgets', desc: 'Customize what appears on your dashboard' },
    { value: 'data', icon: Database, iconColor: 'text-rose-500', iconBg: 'bg-rose-500/10', label: 'Data & Backup', desc: 'Export your tasks or import from other tools' },
  ]

  const renderSectionTrigger = (section) => {
    const Icon = section.icon
    return (
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${section.iconBg} rounded-lg`}>
            <Icon className={`w-5 h-5 ${section.iconColor}`} />
          </div>
          <div className="text-left">
            <div className="font-semibold text-base">{section.label}</div>
            <div className="text-xs text-muted-foreground font-normal">{section.desc}</div>
          </div>
        </div>
      </AccordionTrigger>
    )
  }

  return (
    <div id="settings-page" className="container-tight py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div id="settings-header" className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-xl">
          <SettingsIcon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display">Settings</h1>
          <p className="text-muted-foreground font-medium">Manage your workspaces, preferences, and application settings</p>
        </div>
      </div>

      {/* Accordion Sections with stagger animation */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <Accordion type="multiple" defaultValue={["workspaces"]} className="space-y-3">

          {/* ─── 1. WORKSPACES ─── */}
          <motion.div variants={staggerItem}>
            <AccordionItem id="settings-workspaces" value="workspaces" className="border rounded-xl px-4 bg-card shadow-sm">
              {renderSectionTrigger(sections[0])}
              <AccordionContent>
                <WorkspaceManager />
              </AccordionContent>
            </AccordionItem>
          </motion.div>

          {/* ─── 2. PROJECTS ─── */}
          <motion.div variants={staggerItem}>
            <AccordionItem id="settings-projects" value="projects" className="border rounded-xl px-4 bg-card shadow-sm">
              {renderSectionTrigger(sections[1])}
              <AccordionContent>
                <ProjectManager />
              </AccordionContent>
            </AccordionItem>
          </motion.div>

          {/* ─── 3. CATEGORIES ─── */}
          <motion.div variants={staggerItem}>
            <AccordionItem id="settings-categories" value="categories" className="border rounded-xl px-4 bg-card shadow-sm">
              {renderSectionTrigger(sections[2])}
              <AccordionContent>
                <CategoryManager />
              </AccordionContent>
            </AccordionItem>
          </motion.div>

          {/* ─── 4. TAGS ─── */}
          <motion.div variants={staggerItem}>
            <AccordionItem id="settings-tags" value="tags" className="border rounded-xl px-4 bg-card shadow-sm">
              {renderSectionTrigger(sections[3])}
              <AccordionContent>
                <TagManager />
              </AccordionContent>
            </AccordionItem>
          </motion.div>

          {/* ─── 5. PRAYER TIMES ─── */}
          <motion.div variants={staggerItem}>
            <AccordionItem id="settings-prayer" value="prayer" className="border rounded-xl px-4 bg-card shadow-sm">
              {renderSectionTrigger(sections[4])}
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
          </motion.div>

          {/* ─── 6. NOTIFICATIONS ─── */}
          <motion.div variants={staggerItem}>
            <AccordionItem id="settings-notifications" value="notifications" className="border rounded-xl px-4 bg-card shadow-sm">
              {renderSectionTrigger(sections[5])}
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

                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <Label htmlFor="enableTelegram" className="font-medium cursor-pointer">
                      Enable Telegram Notifications
                    </Label>
                    <Switch
                      id="enableTelegram"
                      checked={preferences?.telegram?.enabled || false}
                      onCheckedChange={(checked) => setPreferences({
                        telegram: {
                          ...(preferences?.telegram || { chatId: '', advanceMinutes: 30 }),
                          enabled: checked
                        }
                      })}
                    />
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
                    <Bell className="w-4 h-4 mr-2" />
                    Send Test Notification
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </motion.div>

          {/* ─── 7. DASHBOARD WIDGETS ─── */}
          <motion.div variants={staggerItem}>
            <AccordionItem id="settings-dashboard" value="dashboard" className="border rounded-xl px-4 bg-card shadow-sm">
              {renderSectionTrigger(sections[6])}
              <AccordionContent>
                <div className="space-y-3 py-2">
                  {dashboardWidgets.map((widget, index) => (
                    <motion.div
                      key={widget.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <Label htmlFor={`widget-${widget.id}`} className="text-sm font-medium cursor-pointer">{widget.label}</Label>
                        <p className="text-xs text-muted-foreground">{widget.desc}</p>
                      </div>
                      <Switch
                        id={`widget-${widget.id}`}
                        checked={preferences?.dashboardWidgets?.[widget.id] ?? true}
                        onCheckedChange={(checked) => setPreferences({
                          dashboardWidgets: {
                            ...(preferences?.dashboardWidgets || {}),
                            [widget.id]: checked
                          }
                        })}
                      />
                    </motion.div>
                  ))}

                  {/* Spotify Playlist URL */}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-green-500" />
                      <Label>Spotify Playlist URL</Label>
                    </div>
                    <Input
                      id="settings-spotify-url"
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
          </motion.div>

          {/* ─── 8. DATA & BACKUP ─── */}
          <motion.div variants={staggerItem}>
            <AccordionItem id="settings-data" value="data" className="border rounded-xl px-4 bg-card shadow-sm">
              {renderSectionTrigger(sections[7])}
              <AccordionContent>
                <DataBackupSettings />
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        </Accordion>
      </motion.div>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4 flex justify-end md:left-64 z-10">
        <Button
          id="settings-save-btn"
          onClick={handleSavePreferences}
          className="px-8 shadow-lg"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </Button>
      </div>
      <div className="h-20" />
    </div>
  )
}
