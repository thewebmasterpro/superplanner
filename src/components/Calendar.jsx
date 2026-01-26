import { useState } from 'react'
import WeekView from './WeekView'
import MonthView from './MonthView'
import './Calendar.css'

function Calendar({ tasks, prayerTimes, onTaskUpdate }) {
    const [view, setView] = useState('week') // 'week' or 'month'
    const [currentDate, setCurrentDate] = useState(new Date())

    const goToPrevious = () => {
        const newDate = new Date(currentDate)
        if (view === 'week') {
            newDate.setDate(newDate.getDate() - 7)
        } else {
            newDate.setMonth(newDate.getMonth() - 1)
        }
        setCurrentDate(newDate)
    }

    const goToNext = () => {
        const newDate = new Date(currentDate)
        if (view === 'week') {
            newDate.setDate(newDate.getDate() + 7)
        } else {
            newDate.setMonth(newDate.getMonth() + 1)
        }
        setCurrentDate(newDate)
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    const getDateRangeText = () => {
        if (view === 'week') {
            const weekStart = getWeekStart(currentDate)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6)
            return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        } else {
            return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        }
    }

    const getWeekStart = (date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
        return new Date(d.setDate(diff))
    }

    return (
        <div className="calendar">
            <div className="calendar-header">
                <div className="calendar-nav">
                    <button onClick={goToPrevious} className="btn-nav">‹</button>
                    <h2 className="calendar-title">{getDateRangeText()}</h2>
                    <button onClick={goToNext} className="btn-nav">›</button>
                </div>
                <div className="calendar-controls">
                    <button onClick={goToToday} className="btn-today">Today</button>
                    <div className="view-switcher">
                        <button
                            className={`btn-view ${view === 'week' ? 'active' : ''}`}
                            onClick={() => setView('week')}
                        >
                            Week
                        </button>
                        <button
                            className={`btn-view ${view === 'month' ? 'active' : ''}`}
                            onClick={() => setView('month')}
                        >
                            Month
                        </button>
                    </div>
                </div>
            </div>

            <div className="calendar-body">
                {view === 'week' ? (
                    <WeekView
                        currentDate={currentDate}
                        tasks={tasks}
                        prayerTimes={prayerTimes}
                        onTaskUpdate={onTaskUpdate}
                    />
                ) : (
                    <MonthView
                        currentDate={currentDate}
                        tasks={tasks}
                        onTaskUpdate={onTaskUpdate}
                    />
                )}
            </div>
        </div>
    )
}

export default Calendar
