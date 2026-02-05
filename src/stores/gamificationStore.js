import { create } from 'zustand'
import { gamificationService } from '../services/gamification.service'

/**
 * Gamification Store
 * Manages real-time gamification state (points, level, streak, rank)
 */
export const useGamificationStore = create((set) => ({
  // State
  userPoints: null,
  loading: false,
  error: null,
  points: 0,
  level: 1,
  streak: 0,
  rank: null,
  totalEarned: 0,
  leaderboardVisible: false,

  // Actions
  setPoints: (points) => set({ points }),
  setLevel: (level) => set({ level }),
  setStreak: (streak) => set({ streak }),
  setRank: (rank) => set({ rank }),
  setTotalEarned: (totalEarned) => set({ totalEarned }),
  setLeaderboardVisible: (visible) => set({ leaderboardVisible: visible }),

  // Batch update from points record
  setPointsData: (pointsData) =>
    set({
      userPoints: pointsData,
      points: pointsData.points || 0,
      level: pointsData.level || 1,
      streak: pointsData.streak_days || 0,
      totalEarned: pointsData.total_earned || 0,
      leaderboardVisible: pointsData.leaderboard_visible || false,
    }),

  // Fetch user points from service
  fetchUserPoints: async (userId) => {
    set({ loading: true, error: null })
    try {
      const pointsData = await gamificationService.getUserPoints(userId)
      set({
        userPoints: pointsData,
        points: pointsData.points || 0,
        level: pointsData.level || 1,
        streak: pointsData.streak_days || 0,
        totalEarned: pointsData.total_earned || 0,
        leaderboardVisible: pointsData.leaderboard_visible || false,
        loading: false,
      })
      return pointsData
    } catch (error) {
      set({ error: error.message, loading: false })
      console.error('Error fetching user points:', error)
      return null
    }
  },

  // Update leaderboard visibility
  updateLeaderboardVisibility: async (userId, visible) => {
    try {
      const updated = await gamificationService.updateLeaderboardVisibility(userId, visible)
      set({
        leaderboardVisible: visible,
        userPoints: updated,
      })
      return updated
    } catch (error) {
      console.error('Error updating leaderboard visibility:', error)
      throw error
    }
  },

  // Reset
  reset: () =>
    set({
      userPoints: null,
      loading: false,
      error: null,
      points: 0,
      level: 1,
      streak: 0,
      rank: null,
      totalEarned: 0,
      leaderboardVisible: false,
    }),
}))
