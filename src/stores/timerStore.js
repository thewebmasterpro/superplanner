import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useTimerStore = create(
    persist(
        (set, get) => ({
            // Pomodoro State
            pomodoro: {
                mode: 'work', // 'work' | 'break'
                timeLeft: 25 * 60,
                isActive: false,
            },

            // Task Timer State
            taskTimer: {
                selectedTaskId: '',
                isRunning: false,
                seconds: 0,
            },

            // Actions
            setPomodoroState: (newState) => set((state) => ({
                pomodoro: { ...state.pomodoro, ...newState }
            })),

            togglePomodoro: () => set((state) => ({
                pomodoro: { ...state.pomodoro, isActive: !state.pomodoro.isActive }
            })),

            resetPomodoro: (durationMinutes) => set((state) => ({
                pomodoro: {
                    ...state.pomodoro,
                    isActive: false,
                    timeLeft: durationMinutes * 60
                }
            })),

            tickPomodoro: () => set((state) => {
                if (!state.pomodoro.isActive) return state

                if (state.pomodoro.timeLeft <= 0) {
                    // Timer finished
                    return {
                        pomodoro: {
                            ...state.pomodoro,
                            isActive: false,
                            mode: state.pomodoro.mode === 'work' ? 'break' : 'work'
                        }
                    }
                }

                return {
                    pomodoro: { ...state.pomodoro, timeLeft: state.pomodoro.timeLeft - 1 }
                }
            }),

            setTaskTimerState: (newState) => set((state) => ({
                taskTimer: { ...state.taskTimer, ...newState }
            })),

            tickTaskTimer: () => set((state) => {
                if (!state.taskTimer.isRunning) return state
                return {
                    taskTimer: { ...state.taskTimer, seconds: state.taskTimer.seconds + 1 }
                }
            }),

            resetTaskTimer: () => set((state) => ({
                taskTimer: { ...state.taskTimer, isRunning: false, seconds: 0 }
            })),
        }),
        {
            name: 'timer-storage',
            partialize: (state) => ({
                pomodoro: state.pomodoro,
                taskTimer: state.taskTimer
            }), // Persist everything
        }
    )
)
