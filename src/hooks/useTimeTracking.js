import { useMutation, useQueryClient } from '@tanstack/react-query'
import pb from '../lib/pocketbase'
import { useTimerStore } from '../stores/timerStore'
import toast from 'react-hot-toast'

export function useTimeTracking() {
    const queryClient = useQueryClient()
    const { taskTimer, setTaskTimerState } = useTimerStore()

    const startTimer = useMutation({
        mutationFn: async (taskId) => {
            const user = pb.authStore.model
            if (!user) throw new Error('Not authenticated')

            const record = await pb.collection('task_time_logs').create({
                task_id: taskId,
                user_id: user.id,
                start_time: new Date().toISOString()
            })

            return record
        },
        onSuccess: (data) => {
            // Update local store with the new log ID
            setTaskTimerState({
                isRunning: true,
                selectedTaskId: data.task_id,
                activeLogId: data.id,
                seconds: 0 // Reset seconds for visual timer
            })
            toast.success('Timer started')
        },
        onError: (error) => {
            toast.error(`Failed to start timer: ${error.message}`)
        }
    })

    const stopTimer = useMutation({
        mutationFn: async () => {
            if (!taskTimer.activeLogId) throw new Error('No active timer log')

            // Fetch current log to get start_time
            const currentLog = await pb.collection('task_time_logs').getOne(taskTimer.activeLogId)

            const start = new Date(currentLog.start_time)
            const end = new Date()
            const duration = Math.floor((end - start) / 1000)

            await pb.collection('task_time_logs').update(taskTimer.activeLogId, {
                end_time: end.toISOString(),
                duration_seconds: duration
            })

            return { duration }
        },
        onSuccess: () => {
            setTaskTimerState({ isRunning: false, activeLogId: null })
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            toast.success('Timer stopped')
        },
        onError: (error) => {
            console.error(error)
            toast.error('Failed to stop timer')
            // Force stop local timer
            setTaskTimerState({ isRunning: false })
        }
    })

    return {
        startTimer,
        stopTimer
    }
}
