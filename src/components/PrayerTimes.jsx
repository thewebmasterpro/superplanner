import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { Sunrise, Sun, Sunset, Moon, CloudSun } from 'lucide-react'

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

            if (currentTime < prayerMinutes) return prayers[i].name
        }
        return 'Fajr'
    }

    const formatTime = (time) => {
        if (!time) return ''
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
            <p className="mt-4 text-sm text-destructive">{error || 'Aucune donnée disponible'}</p>
        </div>
    )

    const nextPrayer = getCurrentPrayer()
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
                <h3 className="flex items-center gap-2 font-semibold text-lg text-card-foreground">
                    <Sunrise className="h-5 w-5 text-primary" />
                    Horaires de Prières
                </h3>
                <p className="text-xs text-muted-foreground capitalize mt-1">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </div>

            <div className="p-6 pt-2 space-y-2 flex-1">
                {prayers.map((prayer) => {
                    const isNext = nextPrayer === prayer.key
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
