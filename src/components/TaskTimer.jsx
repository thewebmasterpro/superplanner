import { useState, useEffect } from 'react'
import './TaskTimer.css'

function TaskTimer({ tasks }) {
    const [selectedTaskId, setSelectedTaskId] = useState('')
    const [isRunning, setIsRunning] = useState(false)
    const [seconds, setSeconds] = useState(0)

    useEffect(() => {
        let interval = null

        if (isRunning) {
            interval = setInterval(() => {
                setSeconds(prev => prev + 1)
            }, 1000)
        } else {
            clearInterval(interval)
        }

        return () => clearInterval(interval)
    }, [isRunning])

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const secs = totalSeconds % 60

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }

    const handleStart = () => {
        if (!selectedTaskId) {
            alert('Please select a task first')
            return
        }
        setIsRunning(true)
    }

    const handleStop = () => {
        setIsRunning(false)
    }

    const handleReset = () => {
        setIsRunning(false)
        setSeconds(0)
    }

    const selectedTask = tasks.find(t => t.id === selectedTaskId)

    return (
        <div className={`task-timer-widget ${isRunning ? 'running' : ''}`}>
            <h3>⏲️ Task Timer</h3>

            <div className="task-selector">
                <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="task-select"
                    disabled={isRunning}
                >
                    <option value="">Select a task...</option>
                    {tasks.filter(t => t.status !== 'done').map(task => (
                        <option key={task.id} value={task.id}>
                            {task.title}
                        </option>
                    ))}
                </select>
            </div>

            <div className="timer-display">
                <div className="timer-time">{formatTime(seconds)}</div>
                {selectedTask && (
                    <div className="timer-task-info">
                        <span className="task-badge status-{selectedTask.status}">
                            {selectedTask.status.replace('_', ' ')}
                        </span>
                    </div>
                )}
            </div>

            <div className="timer-controls">
                {!isRunning ? (
                    <button onClick={handleStart} className="btn-timer btn-start">
                        ▶️ Start
                    </button>
                ) : (
                    <button onClick={handleStop} className="btn-timer btn-stop">
                        ⏸️ Stop
                    </button>
                )}
                <button onClick={handleReset} className="btn-timer btn-reset">
                    🔄 Reset
                </button>
            </div>

            {isRunning && (
                <div className="running-indicator">
                    <span className="pulse-dot"></span>
                    <span>Timer running...</span>
                </div>
            )}
        </div>
    )
}

export default TaskTimer
