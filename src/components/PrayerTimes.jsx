import { useState, useEffect } from 'react'
import pb from '../lib/pocketbase'
import { cn } from '../lib/utils'
import { Sunrise, Sun, Sunset, Moon, CloudSun } from 'lucide-react'
import { fetchPrayerTimesByCity } from '../services/prayerTimesApi'
import { settingsService } from '../services/settings.service'

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

            let data = null

            // 1. Try to fetch from DB
            try {
                const records = await pb.collection('prayer_schedule').getList(1, 1, {
                    filter: `date ~ "${today}"`,
                    requestKey: 'prayer-times-dashboard'
                })
                if (records.items.length > 0) {
                    data = records.items[0]
                }
            } catch (dbError) {
                // Ignore collection missing errors or aborts
                if (dbError.status !== 404 && !dbError.isAbort) {
                    console.warn('DB Fetch failed, falling back to API', dbError.message)
                }
            }

            // 2. Fallback to API if no data in DB
            if (!data) {
                try {
                    const prefs = await settingsService.getPreferences()

                    // Parse prayerLocation JSON if it exists
                    let city = 'Paris'
                    let country = 'France'

                    if (prefs?.prayerLocation) {
                        const loc = typeof prefs.prayerLocation === 'string' ? JSON.parse(prefs.prayerLocation) : prefs.prayerLocation
                        if (loc.city) city = loc.city
                        if (loc.country) country = loc.country
                    }

                    const apiData = await fetchPrayerTimesByCity(city, country)
                    data = apiData

                    // 3. Save to DB for caching (Background)
                    try {
                        const payload = {
                            date: today,
                            user_id: pb.authStore.model?.id,
                            ...apiData
                        }
                        // Check if collection exists before creating
                        await pb.collection('prayer_schedule').create(payload)
                    } catch (saveError) {
                        // Silent fail for cache
                    }
                } catch (apiError) {
                    if (!apiError.isAbort) {
                        console.error('API Fetch failed:', apiError)
                        setError('Impossible de charger les horaires')
                    }
                    return
                }
            }

            setPrayerTimes(data)
        } catch (err) {
            if (err.isAbort) return // Ignore auto-cancellations
            console.error('Error loading prayer times:', err)
            setError('Erreur de chargement')
        } finally {
            setLoading(false)
        }
    }

    const [nextPrayerName, setNextPrayerName] = useState(null)
    const [timeRemaining, setTimeRemaining] = useState('')

    useEffect(() => {
        if (!prayerTimes) return

        const timer = setInterval(() => {
            updateCountdown()
        }, 1000)

        updateCountdown()

        return () => clearInterval(timer)
    }, [prayerTimes])

    const updateCountdown = () => {
        if (!prayerTimes) return

        const now = new Date()
        const currentTime = now.getHours() * 60 + now.getMinutes()
        const currentSeconds = now.getSeconds()

        const prayers = [
            { name: 'Fajr', time: prayerTimes.fajr },
            { name: 'Dhuhr', time: prayerTimes.dhuhr },
            { name: 'Asr', time: prayerTimes.asr },
            { name: 'Maghrib', time: prayerTimes.maghrib },
            { name: 'Isha', time: prayerTimes.isha }
        ]

        let next = null
        let nextTimeMinutes = 0

        for (let i = 0; i < prayers.length; i++) {
            const [h, m] = prayers[i].time.split(':').map(Number)
            const pMinutes = h * 60 + m
            if (currentTime < pMinutes) {
                next = prayers[i].name
                nextTimeMinutes = pMinutes
                break
            }
        }

        // If no next prayer today, it's Fajr tomorrow
        if (!next) {
            next = 'Fajr'
            // Add 24 hours to the next day's Fajr (using today's Fajr time as proxy for simplicity or fetch tmrw)
            // Ideally we fetch tomorrow's time. For now, let's assume same time + 24h
            const [h, m] = prayers[0].time.split(':').map(Number)
            nextTimeMinutes = (h + 24) * 60 + m
        }

        setNextPrayerName(next)

        // Calculate diff
        const diffMinutes = nextTimeMinutes - currentTime - 1 // -1 because we are in the current minute
        const diffSeconds = 60 - currentSeconds

        let totalSeconds = diffMinutes * 60 + diffSeconds
        if (totalSeconds < 0) totalSeconds = 0

        const h = Math.floor(totalSeconds / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const s = totalSeconds % 60

        setTimeRemaining(`${h}h ${m}m ${s}s`)
    }

    const formatTime = (time) => {
        if (!time) return '--:--'
        const [hours, minutes] = time.split(':')
        return `${hours}:${minutes}`
    }

    if (loading) return (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-semibold text-lg text-card-foreground">
                <Sunrise className="h-5 w-5 text-primary" /> Horaires de Prières
            </h3>
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">Chargement...</p>
        </div>
    )

    if (error || !prayerTimes) return (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-semibold text-lg text-card-foreground">
                <Sunrise className="h-5 w-5 text-primary" /> Horaires de Prières
            </h3>
            <p className="mt-4 text-sm text-muted-foreground">{error || 'Aucune donnée disponible pour aujourd\'hui'}</p>
        </div>
    )

    const prayers = [
        { key: 'Fajr', label: 'Fajr', time: prayerTimes.fajr, icon: Sunrise },
        { key: 'Dhuhr', label: 'Dhuhr', time: prayerTimes.dhuhr, icon: Sun },
        { key: 'Asr', label: 'Asr', time: prayerTimes.asr, icon: CloudSun },
        { key: 'Maghrib', label: 'Maghrib', time: prayerTimes.maghrib, icon: Sunset },
        { key: 'Isha', label: 'Isha', time: prayerTimes.isha, icon: Moon }
    ]

    return (
        <div className="rounded-xl border bg-card shadow-sm h-full flex flex-col">
            <div className="p-6 pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="flex items-center gap-2 font-semibold text-lg text-card-foreground">
                            <Sunrise className="h-5 w-5 text-primary" />
                            Horaires de Prières
                        </h3>
                        <div className="mt-1 flex flex-col gap-0.5">
                            <p className="text-xs text-muted-foreground capitalize">
                                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            {prayerTimes?.hijri && (
                                <p className="text-xs text-muted-foreground/80 font-medium">
                                    {prayerTimes.hijri.day} {prayerTimes.hijri.month} {prayerTimes.hijri.year}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                {timeRemaining && nextPrayerName && (
                    <div className="mt-4 mb-2 p-3 bg-primary/5 rounded-lg border border-primary/10 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Prochaine prière : <span className="font-medium text-primary">{nextPrayerName}</span></p>
                        <p className="text-2xl font-bold font-mono text-primary tracking-wider">{timeRemaining}</p>
                    </div>
                )}
            </div>

            <div className="p-6 pt-2 space-y-2 flex-1">
                {prayers.map((prayer) => {
                    const isNext = nextPrayerName === prayer.key
                    const Icon = prayer.icon

                    return (
                        <div
                            key={prayer.key}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-lg transition-all",
                                isNext
                                    ? "bg-primary/10 border-l-4 border-primary text-primary font-medium"
                                    : "hover:bg-muted/50 text-muted-foreground"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={cn("h-4 w-4", isNext ? "text-primary" : "text-muted-foreground")} />
                                <span>{prayer.label}</span>
                            </div>
                            <span className="font-mono text-sm">{formatTime(prayer.time)}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default PrayerTimes
