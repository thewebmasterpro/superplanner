import { useState, useEffect } from 'react'
import { cn } from '../lib/utils'
import { Clock, Hourglass } from 'lucide-react'

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
        return date.toLocaleTimeString('fr-FR', {
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
        // Handle overflow for next day logic simply by assuming same day for "near" check 
        // or complex logic. Basic check: 
        const diff = nextPrayer.prayerMinutes - currentMinutes
        return diff <= 15 && diff > 0
    }

    if (!prayerTimes) {
        return (
            <div className="rounded-xl border bg-card p-6 shadow-sm h-full flex flex-col justify-center items-center text-center">
                <Clock className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Configurez les horaires dans les paramètres</p>
            </div>
        )
    }

    const near = isNearPrayer()

    return (
        <div className={cn(
            "rounded-xl border shadow-sm p-6 h-full flex flex-col transition-all duration-500",
            near ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" : "bg-card"
        )}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="flex items-center gap-2 font-semibold text-lg text-card-foreground">
                    <Clock className={cn("h-5 w-5", near ? "text-red-500" : "text-primary")} />
                    Prochaine Prière
                </h3>
                {near && <span className="animate-pulse px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">Imminent</span>}
            </div>

            <div className="flex-1 flex flex-col justify-center">
                <div className="text-center mb-6">
                    <div className="text-sm text-muted-foreground mb-1">Heure Actuelle</div>
                    <div className="text-4xl font-mono font-bold tracking-tight text-foreground">
                        {formatTime(currentTime)}
                    </div>
                </div>

                {nextPrayer && (
                    <div className={cn(
                        "rounded-lg p-4 flex items-center justify-between",
                        near ? "bg-red-100 dark:bg-red-900/30" : "bg-muted/50"
                    )}>
                        <div className="flex flex-col items-start">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                {nextPrayer.tomorrow ? "Demain" : "Dans"} <Hourglass className="h-3 w-3" />
                            </span>
                            <span className="text-2xl font-bold font-mono text-primary">
                                {countdown}
                            </span>
                        </div>
                        <div className="text-right">
                            <div className="font-semibold text-lg">{nextPrayer.name}</div>
                            <div className="text-sm text-muted-foreground">{nextPrayer.time}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PrayerCountdown
