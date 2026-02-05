import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, Settings2, Plus, X, ListRestart } from 'lucide-react'
import { useUserStore } from '../stores/userStore'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { settingsService } from '../services/settings.service'

const DEFAULT_CITIES = [
    { city: 'New York', timezone: 'America/New_York' },
    { city: 'London', timezone: 'Europe/London' },
    { city: 'Tokyo', timezone: 'Asia/Tokyo' }
]

const POPULAR_CITIES = [
    { city: 'Paris', timezone: 'Europe/Paris' },
    { city: 'Bruxelles', timezone: 'Europe/Brussels' },
    { city: 'Casablanca', timezone: 'Africa/Casablanca' },
    { city: 'Dubaï', timezone: 'Asia/Dubai' },
    { city: 'New York', timezone: 'America/New_York' },
    { city: 'Londres', timezone: 'Europe/London' },
    { city: 'Tokyo', timezone: 'Asia/Tokyo' },
    { city: 'Istanbul', timezone: 'Europe/Istanbul' }
]

export function WorldClockWidget() {
    const { preferences, setPreferences } = useUserStore()
    const [time, setTime] = useState(new Date())
    const [isConfiguring, setIsConfiguring] = useState(false)
    const [newCity, setNewCity] = useState({ city: '', timezone: '' })
    const [cities, setCities] = useState(DEFAULT_CITIES)

    useEffect(() => {
        if (preferences?.world_clock_cities && Array.isArray(preferences.world_clock_cities)) {
            const validCities = preferences.world_clock_cities.filter(c => c && c.city && c.timezone)
            if (validCities.length > 0) {
                setCities(validCities)
            }
        }
    }, [preferences?.world_clock_cities])

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const formatTime = (date, timezone) => {
        try {
            return new Intl.DateTimeFormat('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: timezone
            }).format(date)
        } catch (e) {
            return '--:--'
        }
    }

    const getDayOffset = (date, timezone) => {
        try {
            const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
            const currentDate = new Date(date.toLocaleString('en-US'))
            const localDay = localDate.getDate()
            const currentDay = currentDate.getDate()

            if (localDay === currentDay) return 'Aujourd\'hui'
            if (localDay > currentDay) return 'Demain'
            return 'Hier'
        } catch (e) {
            return ''
        }
    }

    const saveCities = async (newCitiesList) => {
        setCities(newCitiesList)
        setPreferences({ world_clock_cities: newCitiesList })
        try {
            await settingsService.updatePreferences({ world_clock_cities: newCitiesList })
        } catch (e) {
            console.error('Failed to save cities', e)
        }
    }

    const addCity = () => {
        if (newCity.city && newCity.timezone) {
            const updated = [...cities, newCity]
            saveCities(updated)
            setNewCity({ city: '', timezone: '' })
        }
    }

    const removeCity = (index) => {
        const updated = cities.filter((_, i) => i !== index)
        saveCities(updated)
    }

    const resetToDefaults = () => {
        saveCities(DEFAULT_CITIES)
    }

    return (
        <Card className="h-full bg-base-100 border-base-300 shadow-none">
            <CardHeader className="py-2 px-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" />
                    Horloges
                </CardTitle>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={() => setIsConfiguring(!isConfiguring)}
                >
                    <Settings2 className={`w-3.5 h-3.5 transition-transform ${isConfiguring ? 'rotate-90' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-1">
                {isConfiguring ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Liste actuelle */}
                        <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                            {cities.map((city, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-base-200/50 p-1.5 rounded-lg border border-base-300">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold">{city.city}</span>
                                        <span className="text-[9px] opacity-50 truncate max-w-[100px]">{city.timezone}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-error" onClick={() => removeCity(idx)}>
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Sélections rapides */}
                        <div className="space-y-2">
                            <p className="text-[9px] font-bold opacity-40 uppercase">Villes Populaires</p>
                            <div className="flex flex-wrap gap-1">
                                {POPULAR_CITIES.filter(pc => !cities.some(c => c.timezone === pc.timezone)).slice(0, 6).map(pc => (
                                    <button
                                        key={pc.timezone}
                                        onClick={() => saveCities([...cities, pc])}
                                        className="btn btn-xs btn-outline font-normal text-[9px] h-6 px-1.5 min-h-0"
                                    >
                                        + {pc.city}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1 pt-1">
                            <Input
                                placeholder="Ville"
                                className="h-7 text-[10px] px-2 shadow-none focus-visible:ring-1"
                                value={newCity.city}
                                onChange={e => setNewCity({ ...newCity, city: e.target.value })}
                            />
                            <Input
                                placeholder="Fuseau"
                                className="h-7 text-[10px] px-2 shadow-none focus-visible:ring-1"
                                value={newCity.timezone}
                                onChange={e => setNewCity({ ...newCity, timezone: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-1">
                            <Button className="h-7 flex-1 text-[10px] gap-1 shadow-sm" onClick={addCity} disabled={!newCity.city || !newCity.timezone}>
                                <Plus className="w-3 h-3" /> Ajouter
                            </Button>
                            <Button variant="outline" className="h-7 text-[10px] shadow-sm" onClick={resetToDefaults} title="Réinitialiser">
                                <ListRestart className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-base-300">
                        {cities.map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm tracking-tight">{item.city}</span>
                                    <span className="text-[10px] opacity-50 font-medium">
                                        {getDayOffset(time, item.timezone)}
                                    </span>
                                </div>
                                <div className="text-2xl font-black text-primary font-mono tracking-tighter tabular-nums">
                                    {formatTime(time, item.timezone)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
