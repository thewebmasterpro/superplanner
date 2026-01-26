import { useState, useEffect, useRef } from 'react'
import './Calendar.css'

function WeekView({ currentDate, tasks, prayerTimes, onTaskUpdate, onTaskEdit }) {
    const hours = Array.from({ length: 24 }, (_, i) => i) // Full 24h view
    const [draggedTask, setDraggedTask] = useState(null)
    const scrollContainerRef = useRef(null)

    // Scroll to 07:00 on mount
    useEffect(() => {
        setTimeout(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 7 * 60 // 60px per hour
            }
        }, 100)
    }, [])

    const getWeekDays = () => {
        const weekStart = getWeekStart(currentDate)
        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(weekStart)
            day.setDate(day.getDate() + i)
            return day
        })
    }

    const getWeekStart = (date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        return new Date(d.setDate(diff))
    }

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
        if (!prayerTimes) return []
        return [
            { name: 'Fajr', time: prayerTimes.fajr, icon: '🌅' },
            { name: 'Dhuhr', time: prayerTimes.dhuhr, icon: '☀️' },
            { name: 'Asr', time: prayerTimes.asr, icon: '⛅' },
            { name: 'Maghrib', time: prayerTimes.maghrib, icon: '🌇' },
            { name: 'Isha', time: prayerTimes.isha, icon: '🌙' }
        ]
    }

    const getTimePosition = (timeStr) => {
        if (!timeStr) return 0
        const [h, m] = timeStr.split(':').map(Number)
        return h * 60 + m // 1px per minute
    }

    const getDateTimePosition = (dateIso) => {
        const date = new Date(dateIso)
        return date.getHours() * 60 + date.getMinutes()
    }

    const handleDragStart = (e, task) => {
        setDraggedTask(task)
        e.dataTransfer.effectAllowed = 'move'
        // Create a transparent image to avoid default drag ghosting issues if needed
        // but standard is usually fine.
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        e.currentTarget.classList.add('drag-over')
    }

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over')
    }

    const handleDrop = (e, day) => {
        e.preventDefault()
        e.currentTarget.classList.remove('drag-over')

        if (!draggedTask) return

        const rect = e.currentTarget.querySelector('.day-content').getBoundingClientRect()
        const y = e.clientY - rect.top

        // Snap to 30 minutes (1px = 1min)
        let totalMinutes = Math.round(y / 30) * 30

        // Clamp between 0 and 23:30
        totalMinutes = Math.max(0, Math.min(totalMinutes, 23 * 60 + 30))

        const hour = Math.floor(totalMinutes / 60)
        const minute = totalMinutes % 60

        const newScheduledTime = new Date(day)
        newScheduledTime.setHours(hour, minute, 0, 0)

        onTaskUpdate(draggedTask.id, {
            scheduled_time: newScheduledTime.toISOString()
        })

        setDraggedTask(null)
    }

    const weekDays = getWeekDays()
    const today = new Date().toDateString()

    return (
        <div className="week-view" ref={scrollContainerRef}>
            <div className="week-grid">
                {/* Time column */}
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

                {/* Day columns */}
                {weekDays.map((day, dayIndex) => {
                    const isToday = day.toDateString() === today
                    const prayersForDay = getPrayersForDay(day)
                    const tasksForDay = getTasksForDay(day)

                    return (
                        <div
                            key={dayIndex}
                            className="day-column"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, day)}
                        >
                            <div className={`day-header ${isToday ? 'today' : ''}`}>
                                <div className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                <div className="day-number">{day.getDate()}</div>
                            </div>

                            <div className="day-content">
                                {/* Grid Lines */}
                                {hours.map(h => (
                                    <div key={h} className="grid-hour-line">
                                        <div className="grid-half-line"></div>
                                    </div>
                                ))}

                                {/* Prayer blocks */}
                                {prayersForDay.map(prayer => (
                                    <div
                                        key={prayer.name}
                                        className="prayer-block-fixed"
                                        style={{
                                            top: `${getTimePosition(prayer.time)}px`,
                                            height: '20px' // Slim fixed height for prayer calls
                                        }}
                                    >
                                        <span className="prayer-icon-cal">{prayer.icon}</span>
                                        <span className="prayer-name-cal">{prayer.name}</span>
                                        <span className="prayer-time-cal">{prayer.time}</span>
                                    </div>
                                ))}

                                {/* Task blocks */}
                                {tasksForDay.map(task => {
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
                                                {height >= 30 && (
                                                    <div className="task-block-time">{task.duration}m</div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default WeekView
