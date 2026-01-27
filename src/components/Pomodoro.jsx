import { useState, useEffect } from 'react'
import { Timer, Play, Pause, RotateCcw, Coffee, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'

function Pomodoro({ preferences }) {
    const [mode, setMode] = useState('work') // 'work' or 'break'
    const [timeLeft, setTimeLeft] = useState(25 * 60)
    const [isActive, setIsActive] = useState(false)

    // Update time when preferences change or mode switches
    useEffect(() => {
        if (!isActive) {
            const duration = mode === 'work'
                ? (preferences?.pomodoro_work_duration || 25)
                : (preferences?.pomodoro_break_duration || 5)
            setTimeLeft(duration * 60)
        }
    }, [preferences, mode, isActive])

    useEffect(() => {
        let interval = null
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1)
            }, 1000)
        } else if (timeLeft === 0) {
            const nextMode = mode === 'work' ? 'break' : 'work'
            setMode(nextMode)
            setIsActive(false)
            // Optional: Notification sound could go here
        } else {
            clearInterval(interval)
        }
        return () => clearInterval(interval)
    }, [isActive, timeLeft, mode])

    const toggleTimer = () => setIsActive(!isActive)
    const resetTimer = () => {
        setIsActive(false)
        const duration = mode === 'work'
            ? (preferences?.pomodoro_work_duration || 25)
            : (preferences?.pomodoro_break_duration || 5)
        setTimeLeft(duration * 60)
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }

    const progress = (() => {
        const total = mode === 'work'
            ? (preferences?.pomodoro_work_duration || 25) * 60
            : (preferences?.pomodoro_break_duration || 5) * 60
        return ((total - timeLeft) / total) * 100
    })()

    return (
        <Card className="h-full overflow-hidden relative">
            {/* Background Progress Bar */}
            <div
                className={cn(
                    "absolute bottom-0 left-0 h-1 transition-all duration-1000 ease-linear",
                    mode === 'work' ? "bg-primary" : "bg-green-500"
                )}
                style={{ width: `${progress}%` }}
            />

            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Timer className="h-5 w-5 text-primary" />
                    Pomodoro
                </CardTitle>
                <Badge variant={mode === 'work' ? "default" : "secondary"} className={cn("capitalize gap-1", mode === 'work' ? "bg-primary" : "bg-green-600 hover:bg-green-700")}>
                    {mode === 'work' ? <Zap className="h-3 w-3" /> : <Coffee className="h-3 w-3" />}
                    {mode === 'work' ? 'Focus' : 'Pause'}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-center py-4">
                    <div className={cn(
                        "text-5xl font-mono font-bold tracking-tighter tabular-nums transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                        {formatTime(timeLeft)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 font-medium">
                        {isActive
                            ? (mode === 'work' ? 'Restez concentré ! 🔥' : 'Détendez-vous... ☕')
                            : 'Prêt à démarrer ?'}
                    </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                    <Button
                        onClick={toggleTimer}
                        size="lg"
                        className={cn("w-32 gap-2 shadow-lg", isActive && "bg-amber-500 hover:bg-amber-600 text-white")}
                    >
                        {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {isActive ? 'Pause' : 'Start'}
                    </Button>
                    <Button onClick={resetTimer} variant="outline" size="icon">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default Pomodoro
