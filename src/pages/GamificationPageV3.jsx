import { useState, useEffect } from 'react'
import { Trophy, Zap, Flame, Target, ShoppingBag, Users, Crown, Gift, CheckCircle, Lock, History, TrendingUp, TrendingDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useGamificationStore } from '../stores/gamificationStore'
import { gamificationService, POINTS_CONFIG } from '../services/gamification.service'
import DashboardLayoutV3 from '../components/layout/DashboardLayoutV3'
import pb from '../lib/pocketbase'
import toast from 'react-hot-toast'

export default function GamificationPageV3() {
  const [activeTab, setActiveTab] = useState('overview')
  const [challenges, setChallenges] = useState([])
  const [shopItems, setShopItems] = useState([])
  const [purchases, setPurchases] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [teamLeaderboard, setTeamLeaderboard] = useState([])
  const [pointsHistory, setPointsHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [leaderboardView, setLeaderboardView] = useState('individual') // 'individual' or 'team'

  const { userPoints, fetchUserPoints, updateLeaderboardVisibility, leaderboardVisible } = useGamificationStore()
  const user = pb.authStore.model

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user?.id, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      await fetchUserPoints(user.id)

      if (activeTab === 'challenges') {
        const userChallenges = await gamificationService.getUserChallenges(user.id)
        setChallenges(userChallenges)
      } else if (activeTab === 'shop') {
        const items = await gamificationService.getShopItems()
        const userPurchases = await gamificationService.getUserPurchases(user.id)
        setShopItems(items)
        setPurchases(userPurchases)
      } else if (activeTab === 'leaderboard') {
        const board = await gamificationService.getLeaderboard({ limit: 20 })
        const teamBoard = await gamificationService.getTeamLeaderboard({ limit: 20 })
        setLeaderboard(board)
        setTeamLeaderboard(teamBoard)
      } else if (activeTab === 'history') {
        const history = await gamificationService.getPointsHistory(user.id, 50)
        setPointsHistory(history.items || [])
      }
    } catch (error) {
      console.error('Error loading gamification data:', error)
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimReward = async (challengeId) => {
    try {
      const result = await gamificationService.claimReward(user.id, challengeId)

      if (result?.pointsAwarded) {
        toast.success(`🎉 +${result.pointsAwarded} points gagnés!`, {
          duration: 3000
        })
      } else {
        toast.success('🎉 Récompense réclamée!')
      }

      if (result?.levelUp) {
        toast.success(`🎊 Niveau ${result.newLevel} atteint!`, {
          duration: 5000,
          icon: '🏆'
        })
      }

      loadData()
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la réclamation')
    }
  }

  const handlePurchaseItem = async (itemId) => {
    try {
      await gamificationService.purchaseItem(user.id, itemId)
      toast.success('🛍️ Achat effectué!')
      loadData()
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'achat')
    }
  }

  const handleToggleLeaderboardVisibility = async (visible) => {
    try {
      await updateLeaderboardVisibility(user.id, visible)
      toast.success(visible ? 'Visible dans le classement' : 'Masqué du classement')
      // Reload leaderboard to reflect changes
      if (activeTab === 'leaderboard') {
        const board = await gamificationService.getLeaderboard({ limit: 20 })
        setLeaderboard(board)
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const calculateProgress = () => {
    if (!userPoints) return { current: 0, next: 100, percentage: 0 }
    const currentLevelPoints = (userPoints.level - 1) * POINTS_CONFIG.level_threshold
    const current = userPoints.total_earned - currentLevelPoints
    const next = POINTS_CONFIG.level_threshold
    const percentage = (current / next) * 100
    return { current, next, percentage }
  }

  const progress = calculateProgress()

  return (
    <DashboardLayoutV3>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Récompenses & Défis
          </h1>
          <p className="text-base-content/70 mt-1">
            Gagnez des points, relevez des défis et débloquez des récompenses
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Points */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-6 h-6 text-purple-400" />
            <span className="text-base-content/70 text-sm font-medium">Points</span>
          </div>
          <div className="text-3xl font-bold text-purple-400">
            {userPoints?.points?.toLocaleString() || 0}
          </div>
          <div className="text-xs text-base-content/60 mt-1">
            {userPoints?.total_earned?.toLocaleString() || 0} gagnés au total
          </div>
        </div>

        {/* Level */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span className="text-base-content/70 text-sm font-medium">Niveau</span>
          </div>
          <div className="text-3xl font-bold text-yellow-500">
            {userPoints?.level || 1}
          </div>
          <div className="mt-2">
            <div className="h-2 bg-base-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                style={{ width: `${Math.min(progress.percentage, 100)}%` }}
              />
            </div>
            <div className="text-xs text-base-content/60 mt-1">
              {progress.current} / {progress.next} points
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="text-base-content/70 text-sm font-medium">Série</span>
          </div>
          <div className="text-3xl font-bold text-orange-500">
            {userPoints?.streak_days || 0}
          </div>
          <div className="text-xs text-base-content/60 mt-1">
            jours consécutifs
          </div>
        </div>

        {/* Rank */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-6 h-6 text-blue-400" />
            <span className="text-base-content/70 text-sm font-medium">Classement</span>
          </div>
          <div className="text-3xl font-bold text-blue-400">
            #{leaderboard.findIndex(u => u.userId === user?.id) + 1 || '-'}
          </div>
          <div className="text-xs text-base-content/60 mt-1">
            sur {leaderboard.length} joueurs
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-base-300">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: Trophy },
          { id: 'challenges', label: 'Défis', icon: Target },
          { id: 'shop', label: 'Boutique', icon: ShoppingBag },
          { id: 'leaderboard', label: 'Classement', icon: Users },
          { id: 'history', label: 'Historique', icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-base-content/70 hover:text-base-content/80'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <OverviewTab userPoints={userPoints} />
        )}

        {activeTab === 'challenges' && (
          <ChallengesTab
            challenges={challenges}
            loading={loading}
            onClaim={handleClaimReward}
          />
        )}

        {activeTab === 'shop' && (
          <ShopTab
            items={shopItems}
            purchases={purchases}
            userPoints={userPoints}
            loading={loading}
            onPurchase={handlePurchaseItem}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardTab
            leaderboard={leaderboard}
            teamLeaderboard={teamLeaderboard}
            currentUserId={user?.id}
            loading={loading}
            leaderboardVisible={leaderboardVisible}
            leaderboardView={leaderboardView}
            onToggleVisibility={handleToggleLeaderboardVisibility}
            onViewChange={setLeaderboardView}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            history={pointsHistory}
            loading={loading}
          />
        )}
      </div>
      </div>
    </DashboardLayoutV3>
  )
}

// Overview Tab Component
function OverviewTab({ userPoints }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* How to Earn Points */}
        <div className="bg-base-100 border border-base-300 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Comment gagner des points
          </h3>
          <div className="space-y-3">
            {[
              { action: 'Compléter une tâche', points: POINTS_CONFIG.task_completed },
              { action: 'Tâche priorité haute', points: POINTS_CONFIG.high_priority_task },
              { action: 'Tâche priorité moyenne', points: POINTS_CONFIG.medium_priority_task },
              { action: 'Complétion anticipée', points: POINTS_CONFIG.early_completion },
              { action: 'Connexion quotidienne', points: POINTS_CONFIG.daily_login },
              { action: 'Compléter un défi', points: POINTS_CONFIG.challenge_completed },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-base-content/80">{item.action}</span>
                <span className="text-purple-400 font-semibold">+{item.points}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Streak Bonus */}
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Bonus de série
          </h3>
          <p className="text-base-content/80 text-sm mb-4">
            Connectez-vous tous les jours pour maintenir votre série et gagner un multiplicateur de points!
          </p>
          <div className="bg-base-100 rounded-lg p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">
                {userPoints?.streak_days || 0} jours
              </div>
              <div className="text-sm text-base-content/70 mt-1">Série actuelle</div>
              {userPoints?.streak_days > 0 && (
                <div className="mt-3 text-sm text-purple-400 font-semibold">
                  Multiplicateur: ×{POINTS_CONFIG.streak_multiplier}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Challenges Tab Component
function ChallengesTab({ challenges, loading, onClaim }) {
  if (loading) {
    return <div className="text-center text-base-content/70 py-12">Chargement...</div>
  }

  if (challenges.length === 0) {
    return (
      <div className="text-center text-base-content/70 py-12">
        <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Aucun défi actif pour le moment</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {challenges.map((challenge) => (
        <div
          key={challenge.id}
          className="bg-base-100 border border-base-300 rounded-lg p-6 hover:border-purple-500/30 transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-base-content">{challenge.challenge?.title}</h3>
            {challenge.completed && !challenge.claimed && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {challenge.claimed && (
              <Gift className="w-5 h-5 text-purple-400" />
            )}
          </div>

          <p className="text-sm text-base-content/70 mb-4">
            {challenge.challenge?.description}
          </p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-base-content/60 mb-1">
              <span>Progression</span>
              <span>{challenge.progress} / {challenge.challenge?.goal_value}</span>
            </div>
            <div className="h-2 bg-base-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{ width: `${Math.min(challenge.progressPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Reward */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 font-semibold">
                +{challenge.challenge?.points_reward} points
              </span>
            </div>

            {challenge.completed && !challenge.claimed && (
              <button
                onClick={() => onClaim(challenge.challengeId)}
                className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-base-content text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Réclamer
              </button>
            )}
            {challenge.claimed && (
              <span className="text-xs text-base-content/60">Réclamé</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Shop Tab Component
function ShopTab({ items, purchases, userPoints, loading, onPurchase }) {
  const isPurchased = (itemId) => {
    return purchases.some(p => p.item_id === itemId)
  }

  if (loading) {
    return <div className="text-center text-base-content/70 py-12">Chargement...</div>
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-base-content/70 py-12">
        <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>La boutique est vide pour le moment</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const purchased = isPurchased(item.id)
        const canAfford = userPoints?.points >= item.price

        return (
          <div
            key={item.id}
            className={`bg-base-100 border rounded-lg p-6 ${
              purchased ? 'border-purple-500/50' : 'border-base-300'
            }`}
          >
            <div className="text-4xl mb-3">{item.icon || '🎁'}</div>

            <h3 className="font-semibold text-base-content mb-2">{item.name}</h3>
            <p className="text-sm text-base-content/70 mb-4">{item.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 font-semibold">
                  {item.price.toLocaleString()} pts
                </span>
              </div>

              {purchased ? (
                <div className="flex items-center gap-1 text-purple-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Acheté</span>
                </div>
              ) : (
                <button
                  onClick={() => onPurchase(item.id)}
                  disabled={!canAfford}
                  className={`px-3 py-1 text-sm font-medium rounded-lg transition-all ${
                    canAfford
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-base-content hover:opacity-90'
                      : 'bg-base-300 text-base-content/60 cursor-not-allowed'
                  }`}
                >
                  {canAfford ? 'Acheter' : <Lock className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Leaderboard Tab Component
function LeaderboardTab({ leaderboard, teamLeaderboard, currentUserId, loading, leaderboardVisible, leaderboardView, onToggleVisibility, onViewChange }) {
  if (loading) {
    return <div className="text-center text-base-content/70 py-12">Chargement...</div>
  }

  return (
    <div className="space-y-4">
      {/* View Toggle & Visibility */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* View Toggle */}
        <div className="bg-base-100 border border-base-300 rounded-lg p-4 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-medium text-base-content">Type de classement</h3>
                <p className="text-sm text-base-content/60">
                  {leaderboardView === 'individual' ? 'Classement individuel' : 'Classement par équipe'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onViewChange('individual')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-all hover:scale-105 ${
                  leaderboardView === 'individual'
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-base-200 text-base-content/70 hover:bg-base-300'
                }`}
              >
                Individuel
              </button>
              <button
                onClick={() => onViewChange('team')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-all hover:scale-105 ${
                  leaderboardView === 'team'
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-base-200 text-base-content/70 hover:bg-base-300'
                }`}
              >
                Équipes
              </button>
            </div>
          </div>
        </div>

        {/* Visibility Toggle (only for individual view) */}
        {leaderboardView === 'individual' && (
          <div className="bg-base-100 border border-base-300 rounded-lg p-4 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-medium text-base-content">Visibilité</h3>
                  <p className="text-sm text-base-content/60">
                    {leaderboardVisible ? 'Visible' : 'Masqué'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={leaderboardVisible}
                  onChange={(e) => onToggleVisibility(e.target.checked)}
                />
                <div className="w-11 h-6 bg-base-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Content */}
      {leaderboardView === 'individual' ? (
        // Individual Leaderboard
        leaderboard.length === 0 ? (
          <div className="text-center text-base-content/70 py-12">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Aucun joueur dans le classement</p>
          </div>
        ) : (
          <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-base-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase">Rang</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase">Joueur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase">Niveau</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase">Points</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase">Série</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {leaderboard.map((user) => (
              <tr
                key={user.userId}
                className={`${
                  user.userId === currentUserId
                    ? 'bg-purple-500/10 border-l-2 border-purple-500'
                    : 'hover:bg-base-300/30'
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {user.rank === 1 && <Crown className="w-5 h-5 text-yellow-500" />}
                    {user.rank === 2 && <Crown className="w-5 h-5 text-base-content/70" />}
                    {user.rank === 3 && <Crown className="w-5 h-5 text-orange-600" />}
                    <span className="text-base-content font-semibold">#{user.rank}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-base-content">
                    {user.userName}
                    {user.userId === currentUserId && (
                      <span className="ml-2 text-xs text-purple-400">(Vous)</span>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-500">{user.level}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 font-semibold">
                      {user.totalEarned.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.streak > 0 && (
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-orange-500">{user.streak}</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </div>
      )
      ) : (
        // Team Leaderboard
        teamLeaderboard.length === 0 ? (
          <div className="text-center text-base-content/70 py-12">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Aucune équipe dans le classement</p>
          </div>
        ) : (
          <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-base-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase">Rang</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase">Équipe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase">Chef d'équipe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase">Membres</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase">Total Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase">Moyenne</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-300">
                  {teamLeaderboard.map((team) => (
                    <tr key={team.teamId} className="hover:bg-base-300/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {team.rank === 1 && <Crown className="w-5 h-5 text-yellow-500" />}
                          {team.rank === 2 && <Crown className="w-5 h-5 text-base-content/70" />}
                          {team.rank === 3 && <Crown className="w-5 h-5 text-orange-600" />}
                          <span className="text-base-content font-semibold">#{team.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-400" />
                          <span className="text-base-content font-medium">{team.teamName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-base-content/80">{team.ownerName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-base-content/60" />
                          <span className="text-base-content">{team.memberCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-purple-400" />
                          <span className="text-purple-400 font-semibold">
                            {team.totalEarned.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-base-content/80">
                          {team.averagePoints.toLocaleString()} pts/membre
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  )
}

// History Tab Component
function HistoryTab({ history, loading }) {
  if (loading) {
    return <div className="text-center text-base-content/70 py-12">Chargement...</div>
  }

  if (history.length === 0) {
    return (
      <div className="text-center text-base-content/70 py-12">
        <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Aucun historique de points pour le moment</p>
      </div>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-base-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase">Raison</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-base-content/70 uppercase">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-300">
            {history.map((entry) => {
              const isPositive = entry.points_change > 0
              const isTeamReward = entry.reason?.startsWith('Récompense d\'équipe:')
              return (
                <tr key={entry.id} className={`hover:bg-base-300/30 ${isTeamReward ? 'bg-purple-500/5' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/80">
                    {formatDate(entry.created)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {isTeamReward ? (
                        <div className="flex items-center gap-1 text-purple-500">
                          <Gift className="w-4 h-4" />
                          <span className="text-sm font-medium">Récompense d'équipe</span>
                        </div>
                      ) : isPositive ? (
                        <div className="flex items-center gap-1 text-green-500">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-medium">Gagné</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-500">
                          <TrendingDown className="w-4 h-4" />
                          <span className="text-sm font-medium">Dépensé</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-base-content/80">{entry.reason || 'N/A'}</span>
                      {isTeamReward && (
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
                          Équipe
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span
                      className={`text-sm font-bold ${
                        isTeamReward ? 'text-purple-500' : isPositive ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {isPositive ? '+' : ''}{entry.points_change}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
