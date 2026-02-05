import { create } from 'zustand'

/**
 * Gamification Store
 * Manages real-time gamification state (points, level, streak, rank)
 */
export const useGamificationStore = create((set) => ({
  // State
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
      points: pointsData.points || 0,
      level: pointsData.level || 1,
      streak: pointsData.streak_days || 0,
      totalEarned: pointsData.total_earned || 0,
      leaderboardVisible: pointsData.leaderboard_visible || false,
    }),

  // Reset
  reset: () =>
    set({
      points: 0,
      level: 1,
      streak: 0,
      rank: null,
      totalEarned: 0,
      leaderboardVisible: false,
    }),
}))
