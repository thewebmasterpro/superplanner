import { useState, useEffect } from 'react'
import { Target, Trophy, Clock, Flame, TrendingUp, Gift, CheckCircle2, Lock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import DashboardLayoutV3 from '../../components/layout/DashboardLayoutV3'
import { gamificationService } from '../../services/gamification.service'
import pb from '../../lib/pocketbase'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { Button } from '../../components/ui/button'

export default function ChallengesPageV3() {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all') // all, daily, weekly, monthly
  const [claiming, setClaiming] = useState(null)

  const userId = pb.authStore.model?.id

  useEffect(() => {
    if (userId) {
      loadChallenges()
    }
  }, [userId])

  const loadChallenges = async () => {
    console.log('🎯 [Challenges] Loading challenges for user:', userId)
    try {
      setLoading(true)

      // Get user's challenges with progress
      const userChallenges = await gamificationService.getUserChallenges(userId)
      console.log('🎯 [Challenges] User challenges loaded:', userChallenges)

      // Filter out challenges that have ended
      const activeChallenges = userChallenges.filter(uc => {
        if (!uc.challenge) return false
        const endDate = new Date(uc.challenge.end_date)
        return endDate >= new Date()
      })

      setChallenges(activeChallenges)
      console.log('🎯 [Challenges] Active challenges:', activeChallenges.length)
    } catch (error) {
      console.error('❌ [Challenges] Error loading challenges:', error)
      toast.error('Erreur lors du chargement des challenges')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimReward = async (challengeId, challengeName, points) => {
    console.log('🎁 [Challenges] Claiming reward:', { challengeId, challengeName, points })
    try {
      setClaiming(challengeId)

      await gamificationService.claimReward(userId, challengeId)

      toast.success(`🎉 Challenge complété ! +${points} points`, {
        duration: 3000,
        icon: '🏆',
      })

      // Reload challenges
      await loadChallenges()
    } catch (error) {
      console.error('❌ [Challenges] Error claiming reward:', error)
      toast.error(error.message || 'Erreur lors de la réclamation')
    } finally {
      setClaiming(null)
    }
  }

  const filteredChallenges = challenges.filter(uc => {
    if (activeFilter === 'all') return true
    return uc.challenge?.type === activeFilter
  })

  const getChallengeIcon = (type) => {
    switch (type) {
      case 'daily':
        return <Clock className="w-5 h-5" />
      case 'weekly':
        return <TrendingUp className="w-5 h-5" />
      case 'monthly':
        return <Trophy className="w-5 h-5" />
      default:
        return <Target className="w-5 h-5" />
    }
  }

  const getChallengeColor = (type) => {
    switch (type) {
      case 'daily':
        return 'text-blue-400'
      case 'weekly':
        return 'text-purple-400'
      case 'monthly':
        return 'text-amber-400'
      default:
        return 'text-gray-400'
    }
  }

  const getChallengeBadgeColor = (type) => {
    switch (type) {
      case 'daily':
        return 'bg-blue-500/20 text-blue-400'
      case 'weekly':
        return 'bg-purple-500/20 text-purple-400'
      case 'monthly':
        return 'bg-amber-500/20 text-amber-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const stats = {
    total: challenges.length,
    completed: challenges.filter(c => c.completed).length,
    inProgress: challenges.filter(c => !c.completed && c.progress > 0).length,
    notStarted: challenges.filter(c => c.progress === 0).length,
  }

  return (
    <DashboardLayoutV3>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              Challenges
            </h1>
            <p className="text-muted-foreground mt-1">
              Complète des défis et gagne des récompenses
            </p>
          </div>

          {/* Stats Cards */}
          <div className="flex gap-3">
            <div className="bg-base-200/50 rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="bg-green-500/10 rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Complétés</div>
            </div>
            <div className="bg-blue-500/10 rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
              <div className="text-xs text-muted-foreground">En cours</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 ${
              activeFilter === 'all'
                ? 'bg-primary text-primary-content shadow-sm'
                : 'bg-base-200/60 hover:bg-base-300/80'
            }`}
          >
            <Target className="w-3 h-3 mr-1.5" />
            Tous ({challenges.length})
          </button>
          <button
            onClick={() => setActiveFilter('daily')}
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 ${
              activeFilter === 'daily'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-base-200/60 hover:bg-base-300/80'
            }`}
          >
            <Clock className="w-3 h-3 mr-1.5" />
            Quotidien ({challenges.filter(c => c.challenge?.type === 'daily').length})
          </button>
          <button
            onClick={() => setActiveFilter('weekly')}
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 ${
              activeFilter === 'weekly'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-base-200/60 hover:bg-base-300/80'
            }`}
          >
            <TrendingUp className="w-3 h-3 mr-1.5" />
            Hebdo ({challenges.filter(c => c.challenge?.type === 'weekly').length})
          </button>
          <button
            onClick={() => setActiveFilter('monthly')}
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 ${
              activeFilter === 'monthly'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-base-200/60 hover:bg-base-300/80'
            }`}
          >
            <Trophy className="w-3 h-3 mr-1.5" />
            Mensuel ({challenges.filter(c => c.challenge?.type === 'monthly').length})
          </button>
        </div>

        {/* Challenges Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="bg-base-200/50 rounded-xl p-12 text-center">
            <Target className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Aucun challenge disponible
            </h3>
            <p className="text-sm text-muted-foreground/70">
              {activeFilter === 'all'
                ? "Les challenges apparaîtront ici une fois créés par l'admin"
                : `Aucun challenge ${activeFilter} actif pour le moment`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChallenges.map((uc) => {
              const challenge = uc.challenge
              if (!challenge) return null

              const isCompleted = uc.completed
              const isClaimed = uc.claimed
              const canClaim = isCompleted && !isClaimed
              const progressPercentage = uc.progressPercentage

              return (
                <div
                  key={uc.id}
                  className={`bg-base-200/50 rounded-xl p-5 border-2 transition-all hover:shadow-lg ${
                    isCompleted
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-base-300 hover:border-primary/50'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-lg bg-base-300/50 ${getChallengeColor(challenge.type)}`}>
                      {getChallengeIcon(challenge.type)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getChallengeBadgeColor(challenge.type)}>
                        {challenge.type === 'daily' && 'Quotidien'}
                        {challenge.type === 'weekly' && 'Hebdo'}
                        {challenge.type === 'monthly' && 'Mensuel'}
                      </Badge>
                      {isCompleted && (
                        <Badge className="bg-green-500/20 text-green-400">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Complété
                        </Badge>
                      )}
                      {isClaimed && (
                        <Badge className="bg-amber-500/20 text-amber-400">
                          <Gift className="w-3 h-3 mr-1" />
                          Réclamé
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold mb-2">{challenge.title}</h3>
                  {challenge.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {challenge.description.replace(/<[^>]*>/g, '')}
                    </p>
                  )}

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        Progression
                      </span>
                      <span className="text-xs font-semibold">
                        {uc.progress} / {challenge.goal_value}
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.round(progressPercentage)}% complété
                    </div>
                  </div>

                  {/* Reward & Action */}
                  <div className="flex items-center justify-between pt-4 border-t border-base-300">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-amber-400">
                        +{challenge.points_reward} pts
                      </span>
                    </div>

                    {canClaim ? (
                      <Button
                        size="sm"
                        onClick={() => handleClaimReward(challenge.id, challenge.title, challenge.points_reward)}
                        disabled={claiming === challenge.id}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        {claiming === challenge.id ? (
                          <>
                            <div className="loading loading-spinner loading-xs mr-1"></div>
                            Réclamation...
                          </>
                        ) : (
                          <>
                            <Gift className="w-4 h-4 mr-1" />
                            Réclamer
                          </>
                        )}
                      </Button>
                    ) : isClaimed ? (
                      <Button size="sm" disabled className="bg-base-300">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Réclamé
                      </Button>
                    ) : (
                      <Button size="sm" disabled className="bg-base-300">
                        <Lock className="w-4 h-4 mr-1" />
                        En cours
                      </Button>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t border-base-300">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(challenge.start_date).toLocaleDateString('fr-FR')} →{' '}
                      {new Date(challenge.end_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayoutV3>
  )
}
