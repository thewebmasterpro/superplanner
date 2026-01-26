import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LoginSupabase from './components/LoginSupabase'
import './App.css'

function AppSupabase() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState(null)

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
      setError('Failed to load tasks')
    }
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
        <section className="tasks">
          <h2>Tasks</h2>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          {tasks.length === 0 ? (
            <p className="empty">No tasks yet. Create one to get started!</p>
          ) : (
            <ul className="task-list">
              {tasks.map(task => (
                <li key={task.id} className="task-item">
                  <span className="task-title">{task.title}</span>
                  <span className={`task-status status-${task.status}`}>{task.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default AppSupabase
