import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [status, setStatus] = useState('loading')
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
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
      } catch (err) {
        console.error('Failed to load tasks:', err)
        setError('Failed to load tasks')
      }
    }

    checkHealth()
    loadTasks()
  }, [])

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 Superplanner</h1>
        <p>Task Management & CRM for Small Business</p>
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
