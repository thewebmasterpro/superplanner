import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe } from 'lucide-react'
import { useUserStore } from '../stores/userStore'

const DEFAULT_CITIES = [
    { city: 'New York', timezone: 'America/New_York' },
    { city: 'London', timezone: 'Europe/London' },
    { city: 'Tokyo', timezone: 'Asia/Tokyo' }
]

export function WorldClockWidget() {
    const { preferences } = useUserStore()
    const [time, setTime] = useState(new Date())
    const [cities, setCities] = useState(DEFAULT_CITIES)

    // Sync cities with preferences
    useEffect(() => {
        if (preferences?.world_clock_cities && Array.isArray(preferences.world_clock_cities)) {
            // Filter out nulls/undefined slots from the array
            const validCities = preferences.world_clock_cities.filter(c => c && c.city && c.timezone)
            if (validCities.length > 0) {
                setCities(validCities)
            }
        }
    }, [preferences?.world_clock_cities])

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const formatTime = (date, timezone) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
            timeZone: timezone
        }).format(date)
    }

    const getDayOffset = (date, timezone) => {
        const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
        const currentDate = new Date(date.toLocaleString('en-US'))

        // Simplify day comparison
        const localDay = localDate.getDay()
        const currentDay = currentDate.getDay() // Local system day

        if (localDay === currentDay) return 'Today'
        if (localDay === (currentDay + 1) % 7) return 'Tomorrow'
        if (localDay === (currentDay + 6) % 7) return 'Yesterday'
        return ''
    }

    return (
        <Card className="h-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Globe className="w-4 h-4" />
                    World Clock
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
                {cities.map((item, index) => (
                    <div key={index} className="flex items-center justify-between border-b last:border-0 border-slate-200 dark:border-slate-800 pb-2 last:pb-0">
                        <div className="flex flex-col">
                            <span className="font-medium text-sm">{item.city}</span>
                            <span className="text-xs text-muted-foreground">{getDayOffset(time, item.timezone)}</span>
                        </div>
                        <div className="font-mono text-lg font-bold tracking-tight">
                            {formatTime(time, item.timezone)}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
