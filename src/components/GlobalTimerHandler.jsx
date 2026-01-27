import { useEffect } from 'react'
import { useTimerStore } from '../stores/timerStore'

export function GlobalTimerHandler() {
    const {
        pomodoro,
        taskTimer,
        tickPomodoro,
        tickTaskTimer
    } = useTimerStore()

    // Handle Pomodoro Ticking
    useEffect(() => {
        let interval = null
        if (pomodoro.isActive) {
            interval = setInterval(() => {
                tickPomodoro()
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [pomodoro.isActive, tickPomodoro])

    // Handle Task Timer Ticking
    useEffect(() => {
        let interval = null
        if (taskTimer.isRunning) {
            interval = setInterval(() => {
                tickTaskTimer()
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [taskTimer.isRunning, tickTaskTimer])

    return null // Headless component
}
