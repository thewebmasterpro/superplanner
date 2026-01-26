import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './PrayerTimes.css'

function PrayerTimes() {
    const [prayerTimes, setPrayerTimes] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadPrayerTimes()
    }, [])

    const loadPrayerTimes = async () => {
        try {
            const today = new Date().toISOString().split('T')[0]

            const { data, error } = await supabase
                .from('prayer_schedule')
                .select('*')
                .eq('date', today)
                .single()

            if (error) throw error
            setPrayerTimes(data)
        } catch (err) {
            console.error('Error loading prayer times:', err)
            setError('Could not load prayer times')
        } finally {
            setLoading(false)
        }
    }

    const getCurrentPrayer = () => {
        if (!prayerTimes) return null

        const now = new Date()
        const currentTime = now.getHours() * 60 + now.getMinutes()

        const prayers = [
            { name: 'Fajr', time: prayerTimes.fajr },
            { name: 'Dhuhr', time: prayerTimes.dhuhr },
            { name: 'Asr', time: prayerTimes.asr },
            { name: 'Maghrib', time: prayerTimes.maghrib },
            { name: 'Isha', time: prayerTimes.isha }
        ]

        for (let i = 0; i < prayers.length; i++) {
            const [hours, minutes] = prayers[i].time.split(':').map(Number)
            const prayerMinutes = hours * 60 + minutes

            if (currentTime < prayerMinutes) {
                return prayers[i].name
            }
        }

        return 'Fajr' // After Isha, next is Fajr
    }

    const formatTime = (time) => {
        if (!time) return ''
        const [hours, minutes] = time.split(':')
        return `${hours}:${minutes}`
    }

    if (loading) {
        return (
            <div className="prayer-times">
                <h3>🕌 Prayer Times</h3>
                <p className="loading-text">Loading...</p>
            </div>
        )
    }

    if (error || !prayerTimes) {
        return (
            <div className="prayer-times">
                <h3>🕌 Prayer Times</h3>
                <p className="error-text">{error || 'No data available'}</p>
            </div>
        )
    }

    const nextPrayer = getCurrentPrayer()

    return (
        <div className="prayer-times">
            <h3>🕌 Prayer Times</h3>
            <p className="prayer-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <div className="prayer-list">
                <div className={`prayer-item ${nextPrayer === 'Fajr' ? 'next-prayer' : ''}`}>
                    <span className="prayer-icon">🌅</span>
                    <span className="prayer-name">Fajr</span>
                    <span className="prayer-time">{formatTime(prayerTimes.fajr)}</span>
                </div>

                <div className={`prayer-item ${nextPrayer === 'Dhuhr' ? 'next-prayer' : ''}`}>
                    <span className="prayer-icon">☀️</span>
                    <span className="prayer-name">Dhuhr</span>
                    <span className="prayer-time">{formatTime(prayerTimes.dhuhr)}</span>
                </div>

                <div className={`prayer-item ${nextPrayer === 'Asr' ? 'next-prayer' : ''}`}>
                    <span className="prayer-icon">🌤️</span>
                    <span className="prayer-name">Asr</span>
                    <span className="prayer-time">{formatTime(prayerTimes.asr)}</span>
                </div>

                <div className={`prayer-item ${nextPrayer === 'Maghrib' ? 'next-prayer' : ''}`}>
                    <span className="prayer-icon">🌇</span>
                    <span className="prayer-name">Maghrib</span>
                    <span className="prayer-time">{formatTime(prayerTimes.maghrib)}</span>
                </div>

                <div className={`prayer-item ${nextPrayer === 'Isha' ? 'next-prayer' : ''}`}>
                    <span className="prayer-icon">🌙</span>
                    <span className="prayer-name">Isha</span>
                    <span className="prayer-time">{formatTime(prayerTimes.isha)}</span>
                </div>
            </div>
        </div>
    )
}

export default PrayerTimes
