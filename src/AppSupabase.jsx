import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LoginSupabase from './components/LoginSupabase'
import PrayerTimes from './components/PrayerTimes'
import Calendar from './components/Calendar'
import Settings from './components/Settings'
import PrayerCountdown from './components/PrayerCountdown'
import Pomodoro from './components/Pomodoro'
import TaskTimer from './components/TaskTimer'
import QuranVerse from './components/QuranVerse'
import SpotifyPlayer from './components/SpotifyPlayer'
import './App.css'

function AppSupabase() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 1,
    due_date: '',
    duration: 60,
    scheduled_time: '',
    category_id: '',
    project_id: ''
  })

  const [categories, setCategories] = useState([])
  const [projects, setProjects] = useState([])

  // Edit state
  const [editingTask, setEditingTask] = useState(null)

  // Prayer schedule for calendar (multiple days)
  const [prayerSchedule, setPrayerSchedule] = useState([])

  // Settings modal
  const [showSettings, setShowSettings] = useState(false)
  const [userPreferences, setUserPreferences] = useState(null)

  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
    dueDate: '',
    category: 'all',
    project: 'all'
  })

  const filteredTasks = tasks.filter(task => {
    const matchStatus = filters.status === 'all' || task.status === filters.status
    const matchPriority = filters.priority === 'all' || task.priority === parseInt(filters.priority)
    const matchSearch = task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      (task.description?.toLowerCase() || '').includes(filters.search.toLowerCase())
    const matchDate = filters.dueDate === '' || task.due_date === filters.dueDate
    const matchCategory = filters.category === 'all' || task.category_id === filters.category
    const matchProject = filters.project === 'all' || task.project_id === filters.project
    return matchStatus && matchPriority && matchSearch && matchDate && matchCategory && matchProject
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user || null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      loadTasks()
      loadPrayerTimes()
      loadPreferences()
      loadCategories()
      loadProjects()
    }
  }, [user])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error('Error loading projects:', err)
    }
  }

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          category:task_categories(name, color),
          project:projects(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (err) {
      console.error('Error loading tasks:', err)
      showError('Failed to load tasks')
    }
  }

  const loadPrayerTimes = async () => {
    try {
      const { data, error } = await supabase
        .from('prayer_schedule')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error
      setPrayerSchedule(data || [])
    } catch (err) {
      console.error('Error loading prayer times:', err)
    }
  }

  const loadPreferences = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setUserPreferences(data)
    } catch (err) {
      console.error('Error loading preferences:', err)
    }
  }

  const createTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) {
      showError('Title is required')
      return
    }

    try {
      // Sanitize empty strings to null for the database
      const taskToSave = {
        ...newTask,
        description: newTask.description?.trim() || null,
        due_date: newTask.due_date || null,
        scheduled_time: newTask.scheduled_time || null,
        category_id: newTask.category_id || null,
        project_id: newTask.project_id || null,
        user_id: user.id
      }

      const { error } = await supabase
        .from('tasks')
        .insert(taskToSave)

      if (error) throw error

      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        priority: 1,
        due_date: '',
        duration: 60,
        scheduled_time: '',
        category_id: '',
        project_id: ''
      })
      loadTasks()
      showSuccess('Tâche créée !')
    } catch (err) {
      console.error('Error creating task:', err)
      showError(`Erreur : ${err.message || 'Échec de la création'}`)
    }
  }

  const updateTask = async (id, updates) => {
    try {
      // Sanitize updates
      const sanitizedUpdates = { ...updates }
      if (sanitizedUpdates.description === '') sanitizedUpdates.description = null
      if (sanitizedUpdates.due_date === '') sanitizedUpdates.due_date = null
      if (sanitizedUpdates.scheduled_time === '') sanitizedUpdates.scheduled_time = null
      if (sanitizedUpdates.category_id === '') sanitizedUpdates.category_id = null
      if (sanitizedUpdates.project_id === '') sanitizedUpdates.project_id = null

      const { error } = await supabase
        .from('tasks')
        .update(sanitizedUpdates)
        .eq('id', id)

      if (error) throw error

      loadTasks()
      setEditingTask(null)
      showSuccess('Tâche mise à jour !')
    } catch (err) {
      console.error('Error updating task:', err)
      showError(`Erreur : ${err.message || 'Échec de la mise à jour'}`)
    }
  }

  const deleteTask = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error

      loadTasks()
      showSuccess('Tâche supprimée !')
    } catch (err) {
      console.error('Error deleting task:', err)
      showError('Échec de la suppression')
    }
  }

  const toggleStatus = (task) => {
    const statusFlow = { todo: 'in_progress', in_progress: 'done', done: 'todo', blocked: 'todo' }
    updateTask(task.id, { status: statusFlow[task.status] })
  }

  const showError = (message) => {
    setError(message)
    setTimeout(() => setError(null), 3000)
  }

  const showSuccess = (message) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleLoginSuccess = (data) => {
    setSession(data.session)
    setUser(data.user)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setTasks([])
  }

  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  // Show login if not authenticated
  if (!session || !user) {
    return <LoginSupabase onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div>
            <h1>🚀 Superplanner</h1>
            <p>Task Management & CRM for Small Business</p>
          </div>
          <div className="header-actions">
            {user && (
              <span className="user-name">
                👤 {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
              </span>
            )}
            <button onClick={() => setShowSettings(true)} className="settings-button">
              ⚙️ Settings
            </button>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {/* Top Widgets Row */}
        <div className="widgets-row">
          <PrayerTimes />
          <div className="widget-col">
            <PrayerCountdown prayerTimes={prayerSchedule.find(p => p.date === new Date().toISOString().split('T')[0])} />
            <QuranVerse />
          </div>
          <div className="widget-col span-2">
            <div className="widget-sub-row">
              <Pomodoro preferences={userPreferences} />
              <TaskTimer tasks={tasks} />
            </div>
            <SpotifyPlayer playlistUrl={userPreferences?.spotify_playlist_url} />
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Tasks Section */}
          <section className="tasks">
            <h2>Tasks</h2>

            {/* Notifications */}
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* Create Task Form */}
            <form onSubmit={createTask} className="task-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Titre *</label>
                  <input
                    type="text"
                    placeholder="Titre de la tâche"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    className="form-select"
                  >
                    <option value="todo">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="done">Terminé</option>
                    <option value="blocked">Bloqué</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priorité</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) })}
                    className="form-select"
                  >
                    <option value="1">Priorité 1 (Basse)</option>
                    <option value="2">Priorité 2</option>
                    <option value="3">Priorité 3 (Moyenne)</option>
                    <option value="4">Priorité 4</option>
                    <option value="5">Priorité 5 (Haute)</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    placeholder="Description (optionnel)"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Échéance</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Durée (min)</label>
                  <input
                    type="number"
                    placeholder="Durée"
                    value={newTask.duration}
                    onChange={(e) => setNewTask({ ...newTask, duration: parseInt(e.target.value) || 60 })}
                    className="form-input"
                    min="5"
                    step="5"
                  />
                </div>
                <div className="form-group">
                  <label>Programmation</label>
                  <input
                    type="datetime-local"
                    value={newTask.scheduled_time}
                    onChange={(e) => setNewTask({ ...newTask, scheduled_time: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Catégorie</label>
                  <select
                    value={newTask.category_id}
                    onChange={(e) => setNewTask({ ...newTask, category_id: e.target.value })}
                    className="form-select"
                  >
                    <option value="">Aucune catégorie</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Projet</label>
                  <select
                    value={newTask.project_id}
                    onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
                    className="form-select"
                  >
                    <option value="">Aucun projet</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', height: '44px', flex: 0.5 }}>
                  ➕ Ajouter
                </button>
              </div>
            </form>

            {/* Task Filters */}
            <div className="task-filters">
              <div className="form-group">
                <label>Recherche</label>
                <input
                  type="text"
                  placeholder="Rechercher une tâche..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Statut</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="form-select"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="todo">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="done">Terminé</option>
                  <option value="blocked">Bloqué</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priorité</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="form-select"
                >
                  <option value="all">Toutes les priorités</option>
                  <option value="1">Priorité 1</option>
                  <option value="2">Priorité 2</option>
                  <option value="3">Priorité 3</option>
                  <option value="4">Priorité 4</option>
                  <option value="5">Priorité 5</option>
                </select>
              </div>
              <div className="form-group">
                <label>Échéance</label>
                <input
                  type="date"
                  value={filters.dueDate}
                  onChange={(e) => setFilters({ ...filters, dueDate: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Catégorie</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="form-select"
                >
                  <option value="all">Toutes les catégories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Projet</label>
                <select
                  value={filters.project}
                  onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                  className="form-select"
                >
                  <option value="all">Tous les projets</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn-secondary"
                style={{ height: '44px' }}
                onClick={() => setFilters({ status: 'all', priority: 'all', search: '', dueDate: '', category: 'all', project: 'all' })}
              >
                Reset
              </button>
            </div>

            {/* Task List */}
            {filteredTasks.length === 0 ? (
              <p className="empty">Aucune tâche trouvée.</p>
            ) : (
              <div className="task-list">{filteredTasks.map(task => (

                <div key={task.id} className="task-card">
                  {editingTask?.id === task.id ? (
                    // Edit Mode - All Fields
                    <div className="task-edit">
                      <div className="form-group">
                        <label>Titre *</label>
                        <input
                          type="text"
                          value={editingTask.title}
                          onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                          className="form-input"
                          placeholder="Titre"
                        />
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <input
                          type="text"
                          value={editingTask.description || ''}
                          onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                          className="form-input"
                          placeholder="Description"
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Statut</label>
                          <select
                            value={editingTask.status}
                            onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                            className="form-select"
                          >
                            <option value="todo">À faire</option>
                            <option value="in_progress">En cours</option>
                            <option value="done">Terminé</option>
                            <option value="blocked">Bloqué</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Priorité</label>
                          <select
                            value={editingTask.priority}
                            onChange={(e) => setEditingTask({ ...editingTask, priority: parseInt(e.target.value) })}
                            className="form-select"
                          >
                            <option value="1">Priorité 1</option>
                            <option value="2">Priorité 2</option>
                            <option value="3">Priorité 3</option>
                            <option value="4">Priorité 4</option>
                            <option value="5">Priorité 5</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Durée (min)</label>
                          <input
                            type="number"
                            placeholder="Durée"
                            value={editingTask.duration || 60}
                            onChange={(e) => setEditingTask({ ...editingTask, duration: parseInt(e.target.value) || 60 })}
                            className="form-input"
                            min="5"
                            step="5"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Échéance</label>
                          <input
                            type="date"
                            value={editingTask.due_date || ''}
                            onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Programmation</label>
                          <input
                            type="datetime-local"
                            value={editingTask.scheduled_time || ''}
                            onChange={(e) => setEditingTask({ ...editingTask, scheduled_time: e.target.value })}
                            className="form-input"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Catégorie</label>
                          <select
                            value={editingTask.category_id || ''}
                            onChange={(e) => setEditingTask({ ...editingTask, category_id: e.target.value })}
                            className="form-select"
                          >
                            <option value="">Aucune catégorie</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Projet</label>
                          <select
                            value={editingTask.project_id || ''}
                            onChange={(e) => setEditingTask({ ...editingTask, project_id: e.target.value })}
                            className="form-select"
                          >
                            <option value="">Aucun projet</option>
                            {projects.map(proj => (
                              <option key={proj.id} value={proj.id}>{proj.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="task-actions">
                        <button onClick={() => updateTask(task.id, editingTask)} className="btn-success">
                          ✓ Enregistrer
                        </button>
                        <button onClick={() => setEditingTask(null)} className="btn-secondary">
                          ✕ Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="task-content">
                        <div className="task-header">
                          <div className="task-title-group">
                            <h3 className="task-title">{task.title}</h3>
                            <div className="task-badges">
                              {task.category && (
                                <span className="category-badge" style={{ backgroundColor: task.category.color || '#e2e8f0' }}>
                                  {task.category.name}
                                </span>
                              )}
                              {task.project && (
                                <span className="project-badge">
                                  📁 {task.project.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`task-status status-${task.status}`}
                            onClick={() => toggleStatus(task)}
                            title="Click to change status"
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                        {task.description && (
                          <p className="task-description">{task.description}</p>
                        )}
                        <div className="task-meta">
                          <span className="task-priority">Priority: {task.priority}</span>
                          {task.due_date && (
                            <span className="task-due-date">Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="task-actions">
                        <button onClick={() => setEditingTask(task)} className="btn-edit">
                          ✏️ Edit
                        </button>
                        <button onClick={() => deleteTask(task.id)} className="btn-delete">
                          🗑️ Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              </div>
            )}
          </section>

          {/* Calendar Section */}
          <section className="calendar-section">
            <Calendar
              tasks={tasks}
              prayerSchedule={prayerSchedule}
              onTaskUpdate={updateTask}
              onTaskEdit={setEditingTask}
            />
          </section>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          user={user}
          onClose={() => {
            setShowSettings(false)
            loadPrayerTimes()
            loadPreferences() // Reload preferences after settings change
          }}
        />
      )}
    </div>
  )
}

export default AppSupabase
