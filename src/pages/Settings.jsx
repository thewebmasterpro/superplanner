import { useState, useEffect } from 'react'
import { useUserStore } from '../stores/userStore'
import { supabase } from '../lib/supabase'
import { useTelegramNotifications } from '../hooks/useTelegramNotifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Settings as SettingsIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export function Settings() {
  const { preferences, setPreferences } = useUserStore()
  const { sendTestNotification } = useTelegramNotifications()
  const [categories, setCategories] = useState([])
  const [projects, setProjects] = useState([])
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3b82f6' })
  const [newProject, setNewProject] = useState({ name: '', description: '' })

  // Load categories and projects
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [categoriesRes, projectsRes] = await Promise.all([
        supabase.from('task_categories').select('*').order('name'),
        supabase.from('projects').select('*').order('name')
      ])

      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (projectsRes.data) setProjects(projectsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.name.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('task_categories')
        .insert({
          name: newCategory.name,
          color: newCategory.color,
          user_id: user.id
        })

      if (error) throw error

      toast.success('Category added successfully!')
      setNewCategory({ name: '', color: '#3b82f6' })
      loadData()
    } catch (error) {
      toast.error(`Failed to add category: ${error.message}`)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Tasks using it will remain unaffected.')) return

    try {
      const { error } = await supabase
        .from('task_categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Category deleted successfully!')
      loadData()
    } catch (error) {
      toast.error(`Failed to delete category: ${error.message}`)
    }
  }

  const handleAddProject = async (e) => {
    e.preventDefault()
    if (!newProject.name.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('projects')
        .insert({
          name: newProject.name,
          description: newProject.description || null,
          user_id: user.id
        })

      if (error) throw error

      toast.success('Project added successfully!')
      setNewProject({ name: '', description: '' })
      loadData()
    } catch (error) {
      toast.error(`Failed to add project: ${error.message}`)
    }
  }

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Delete this project? Tasks using it will remain unaffected.')) return

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Project deleted successfully!')
      loadData()
    } catch (error) {
      toast.error(`Failed to delete project: ${error.message}`)
    }
  }

  const handleTestTelegram = async () => {
    const result = await sendTestNotification()
    if (result.success) {
      toast.success('Test notification sent successfully! Check your Telegram.')
    } else {
      toast.error(`Failed to send notification: ${result.error}`)
    }
  }

  return (
    <div className="container-tight py-8 space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and data</p>
        </div>
      </div>

      <Tabs defaultValue="preferences" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
              <CardDescription>Configure your campaign workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setupDays">Campaign Setup Days Before</Label>
                <Input
                  id="setupDays"
                  type="number"
                  value={preferences.campaignSetupDaysBefore}
                  onChange={(e) => setPreferences({
                    campaignSetupDaysBefore: parseInt(e.target.value)
                  })}
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  Number of days before campaign start to begin setup
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportingDays">Campaign Reporting Days After</Label>
                <Input
                  id="reportingDays"
                  type="number"
                  value={preferences.campaignReportingDaysAfter}
                  onChange={(e) => setPreferences({
                    campaignReportingDaysAfter: parseInt(e.target.value)
                  })}
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  Number of days after campaign end to complete reporting
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="enableCampaigns"
                  checked={preferences.enableCampaigns}
                  onChange={(e) => setPreferences({
                    enableCampaigns: e.target.checked
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="enableCampaigns" className="font-normal">
                  Enable Campaigns Module
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work Hours</CardTitle>
              <CardDescription>Configure your working hours for different contexts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Distriweb Start Hour</Label>
                  <Input
                    type="number"
                    value={preferences.distriwebHours.start}
                    onChange={(e) => setPreferences({
                      distriwebHours: {
                        ...preferences.distriwebHours,
                        start: parseFloat(e.target.value)
                      }
                    })}
                    min="0"
                    max="24"
                    step="0.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Distriweb End Hour</Label>
                  <Input
                    type="number"
                    value={preferences.distriwebHours.end}
                    onChange={(e) => setPreferences({
                      distriwebHours: {
                        ...preferences.distriwebHours,
                        end: parseFloat(e.target.value)
                      }
                    })}
                    min="0"
                    max="24"
                    step="0.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Thewebmaster Start Hour</Label>
                  <Input
                    type="number"
                    value={preferences.thewebmasterHours.start}
                    onChange={(e) => setPreferences({
                      thewebmasterHours: {
                        ...preferences.thewebmasterHours,
                        start: parseFloat(e.target.value)
                      }
                    })}
                    min="0"
                    max="24"
                    step="0.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thewebmaster End Hour</Label>
                  <Input
                    type="number"
                    value={preferences.thewebmasterHours.end}
                    onChange={(e) => setPreferences({
                      thewebmasterHours: {
                        ...preferences.thewebmasterHours,
                        end: parseFloat(e.target.value)
                      }
                    })}
                    min="0"
                    max="24"
                    step="0.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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
                    value={preferences.prayerLocation?.city || ''}
                    onChange={(e) => setPreferences({
                      prayerLocation: {
                        ...preferences.prayerLocation,
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
                    value={preferences.prayerLocation?.country || ''}
                    onChange={(e) => setPreferences({
                      prayerLocation: {
                        ...preferences.prayerLocation,
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
              <CardDescription>Configure reminders via @Henry_anouar_bot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Telegram Chat ID</Label>
                <Input
                  type="text"
                  value={preferences.telegram?.chatId || ''}
                  onChange={(e) => setPreferences({
                    telegram: {
                      ...preferences.telegram,
                      chatId: e.target.value
                    }
                  })}
                  placeholder="123456789"
                />
                <p className="text-xs text-muted-foreground">
                  💡 To get your Chat ID: Send <code className="bg-muted px-1 py-0.5 rounded">/start</code> to <a href="https://t.me/Henry_anouar_bot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@Henry_anouar_bot</a> on Telegram
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableTelegram"
                  checked={preferences.telegram?.enabled || false}
                  onChange={(e) => setPreferences({
                    telegram: {
                      ...preferences.telegram,
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
                  value={preferences.telegram?.advanceMinutes || 30}
                  onChange={(e) => setPreferences({
                    telegram: {
                      ...preferences.telegram,
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
                disabled={!preferences.telegram?.chatId || !preferences.telegram?.enabled}
              >
                🧪 Send Test Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Category</CardTitle>
              <CardDescription>Create a new task category</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="e.g., Development, Marketing, Personal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryColor">Color</Label>
                    <Input
                      id="categoryColor"
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Categories</CardTitle>
              <CardDescription>{categories.length} categories configured</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No categories yet. Create one above!</p>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Project</CardTitle>
              <CardDescription>Create a new project to organize your tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="e.g., Website Redesign, Product Launch"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectDesc">Description (Optional)</Label>
                  <Input
                    id="projectDesc"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Brief description of the project"
                  />
                </div>
                <Button type="submit">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>{projects.length} projects configured</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No projects yet. Create one above!</p>
                ) : (
                  projects.map((proj) => (
                    <div key={proj.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{proj.name}</p>
                        {proj.description && (
                          <p className="text-sm text-muted-foreground">{proj.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProject(proj.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
