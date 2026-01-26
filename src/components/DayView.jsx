import { useState, useEffect, useRef } from 'react'
import './Calendar.css'

function DayView({ currentDate, tasks, prayerSchedule, onTaskUpdate, onTaskEdit }) {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const [draggedTask, setDraggedTask] = useState(null)
    const scrollContainerRef = useRef(null)

    useEffect(() => {
        setTimeout(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 6 * 60
            }
        }, 100)
    }, [])

    const getTasksForDay = (day) => {
        return tasks.filter(task => {
            if (!task.scheduled_time) return false
            const taskDate = new Date(task.scheduled_time)
            return taskDate.getDate() === day.getDate() &&
                taskDate.getMonth() === day.getMonth() &&
                taskDate.getFullYear() === day.getFullYear()
        })
    }

    const getPrayersForDay = (day) => {
        if (!prayerSchedule || prayerSchedule.length === 0) return []
        const dayStr = day.toISOString().split('T')[0]
        const prayers = prayerSchedule.find(p => p.date === dayStr)
        if (!prayers) return []
        return [
            { name: 'Fajr', time: prayers.fajr, icon: '🌅' },
            { name: 'Dhuhr', time: prayers.dhuhr, icon: '☀️' },
            { name: 'Asr', time: prayers.asr, icon: '⛅' },
            { name: 'Maghrib', time: prayers.maghrib, icon: '🌇' },
            { name: 'Isha', time: prayers.isha, icon: '🌙' }
        ]
    }

    const getTimePosition = (timeStr) => {
        if (!timeStr) return 0
        const [h, m] = timeStr.split(':').map(Number)
        return h * 60 + m
    }

    const getDateTimePosition = (dateIso) => {
        const date = new Date(dateIso)
        return date.getHours() * 60 + date.getMinutes()
    }

    const handleDragStart = (e, task) => {
        setDraggedTask(task)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e) => {
        e.preventDefault()
        if (!draggedTask) return

        const rect = e.currentTarget.querySelector('.day-content').getBoundingClientRect()
        const y = e.clientY - rect.top

        let totalMinutes = Math.round(y / 30) * 30
        totalMinutes = Math.max(0, Math.min(totalMinutes, 23 * 60 + 30))

        const hour = Math.floor(totalMinutes / 60)
        const minute = totalMinutes % 60

        const newScheduledTime = new Date(currentDate)
        newScheduledTime.setHours(hour, minute, 0, 0)

        onTaskUpdate(draggedTask.id, {
            scheduled_time: newScheduledTime.toISOString()
        })
        setDraggedTask(null)
    }

    const prayersForToday = getPrayersForDay(currentDate)
    const tasksForToday = getTasksForDay(currentDate)
    const today = new Date().toDateString()
    const isToday = currentDate.toDateString() === today

    return (
        <div className="day-view" ref={scrollContainerRef}>
            <div className="day-view-grid">
                <div className="time-column">
                    <div className="time-header"></div>
                    {hours.map(hour => (
                        <div key={hour} className="time-slot-hour">
                            <span className="time-label">{String(hour).padStart(2, '0')}:00</span>
                            <div className="time-slot-halves">
                                <div className="half-line"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="day-column single-day" onDragOver={handleDragOver} onDrop={handleDrop}>
                    <div className={`day-header ${isToday ? 'today' : ''}`}>
                        <div className="day-name">{currentDate.toLocaleDateString('fr-FR', { weekday: 'long' })}</div>
                        <div className="day-number">{currentDate.getDate()} {currentDate.toLocaleDateString('fr-FR', { month: 'long' })}</div>
                    </div>

                    <div className="day-content">
                        {hours.map(h => (
                            <div key={h} className="grid-hour-line">
                                <div className="grid-half-line"></div>
                            </div>
                        ))}

                        {prayersForToday.map(prayer => (
                            <div
                                key={prayer.name}
                                className="prayer-block-fixed"
                                style={{ top: `${getTimePosition(prayer.time)}px`, height: '24px' }}
                            >
                                <span className="prayer-icon-cal">{prayer.icon}</span>
                                <span className="prayer-name-cal">{prayer.name}</span>
                                <span className="prayer-time-cal">{prayer.time}</span>
                            </div>
                        ))}

                        {tasksForToday.map(task => {
                            const top = getDateTimePosition(task.scheduled_time)
                            const height = task.duration || 60
                            return (
                                <div
                                    key={task.id}
                                    className={`calendar-task-block status-${task.status} ${draggedTask?.id === task.id ? 'dragging' : ''}`}
                                    style={{
                                        top: `${top}px`,
                                        height: `${height}px`,
                                        zIndex: draggedTask?.id === task.id ? 10 : 1
                                    }}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task)}
                                    onClick={() => onTaskEdit && onTaskEdit(task)}
                                >
                                    <div className="task-block-inner">
                                        <div className="task-block-title">{task.title}</div>
                                        {height >= 30 && <div className="task-block-time">{task.duration}m</div>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DayView
