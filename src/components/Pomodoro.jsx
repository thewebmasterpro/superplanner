import { useState, useEffect } from 'react'
import './Pomodoro.css'

function Pomodoro({ preferences }) {
    const [mode, setMode] = useState('work') // 'work' or 'break'
    const [timeLeft, setTimeLeft] = useState(25 * 60)
    const [isActive, setIsActive] = useState(false)

    // Update time when preferences change or mode switches
    useEffect(() => {
        if (!isActive) {
            const duration = mode === 'work'
                ? (preferences?.pomodoro_work_duration || 25)
                : (preferences?.pomodoro_break_duration || 5)
            setTimeLeft(duration * 60)
        }
    }, [preferences, mode, isActive])

    useEffect(() => {
        let interval = null
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1)
            }, 1000)
        } else if (timeLeft === 0) {
            // Switch mode
            const nextMode = mode === 'work' ? 'break' : 'work'
            setMode(nextMode)
            setIsActive(false)
            // Optional: Add notification sound here
            alert(`Time for a ${nextMode}!`)
        } else {
            clearInterval(interval)
        }
        return () => clearInterval(interval)
    }, [isActive, timeLeft, mode])

    const toggleTimer = () => setIsActive(!isActive)
    const resetTimer = () => {
        setIsActive(false)
        const duration = mode === 'work'
            ? (preferences?.pomodoro_work_duration || 25)
            : (preferences?.pomodoro_break_duration || 5)
        setTimeLeft(duration * 60)
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }

    return (
        <div className={`pomodoro-widget mode-${mode} ${isActive ? 'active' : ''}`}>
            <h3>🍅 Pomodoro</h3>

            <div className="pomodoro-display">
                <div className="mode-badge">{mode === 'work' ? 'Focus Time' : 'Short Break'}</div>
                <div className="timer-value">{formatTime(timeLeft)}</div>
            </div>

            <div className="pomodoro-controls">
                <button onClick={toggleTimer} className={`btn-pomodoro ${isActive ? 'btn-pause' : 'btn-start'}`}>
                    {isActive ? '⏸️ Pause' : '▶️ Start'}
                </button>
                <button onClick={resetTimer} className="btn-pomodoro btn-reset">
                    🔄 Reset
                </button>
            </div>

            <div className="cycle-indicator">
                {mode === 'work' ? 'Stay focused!' : 'Relax a bit.'}
            </div>
        </div>
    )
}

export default Pomodoro
