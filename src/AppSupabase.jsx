import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LoginSupabase from './components/LoginSupabase'
import PrayerTimes from './components/PrayerTimes'
import Calendar from './components/Calendar'
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

  // Prayer times for calendar
  const [prayerTimes, setPrayerTimes] = useState(null)

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
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('prayer_schedule')
        .select('*')
        .eq('date', today)
        .single()

      if (error) throw error
      setPrayerTimes(data)
    } catch (err) {
      console.error('Error loading prayer times:', err)
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
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
        <div className="status status-ok">
          ✅ Connected to Supabase
        </div>
      </header>

      <main className="container">
        <div className="dashboard-grid">
          {/* Prayer Times Widget */}
          <aside className="sidebar">
            <PrayerTimes />
          </aside>

          {/* Tasks Section */}
          <section className="tasks">
            <h2>Tasks</h2>

            {/* Notifications */}
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* Create Task Form */}
            <form onSubmit={createTask} className="task-form">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Task title *"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="form-input"
                  required
                />
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                  className="form-select"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                </select>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) })}
                  className="form-select"
                >
                  <option value="1">Priority 1</option>
                  <option value="2">Priority 2</option>
                  <option value="3">Priority 3</option>
                  <option value="4">Priority 4</option>
                  <option value="5">Priority 5</option>
                </select>
              </div>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="form-input"
                />
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="form-input"
                  placeholder="Due date"
                />
                <input
                  type="number"
                  placeholder="Duration (min)"
                  value={newTask.duration}
                  onChange={(e) => setNewTask({ ...newTask, duration: parseInt(e.target.value) || 60 })}
                  className="form-input"
                  min="5"
                  step="5"
                />
                <input
                  type="datetime-local"
                  value={newTask.scheduled_time}
                  onChange={(e) => setNewTask({ ...newTask, scheduled_time: e.target.value })}
                  className="form-input"
                  placeholder="Schedule time"
                />
                <button type="submit" className="btn-primary">
                  ➕ Add Task
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
                      <input
                        type="text"
                        value={editingTask.title}
                        onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                        className="form-input"
                        placeholder="Title"
                      />
                      <input
                        type="text"
                        value={editingTask.description || ''}
                        onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                        className="form-input"
                        placeholder="Description"
                      />
                      <div className="form-row">
                        <select
                          value={editingTask.status}
                          onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                          className="form-select"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                          <option value="blocked">Blocked</option>
                        </select>
                        <select
                          value={editingTask.priority}
                          onChange={(e) => setEditingTask({ ...editingTask, priority: parseInt(e.target.value) })}
                          className="form-select"
                        >
                          <option value="1">Priority 1</option>
                          <option value="2">Priority 2</option>
                          <option value="3">Priority 3</option>
                          <option value="4">Priority 4</option>
                          <option value="5">Priority 5</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Duration (min)"
                          value={editingTask.duration || 60}
                          onChange={(e) => setEditingTask({ ...editingTask, duration: parseInt(e.target.value) || 60 })}
                          className="form-input"
                          min="5"
                          step="5"
                        />
                      </div>
                      <div className="form-row">
                        <input
                          type="date"
                          value={editingTask.due_date || ''}
                          onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                          className="form-input"
                          placeholder="Due date"
                        />
                        <input
                          type="datetime-local"
                          value={editingTask.scheduled_time || ''}
                          onChange={(e) => setEditingTask({ ...editingTask, scheduled_time: e.target.value })}
                          className="form-input"
                          placeholder="Schedule time"
                        />
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
              prayerTimes={prayerTimes}
              onTaskUpdate={updateTask}
            />
          </section>
        </div>
      </main>
    </div>
  )
}

export default AppSupabase
