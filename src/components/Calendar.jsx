import { useState } from 'react'
import DayView from './DayView'
import WeekView from './WeekView'
import MonthView from './MonthView'
import './Calendar.css'

function Calendar({ tasks, prayerSchedule, onTaskUpdate, onTaskEdit }) {
    const [view, setView] = useState('week') // 'day', 'week', or 'month'
    const [currentDate, setCurrentDate] = useState(new Date())

    const goToPrevious = () => {
        const newDate = new Date(currentDate)
        if (view === 'day') {
            newDate.setDate(newDate.getDate() - 1)
        } else if (view === 'week') {
            newDate.setDate(newDate.getDate() - 7)
        } else {
            newDate.setMonth(newDate.getMonth() - 1)
        }
        setCurrentDate(newDate)
    }

    const goToNext = () => {
        const newDate = new Date(currentDate)
        if (view === 'day') {
            newDate.setDate(newDate.getDate() + 1)
        } else if (view === 'week') {
            newDate.setDate(newDate.getDate() + 7)
        } else {
            newDate.setMonth(newDate.getMonth() + 1)
        }
        setCurrentDate(newDate)
    }

    const goToToday = () => {
        setCurrentDate(new Date())
        setView('day')
    }

    const getDateRangeText = () => {
        if (view === 'day') {
            return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        } else if (view === 'week') {
            const weekStart = getWeekStart(currentDate)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6)
            return `${weekStart.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })}`
        } else {
            return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        }
    }

    const getWeekStart = (date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
        return new Date(d.setDate(diff))
    }

    const getNavLabels = () => {
        if (view === 'day') return { prev: 'Jour préc.', next: 'Jour suiv.' }
        if (view === 'week') return { prev: 'Semaine préc.', next: 'Semaine suiv.' }
        return { prev: 'Mois préc.', next: 'Mois suiv.' }
    }

    const labels = getNavLabels()

    return (
        <div className="calendar">
            <div className="calendar-header">
                <div className="calendar-nav">
                    <button onClick={goToPrevious} className="btn-nav">
                        <span className="nav-arrow">‹</span>
                        <span className="nav-label">{labels.prev}</span>
                    </button>
                    <h2 className="calendar-title">{getDateRangeText()}</h2>
                    <button onClick={goToNext} className="btn-nav">
                        <span className="nav-label">{labels.next}</span>
                        <span className="nav-arrow">›</span>
                    </button>
                </div>
                <div className="calendar-controls">
                    <button onClick={goToToday} className="btn-today">Aujourd'hui</button>
                    <div className="view-switcher">
                        <button
                            className={`btn-view ${view === 'day' ? 'active' : ''}`}
                            onClick={() => setView('day')}
                        >
                            Jour
                        </button>
                        <button
                            className={`btn-view ${view === 'week' ? 'active' : ''}`}
                            onClick={() => setView('week')}
                        >
                            Semaine
                        </button>
                        <button
                            className={`btn-view ${view === 'month' ? 'active' : ''}`}
                            onClick={() => setView('month')}
                        >
                            Mois
                        </button>
                    </div>
                </div>
            </div>

            <div className="calendar-body">
                {view === 'day' && (
                    <DayView
                        currentDate={currentDate}
                        tasks={tasks}
                        prayerSchedule={prayerSchedule}
                        onTaskUpdate={onTaskUpdate}
                        onTaskEdit={onTaskEdit}
                    />
                )}
                {view === 'week' && (
                    <WeekView
                        currentDate={currentDate}
                        tasks={tasks}
                        prayerSchedule={prayerSchedule}
                        onTaskUpdate={onTaskUpdate}
                        onTaskEdit={onTaskEdit}
                    />
                )}
                {view === 'month' && (
                    <MonthView
                        currentDate={currentDate}
                        tasks={tasks}
                        onTaskEdit={onTaskEdit}
                    />
                )}
            </div>
        </div>
    )
}

export default Calendar
