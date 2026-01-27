import { Timer, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select"
import { cn } from '../lib/utils'
import { useTimerStore } from '../stores/timerStore'
import { useTimeTracking } from '../hooks/useTimeTracking'
import { Loader2 } from 'lucide-react'

function TaskTimer({ tasks }) {
    const { taskTimer, setTaskTimerState, resetTaskTimer } = useTimerStore()
    const { selectedTaskId, isRunning, seconds } = taskTimer

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const secs = totalSeconds % 60

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }

    const { startTimer, stopTimer } = useTimeTracking()

    const handleStart = () => {
        if (!selectedTaskId) return
        startTimer.mutate(selectedTaskId)
    }

    const handleStop = () => {
        stopTimer.mutate()
    }

    const handleReset = () => {
        // If running, stop first? Or just forced reset
        if (isRunning) {
            handleStop()
        }
        resetTaskTimer()
    }

    const selectedTask = tasks.find(t => t.id === selectedTaskId)

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Timer className="h-5 w-5 text-primary" />
                    Chronomètre Tâche
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Select
                        value={selectedTaskId}
                        onValueChange={(id) => setTaskTimerState({ selectedTaskId: id })}
                        disabled={isRunning}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une tâche..." />
                        </SelectTrigger>
                        <SelectContent>
                            {tasks.filter(t => t.status !== 'done').map(task => (
                                <SelectItem key={task.id} value={task.id}>
                                    {task.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {selectedTask && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                            <CheckCircle2 className={`h-4 w-4 status-icon-${selectedTask.status}`} />
                            <span className="truncate">{selectedTask.title}</span>
                        </div>
                    )}
                </div>

                <div className="text-center py-2">
                    <div className={cn(
                        "text-4xl font-mono font-bold tracking-tighter tabular-nums transition-colors",
                        isRunning ? "text-primary" : "text-muted-foreground"
                    )}>
                        {formatTime(seconds)}
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                    {!isRunning ? (
                        <Button
                            onClick={handleStart}
                            disabled={!selectedTaskId || startTimer.isPending}
                            className={cn("w-28 gap-2", !selectedTaskId && "opacity-50")}
                        >
                            {startTimer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            Démarrer
                        </Button>
                    ) : (
                        <Button
                            onClick={handleStop}
                            disabled={stopTimer.isPending}
                            variant="destructive"
                            className="w-28 gap-2"
                        >
                            {stopTimer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
                            Pause
                        </Button>
                    )}
                    <Button onClick={handleReset} variant="outline" size="icon">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default TaskTimer
