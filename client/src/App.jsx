import { useState, useEffect } from 'react'
import axios from 'axios'
import Login from './components/Login'
import './App.css'

// Configure axios to send auth token with all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState(null)

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      setIsAuthenticated(true)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    const checkHealth = async () => {
      try {
        await axios.get('/api/health')
        setStatus('ok')
      } catch (err) {
        setStatus('error')
        setError('Unable to connect to server')
      }
    }

    const loadTasks = async () => {
      try {
        const response = await axios.get('/api/tasks')
        setTasks(response.data || [])
        setError(null)
      } catch (err) {
        console.error('Failed to load tasks:', err)
        if (err.response?.status === 401) {
          // Token expired or invalid
          handleLogout()
        } else {
          setError('Failed to load tasks')
        }
      }
    }

    checkHealth()
    loadTasks()
  }, [isAuthenticated])

  const handleLoginSuccess = (data) => {
    setIsAuthenticated(true)
    setUser(data.user)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
    setTasks([])
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />
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
            {user && <span className="user-name">👤 {user.username}</span>}
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
        <div className={`status status-${status}`}>
          {status === 'ok' && '✅ Connected'}
          {status === 'loading' && '⏳ Loading...'}
          {status === 'error' && '❌ Connection error'}
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

export default App
