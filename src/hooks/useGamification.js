import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gamificationService } from '../services/gamification.service'
import { useGamificationStore } from '../stores/gamificationStore'
import { useUserStore } from '../stores/userStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEffect } from 'react'

/**
 * Hook to get user's gamification points
 */
export function useUserPoints() {
  const user = useUserStore((s) => s.user)
  const setPointsData = useGamificationStore((s) => s.setPointsData)
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)

  const query = useQuery({
    queryKey: ['gamification', 'points', user?.id, activeWorkspaceId],
    queryFn: () => gamificationService.getUserPoints(user.id, activeWorkspaceId),
    enabled: !!user,
    staleTime: 30000,
    refetchInterval: 60000,
  })

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
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)

  return useQuery({
    queryKey: ['gamification', 'points-history', user?.id, limit, activeWorkspaceId],
    queryFn: () => gamificationService.getPointsHistory(user.id, limit, activeWorkspaceId),
    enabled: !!user,
    staleTime: 60000,
  })
}

/**
 * Hook to get active challenges
 */
export function useActiveChallenges() {
  const user = useUserStore((s) => s.user)
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)

  return useQuery({
    queryKey: ['gamification', 'challenges', 'active', activeWorkspaceId],
    queryFn: () => gamificationService.getActiveChallenges(user?.id, activeWorkspaceId),
    staleTime: 300000,
  })
}

/**
 * Hook to get user's challenges with progress
 */
export function useUserChallenges() {
  const user = useUserStore((s) => s.user)
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)

  return useQuery({
    queryKey: ['gamification', 'user-challenges', user?.id, activeWorkspaceId],
    queryFn: () => gamificationService.getUserChallenges(user.id, activeWorkspaceId),
    enabled: !!user,
    staleTime: 30000,
    refetchInterval: 60000,
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
      queryClient.invalidateQueries({ queryKey: ['gamification'] })
    },
  })
}

/**
 * Hook to get leaderboard
 */
export function useLeaderboard(period = 'all', limit = 10) {
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)

  return useQuery({
    queryKey: ['gamification', 'leaderboard', period, limit, activeWorkspaceId],
    queryFn: () => gamificationService.getLeaderboard({ period, limit, workspaceId: activeWorkspaceId }),
    staleTime: 60000,
  })
}

/**
 * Hook to get user's rank
 */
export function useUserRank() {
  const user = useUserStore((s) => s.user)
  const setRank = useGamificationStore((s) => s.setRank)
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)

  const query = useQuery({
    queryKey: ['gamification', 'rank', user?.id, activeWorkspaceId],
    queryFn: () => gamificationService.getUserRank(user.id, activeWorkspaceId),
    enabled: !!user,
    staleTime: 120000,
  })

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
    staleTime: 600000,
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
    staleTime: 60000,
  })
}

/**
 * Hook to purchase item
 */
export function usePurchaseItem() {
  const queryClient = useQueryClient()
  const user = useUserStore((s) => s.user)
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)

  return useMutation({
    mutationFn: ({ itemId }) => gamificationService.purchaseItem(user.id, itemId, activeWorkspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] })
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
      queryClient.invalidateQueries({ queryKey: ['gamification', 'purchases', user.id] })
    },
  })
}

/**
 * Hook to enroll user in active challenges (call on login/mount)
 */
export function useEnrollInChallenges() {
  const user = useUserStore((s) => s.user)
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)

  return useMutation({
    mutationFn: () => gamificationService.enrollUserInActiveChallenges(user.id, activeWorkspaceId),
  })
}
