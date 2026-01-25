import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState('loading')
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'))

    fetch('/api/tasks')
      .then(r => r.json())
      .then(data => setTasks(data || []))
      .catch(console.error)
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
