import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gamificationService } from '../services/gamification.service'
import { useGamificationStore } from '../stores/gamificationStore'
import { useUserStore } from '../stores/userStore'
import { useEffect } from 'react'

/**
 * Hook to get user's gamification points
 */
export function useUserPoints() {
  const user = useUserStore((s) => s.user)
  const setPointsData = useGamificationStore((s) => s.setPointsData)

  const query = useQuery({
    queryKey: ['gamification', 'points', user?.id],
    queryFn: () => gamificationService.getUserPoints(user.id),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  })

  // Update store when data changes
  useEffect(() => {
    if (query.data) {
      setPointsData(query.data)
    }
  }, [query.data, setPointsData])

  return query
}

/**
 * Hook to get user's points history
 */
export function usePointsHistory(limit = 100) {
  const user = useUserStore((s) => s.user)

  return useQuery({
    queryKey: ['gamification', 'points-history', user?.id, limit],
    queryFn: () => gamificationService.getPointsHistory(user.id, limit),
    enabled: !!user,
    staleTime: 60000, // 1 minute
  })
}

/**
 * Hook to get active challenges
 */
export function useActiveChallenges() {
  return useQuery({
    queryKey: ['gamification', 'challenges', 'active'],
    queryFn: () => gamificationService.getActiveChallenges(),
    staleTime: 300000, // 5 minutes
  })
}

/**
 * Hook to get user's challenges with progress
 */
export function useUserChallenges() {
  const user = useUserStore((s) => s.user)

  return useQuery({
    queryKey: ['gamification', 'user-challenges', user?.id],
    queryFn: () => gamificationService.getUserChallenges(user.id),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for progress updates
  })
}

/**
 * Hook to claim challenge reward
 */
export function useClaimReward() {
  const queryClient = useQueryClient()
  const user = useUserStore((s) => s.user)

  return useMutation({
    mutationFn: ({ challengeId }) => gamificationService.claimReward(user.id, challengeId),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(['gamification', 'points', user.id])
      queryClient.invalidateQueries(['gamification', 'user-challenges', user.id])
      queryClient.invalidateQueries(['gamification', 'points-history', user.id])
    },
  })
}

/**
 * Hook to get leaderboard
 */
export function useLeaderboard(period = 'all', limit = 10) {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', period, limit],
    queryFn: () => gamificationService.getLeaderboard({ period, limit }),
    staleTime: 60000, // 1 minute
  })
}

/**
 * Hook to get user's rank
 */
export function useUserRank() {
  const user = useUserStore((s) => s.user)
  const setRank = useGamificationStore((s) => s.setRank)

  const query = useQuery({
    queryKey: ['gamification', 'rank', user?.id],
    queryFn: () => gamificationService.getUserRank(user.id),
    enabled: !!user,
    staleTime: 120000, // 2 minutes
  })

  // Update store when data changes
  useEffect(() => {
    if (query.data !== undefined) {
      setRank(query.data)
    }
  }, [query.data, setRank])

  return query
}

/**
 * Hook to get shop items
 */
export function useShopItems() {
  return useQuery({
    queryKey: ['gamification', 'shop', 'items'],
    queryFn: () => gamificationService.getShopItems(),
    staleTime: 600000, // 10 minutes
  })
}

/**
 * Hook to get user's purchases
 */
export function useUserPurchases() {
  const user = useUserStore((s) => s.user)

  return useQuery({
    queryKey: ['gamification', 'purchases', user?.id],
    queryFn: () => gamificationService.getUserPurchases(user.id),
    enabled: !!user,
    staleTime: 60000, // 1 minute
  })
}

/**
 * Hook to purchase item
 */
export function usePurchaseItem() {
  const queryClient = useQueryClient()
  const user = useUserStore((s) => s.user)

  return useMutation({
    mutationFn: ({ itemId }) => gamificationService.purchaseItem(user.id, itemId),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(['gamification', 'points', user.id])
      queryClient.invalidateQueries(['gamification', 'purchases', user.id])
      queryClient.invalidateQueries(['gamification', 'points-history', user.id])
    },
  })
}

/**
 * Hook to activate/deactivate purchased item
 */
export function useActivateItem() {
  const queryClient = useQueryClient()
  const user = useUserStore((s) => s.user)

  return useMutation({
    mutationFn: ({ purchaseId, active }) =>
      gamificationService.activateItem(user.id, purchaseId, active),
    onSuccess: () => {
      queryClient.invalidateQueries(['gamification', 'purchases', user.id])
    },
  })
}

/**
 * Hook to enroll user in active challenges (call on login/mount)
 */
export function useEnrollInChallenges() {
  const user = useUserStore((s) => s.user)

  return useMutation({
    mutationFn: () => gamificationService.enrollUserInActiveChallenges(user.id),
  })
}
