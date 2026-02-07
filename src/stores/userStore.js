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

      loadTeams: async () => {
        try {
          const { teamsService } = await import('../services/teams.service')
          const membersData = await teamsService.MyMemberships()
          const processedTeams = membersData.map(m => ({
            ...m.expand.team_id,
            myRole: m.role
          }))
          set((state) => {
            const newState = { teams: processedTeams }
            // Set currentTeam if not set and teams available
            if (!state.currentTeam && processedTeams.length > 0) {
              newState.currentTeam = processedTeams[0]
            }
            return newState
          })
        } catch (e) {
          console.error('Failed to load teams', e)
        }
      },

      // Teams
      teams: [],
      currentTeam: null,
      setCurrentTeam: (team) => set({ currentTeam: team }),
      setTeams: (teams) => set({ teams }),

      // Get teams filtered by workspace (call as useUserStore.getState().getWorkspaceTeams(wsId))
      getWorkspaceTeams: (workspaceId) => {
        const { teams } = useUserStore.getState()
        if (!workspaceId) return teams
        return teams.filter(t => t.context_id === workspaceId || !t.context_id)
      },

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
