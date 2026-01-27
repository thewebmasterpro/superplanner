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
        enableCampaigns: true,
        prayerLocation: { city: '', country: '' }, // Prayer times location
        telegram: {
          chatId: '',
          enabled: false,
          advanceMinutes: 30, // Notification X minutes before deadline/meeting
        },
        dashboardWidgets: {
          prayerTimes: true,
          quranVerse: true,
          focusTools: true,
          spotify: true,
          stats: true,
          upcomingTasks: true,
        },
      },
      setPreferences: (prefs) => set((state) => ({
        preferences: { ...state.preferences, ...prefs }
      })),

      // Theme
      theme: 'light', // 'light', 'dark'
      setTheme: (theme) => set({ theme }),
      // Teams
      teams: [],
      currentTeam: null,
      setCurrentTeam: (team) => set({ currentTeam: team }),
      setTeams: (teams) => set({ teams }),

      // Actions
      logout: () => set({ user: null, currentTeam: null, teams: [] }),
    }),
    {
      name: 'user-storage', // LocalStorage key
      partialize: (state) => ({
        preferences: state.preferences,
        theme: state.theme,
        currentTeam: state.currentTeam // Persist selected team
      }),
    }
  )
)
