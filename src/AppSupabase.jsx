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
    scheduled_time: ''
  })

  // Edit state
  const [editingTask, setEditingTask] = useState(null)

  // Prayer schedule for calendar (multiple days)
  const [prayerSchedule, setPrayerSchedule] = useState([])

  // Settings modal
  const [showSettings, setShowSettings] = useState(false)
  const [userPreferences, setUserPreferences] = useState(null)

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
    }
  }, [user])

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
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
      const { error } = await supabase
        .from('tasks')
        .insert({
          ...newTask,
          user_id: user.id
        })

      if (error) throw error

      setNewTask({ title: '', description: '', status: 'todo', priority: 1, due_date: '' })
      loadTasks()
      showSuccess('Task created!')
    } catch (err) {
      console.error('Error creating task:', err)
      showError('Failed to create task')
    }
  }

  const updateTask = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      loadTasks()
      setEditingTask(null)
      showSuccess('Task updated!')
    } catch (err) {
      console.error('Error updating task:', err)
      showError('Failed to update task')
    }
  }

  const deleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error

      loadTasks()
      showSuccess('Task deleted!')
    } catch (err) {
      console.error('Error deleting task:', err)
      showError('Failed to delete task')
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
                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', height: '44px' }}>
                  ➕ Ajouter
                </button>
              </div>
            </form>

            {/* Task List */}
            {tasks.length === 0 ? (
              <p className="empty">No tasks yet. Create one to get started!</p>
            ) : (
              <div className="task-list">{tasks.map(task => (

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
                      <div className="task-actions">
                        <button onClick={() => updateTask(task.id, editingTask)} className="btn-success">
                          ✓ Save
                        </button>
                        <button onClick={() => setEditingTask(null)} className="btn-secondary">
                          ✕ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="task-content">
                        <div className="task-header">
                          <h3 className="task-title">{task.title}</h3>
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
