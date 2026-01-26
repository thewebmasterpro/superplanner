import './Calendar.css'

function MonthView({ currentDate, tasks, onTaskEdit }) {
    const getMonthDays = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()

        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        const firstDayOfWeek = (firstDay.getDay() + 6) % 7 // Adjust to start Monday
        const daysInMonth = lastDay.getDate()

        const days = []

        // Add previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate()
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month, -i),
                isCurrentMonth: false
            })
        }

        // Add current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            })
        }

        // Add next month days to complete the grid
        const remainingDays = 42 - days.length // 6 weeks * 7 days
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            })
        }

        return days
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

    const monthDays = getMonthDays()
    const today = new Date().toDateString()

    return (
        <div className="month-view">
            <div className="month-grid">
                {/* Weekday headers */}
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="weekday-header">{day}</div>
                ))}

                {/* Day cells */}
                {monthDays.map((day, index) => {
                    const isToday = day.date.toDateString() === today
                    const dayTasks = getTasksForDay(day.date)
                    const visibleTasks = dayTasks.slice(0, 3)
                    const moreTasks = dayTasks.length - 3

                    return (
                        <div
                            key={index}
                            className={`month-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                        >
                            <div className="month-day-number">{day.date.getDate()}</div>
                            <div className="month-day-tasks">
                                {visibleTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className={`month-task status-${task.status}`}
                                        title={`${task.title} - ${task.duration}min`}
                                        onClick={() => onTaskEdit && onTaskEdit(task)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {task.title}
                                    </div>
                                ))}
                                {moreTasks > 0 && (
                                    <div className="month-task-more">+{moreTasks} de plus</div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default MonthView
