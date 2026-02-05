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
        prayerLocation: { city: '', country: '' },
        spotify_playlist_url: '',
        world_clock_cities: [],
        telegram: {
          chatId: '',
          enabled: false,
          advanceMinutes: 30,
        },
        dashboardWidgets: {
          prayerTimes: true,
          quranVerse: true,
          focusTools: true,
          spotify: true,
          stats: true,
          upcomingTasks: true,
          eisenhower: true,
          worldClock: true,
          scratchpad: true,
          inspiration_quote: true,
          inspiration_fact: true,
          inspiration_joke: true,
        },
        dashboardLayoutV3: {
          mainGrid: ['prayerTimes', 'quranVerse', 'focusTools', 'worldClock', 'scratchpad', 'eisenhower', 'activeCampaigns']
        },
        gamification: {
          enabled: true,
          showPoints: true,
          showChallenges: true,
          leaderboardOptIn: false,
          notifyLevelUp: true,
          notifyChallenges: true,
        },
      },
      setPreferences: (prefs) => set((state) => ({
        preferences: { ...state.preferences, ...prefs }
      })),

      loadPreferences: async () => {
        try {
          const { settingsService } = await import('../services/settings.service')
          const prefs = await settingsService.getPreferences()
          if (prefs && Object.keys(prefs).length > 0) {
            set((state) => ({
              preferences: {
                ...state.preferences,
                ...prefs
              }
            }))
          }
        } catch (e) {
          console.error('Failed to load preferences from server', e)
        }
      },

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
        currentTeam: state.currentTeam
      }),
    }
  )
)
