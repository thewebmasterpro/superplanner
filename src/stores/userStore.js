import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),

      // Preferences
      preferences: {
        campaignSetupDaysBefore: 7,
        campaignReportingDaysAfter: 3,
        distriwebHours: { start: 9, end: 17 },
        thewebmasterHours: { start: 7.5, end: 15.5 },
        enableCampaigns: false,
        prayerLocation: { city: '', country: '' }, // Prayer times location
        telegram: {
          chatId: '',
          enabled: false,
          advanceMinutes: 30, // Notification X minutes before deadline/meeting
        },
      },
      setPreferences: (prefs) => set((state) => ({
        preferences: { ...state.preferences, ...prefs }
      })),

      // Theme
      theme: 'light', // 'light', 'dark'
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'user-storage', // LocalStorage key
      partialize: (state) => ({
        preferences: state.preferences,
        theme: state.theme
      }), // Only persist preferences and theme, not user
    }
  )
)
