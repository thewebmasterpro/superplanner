import './Calendar.css'

function WeekView({ currentDate, tasks, prayerTimes, onTaskUpdate }) {
    const hours = Array.from({ length: 15 }, (_, i) => i + 7) // 7h to 21h

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

    const getTasksForSlot = (day, hour) => {
        return tasks.filter(task => {
            if (!task.scheduled_time) return false
            const taskDate = new Date(task.scheduled_time)
            return taskDate.getDate() === day.getDate() &&
                taskDate.getMonth() === day.getMonth() &&
                taskDate.getFullYear() === day.getFullYear() &&
                taskDate.getHours() === hour
        })
    }

    const getPrayersForDay = (day) => {
        if (!prayerTimes) return []

        const prayers = [
            { name: 'Fajr', time: prayerTimes.fajr },
            { name: 'Dhuhr', time: prayerTimes.dhuhr },
            { name: 'Asr', time: prayerTimes.asr },
            { name: 'Maghrib', time: prayerTimes.maghrib },
            { name: 'Isha', time: prayerTimes.isha }
        ]

        return prayers.map(prayer => ({
            ...prayer,
            hour: parseInt(prayer.time.split(':')[0])
        })).filter(prayer => prayer.hour >= 7 && prayer.hour <= 21)
    }

    const weekDays = getWeekDays()
    const today = new Date()

    return (
        <div className="week-view">
            <div className="week-grid">
                {/* Time column */}
                <div className="time-column">
                    <div className="time-header"></div>
                    {hours.map(hour => (
                        <div key={hour} className="time-slot">
                            {hour}:00
                        </div>
                    ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day, dayIndex) => {
                    const isToday = day.toDateString() === today.toDateString()
                    const prayersForDay = getPrayersForDay(day)

                    return (
                        <div key={dayIndex} className="day-column">
                            <div className={`day-header ${isToday ? 'today' : ''}`}>
                                <div className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                <div className="day-number">{day.getDate()}</div>
                            </div>

                            {hours.map(hour => {
                                const tasksInSlot = getTasksForSlot(day, hour)
                                const prayerInSlot = prayersForDay.find(p => p.hour === hour)

                                return (
                                    <div key={hour} className="hour-slot">
                                        {/* Prayer blocks */}
                                        {prayerInSlot && (
                                            <div className="event-block prayer-block">
                                                🕌 {prayerInSlot.name}
                                            </div>
                                        )}

                                        {/* Task blocks */}
                                        {tasksInSlot.map(task => {
                                            const heightPercent = Math.min((task.duration / 60) * 100, 100)
                                            return (
                                                <div
                                                    key={task.id}
                                                    className={`event-block task-block status-${task.status}`}
                                                    style={{ height: `${heightPercent}%` }}
                                                    title={task.description || task.title}
                                                >
                                                    <div className="task-block-title">{task.title}</div>
                                                    <div className="task-block-time">{task.duration}min</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default WeekView
