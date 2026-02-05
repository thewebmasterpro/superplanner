import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Zap, Flame } from 'lucide-react'
import { useGamificationStore } from '../stores/gamificationStore'
import { gamificationService } from '../services/gamification.service'
import pb from '../lib/pocketbase'
import toast from 'react-hot-toast'

/**
 * GamificationBadge - Displays user's points, level, and streak in navbar
 */
export default function GamificationBadge() {
  const navigate = useNavigate()
  const { userPoints, loading, error, fetchUserPoints } = useGamificationStore()
  const user = pb.authStore.model
  const previousPoints = useRef(null)
  const previousLevel = useRef(null)
  const hasShownDailyLogin = useRef(false)
  const [animatePoints, setAnimatePoints] = useState(false)
  const [animateLevel, setAnimateLevel] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserPoints(user.id)

      // Handle daily login bonus (only once per session)
      if (!hasShownDailyLogin.current) {
        gamificationService.onDailyLogin(user.id)
          .then(result => {
            if (result?.success && result?.pointsAwarded > 0) {
              toast.success(`🎉 +${result.pointsAwarded} points pour votre connexion quotidienne!`, {
                duration: 4000,
                icon: '🔥'
              })

              // Show streak notifications
              if (result.streakMaintained) {
                const days = result.updatedPoints?.streak_days || 0
                toast.success(`🔥 Série maintenue: ${days} jour${days > 1 ? 's' : ''} consécutif${days > 1 ? 's' : ''}!`, {
                  duration: 3000
                })
              }

              if (result.streakLost) {
                toast.error(`💔 Série perdue... Recommencez dès aujourd'hui!`, {
                  duration: 4000
                })
              }

              // Show level up notification
              if (result.levelUp) {
                toast.success(`🎊 Niveau ${result.newLevel} atteint!`, {
                  duration: 5000,
                  icon: '🏆'
                })
              }
            }
            hasShownDailyLogin.current = true
          })
          .catch(console.error)
      }
    }
  }, [user?.id])

  // Watch for point changes and show notifications
  useEffect(() => {
    if (userPoints && previousPoints.current !== null) {
      const pointsDiff = userPoints.points - previousPoints.current
      const levelDiff = userPoints.level - (previousLevel.current || 0)

      // Trigger animations
      if (pointsDiff > 0) {
        setAnimatePoints(true)
        setTimeout(() => setAnimatePoints(false), 1000)
      }

      if (levelDiff > 0) {
        setAnimateLevel(true)
        setTimeout(() => setAnimateLevel(false), 1000)
      }

      // Level up notification
      if (levelDiff > 0) {
        toast.success(`🎊 Niveau ${userPoints.level} atteint!`, {
          duration: 5000,
          icon: '🏆'
        })
      }

      // Points gained notification (excluding level up scenario to avoid duplicate toasts)
      if (pointsDiff > 0 && levelDiff === 0) {
        toast.success(`+${pointsDiff} points`, {
          duration: 2000,
          icon: '⚡'
        })
      }
    }

    // Update refs
    if (userPoints) {
      previousPoints.current = userPoints.points
      previousLevel.current = userPoints.level
    }
  }, [userPoints?.points, userPoints?.level])

  if (!user || loading || error || !userPoints) {
    return null
  }

  const handleClick = () => {
    navigate('/gamification')
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-base-200 border border-base-300 hover:border-primary/40 hover:bg-base-300 transition-all group"
      title="Voir vos récompenses et défis"
    >
      {/* Level */}
      <div className={`flex items-center gap-1.5 transition-transform ${animateLevel ? 'animate-bounce' : ''}`}>
        <Trophy className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-bold text-yellow-500">
          Niv. {userPoints.level}
        </span>
      </div>

      {/* Points */}
      <div className={`flex items-center gap-1.5 transition-transform ${animatePoints ? 'animate-pulse scale-110' : ''}`}>
        <Zap className={`w-4 h-4 text-purple-400 ${animatePoints ? 'animate-ping' : ''}`} />
        <span className="text-sm font-semibold text-purple-400">
          {userPoints.points.toLocaleString()}
        </span>
      </div>

      {/* Streak */}
      {userPoints.streak_days > 0 && (
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-orange-500 group-hover:animate-pulse" />
          <span className="text-sm font-semibold text-orange-500">
            {userPoints.streak_days}
          </span>
        </div>
      )}
    </button>
  )
}
