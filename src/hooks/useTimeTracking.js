import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useTimerStore } from '../stores/timerStore'
import { toast } from 'sonner'

export function useTimeTracking() {
    const queryClient = useQueryClient()
    const { taskTimer, setTaskTimerState } = useTimerStore()

    const startTimer = useMutation({
        mutationFn: async (taskId) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('task_time_logs')
                .insert({
                    task_id: taskId,
                    user_id: user.id,
                    start_time: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error
            return data
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

            const endTime = new Date().toISOString()

            // Calculate duration roughly (server side might be better, but we can do it here too to ensure DB consistency)
            // Actually, passing end_time is enough if we have a trigger or calculate it later. 
            // V2 migration script: duration_seconds INTEGER DEFAULT 0.
            // So we should calculate it.

            // We need to fetch the start time to be precise, or trust the client runtime if close enough. 
            // Better: let's fetch the log first or rely on Supabase `now()` - `start_time` if SQL allowed it, but here we are client side.

            // Let's assume we update end_time and calculate duration from what we know or just rely on the stored `duration_seconds` if we updated it?
            // Actually, let's just save end_time and duration based on the store's seconds for now, OR better, diff with start_time.

            // To be accurate: 
            const { data: currentLog } = await supabase.from('task_time_logs').select('start_time').eq('id', taskTimer.activeLogId).single()

            if (!currentLog) throw new Error('Log not found')

            const start = new Date(currentLog.start_time)
            const end = new Date()
            const duration = Math.floor((end - start) / 1000)

            const { error } = await supabase
                .from('task_time_logs')
                .update({
                    end_time: end.toISOString(),
                    duration_seconds: duration
                })
                .eq('id', taskTimer.activeLogId)

            if (error) throw error
            return { duration }
        },
        onSuccess: () => {
            setTaskTimerState({ isRunning: false, activeLogId: null })
            queryClient.invalidateQueries({ queryKey: ['tasks'] }) // If we show total duration on task
            toast.success('Timer stopped')
        },
        onError: (error) => {
            console.error(error)
            toast.error('Failed to stop timer')
            // Force stop local timer anyway if error persists?
            setTaskTimerState({ isRunning: false })
        }
    })

    return {
        startTimer,
        stopTimer
    }
}
