import { useState, useEffect } from 'react'
import './PrayerCountdown.css'

function PrayerCountdown({ prayerTimes }) {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [nextPrayer, setNextPrayer] = useState(null)
    const [countdown, setCountdown] = useState('')

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        if (!prayerTimes) return

        const calculateNextPrayer = () => {
            const now = new Date()
            const currentMinutes = now.getHours() * 60 + now.getMinutes()

            const prayers = [
                { name: 'Fajr', time: prayerTimes.fajr },
                { name: 'Dhuhr', time: prayerTimes.dhuhr },
                { name: 'Asr', time: prayerTimes.asr },
                { name: 'Maghrib', time: prayerTimes.maghrib },
                { name: 'Isha', time: prayerTimes.isha }
            ]

            for (let prayer of prayers) {
                const [h, m] = prayer.time.split(':')
                const prayerMinutes = parseInt(h) * 60 + parseInt(m)

                if (prayerMinutes > currentMinutes) {
                    const diff = prayerMinutes - currentMinutes
                    const hours = Math.floor(diff / 60)
                    const minutes = diff % 60

                    setNextPrayer({ ...prayer, prayerMinutes })
                    setCountdown(`${hours}h ${minutes}m`)
                    return
                }
            }

            // If no prayer left today, next is tomorrow's Fajr
            const [h, m] = prayers[0].time.split(':')
            const prayerMinutes = parseInt(h) * 60 + parseInt(m)
            const diff = (24 * 60 - currentMinutes) + prayerMinutes
            const hours = Math.floor(diff / 60)
            const minutes = diff % 60

            setNextPrayer({ ...prayers[0], prayerMinutes, tomorrow: true })
            setCountdown(`${hours}h ${minutes}m`)
        }

        calculateNextPrayer()
    }, [currentTime, prayerTimes])

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const isNearPrayer = () => {
        if (!nextPrayer) return false
        const now = new Date()
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        const diff = nextPrayer.prayerMinutes - currentMinutes
        return diff <= 15 && diff > 0
    }

    if (!prayerTimes) {
        return (
            <div className="prayer-countdown-widget">
                <h3>⏱️ Prières</h3>
                <p className="no-data">Configure prayer times in Settings</p>
            </div>
        )
    }

    return (
        <div className={`prayer-countdown-widget ${isNearPrayer() ? 'near-prayer' : ''}`}>
            <h3>⏱️ Prières</h3>

            <div className="current-time">
                <div className="prayer-time-label">Heure Actuelle</div>
                <div className="time-display">{formatTime(currentTime)}</div>
            </div>

            {nextPrayer && (
                <div className="next-prayer">
                    <div className="prayer-info">
                        <span className="prayer-label">Prochaine prière :</span>
                        <span className="prayer-name">{nextPrayer.name}</span>
                        {nextPrayer.tomorrow && <span className="tomorrow-badge">Demain</span>}
                    </div>
                    <div className="prayer-time">{nextPrayer.time}</div>
                    <div className="countdown-display">
                        <span className="countdown-icon">⏳</span>
                        <span className="countdown-text">{countdown}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PrayerCountdown
