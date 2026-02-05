import { useState, useEffect } from 'react'
import { Target, Trophy, Clock, TrendingUp, Plus, Trash2, Calendar, Pencil } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { gamificationService } from '../services/gamification.service'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

export default function TeamChallengesManager({ teamId, onClose }) {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingChallengeId, setEditingChallengeId] = useState(null)
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    type: 'daily',
    goal_metric: 'tasks_completed',
    goal_value: 5,
    points_reward: 50,
    icon: 'Target',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  useEffect(() => {
    loadChallenges()
  }, [teamId])

  const loadChallenges = async () => {
    console.log('🎯 [TeamChallengesManager] Loading challenges for team:', teamId)
    setLoading(true)
    try {
      const allChallenges = await gamificationService.getActiveChallenges()
      // Filter challenges for this team
      const teamChallenges = allChallenges.filter(c => c.team_id === teamId)
      console.log('🎯 [TeamChallengesManager] Team challenges:', teamChallenges)
      setChallenges(teamChallenges)
    } catch (error) {
      console.error('❌ [TeamChallengesManager] Error loading challenges:', error)
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChallenge = async () => {
    console.log('🎯 [TeamChallengesManager] Creating/updating challenge:', challengeForm)

    // Validation
    if (!challengeForm.title.trim()) {
      toast.error('Le titre est requis')
      return
    }

    if (challengeForm.start_date && challengeForm.end_date) {
      if (new Date(challengeForm.end_date) < new Date(challengeForm.start_date)) {
        toast.error('La date de fin doit être après la date de début')
        return
      }
    }

    try {
      if (editingChallengeId) {
        // Update existing challenge
        await gamificationService.updateChallenge(editingChallengeId, challengeForm, teamId)
        toast.success('Défi modifié!', { icon: '🎯' })
      } else {
        // Create new challenge
        await gamificationService.createChallenge(challengeForm, teamId)
        toast.success('Défi créé!', { icon: '🎯' })
      }
      handleCloseModal()
      loadChallenges()
    } catch (error) {
      console.error('❌ [TeamChallengesManager] Error:', error)
      toast.error(error.message || `Erreur de ${editingChallengeId ? 'modification' : 'création'}`)
    }
  }

  const handleEditChallenge = (challenge) => {
    setEditingChallengeId(challenge.id)
    setChallengeForm({
      title: challenge.title,
      description: challenge.description || '',
      type: challenge.type,
      goal_metric: challenge.goal_metric,
      goal_value: challenge.goal_value,
      points_reward: challenge.points_reward,
      icon: challenge.icon || 'Target',
      start_date: challenge.start_date,
      end_date: challenge.end_date,
    })
    setShowCreateModal(true)
  }

  const handleDeleteChallenge = async (challengeId, challengeTitle) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le défi "${challengeTitle}" ?`)) {
      return
    }

    try {
      await gamificationService.deleteChallenge(challengeId, teamId)
      toast.success('Défi supprimé!', { icon: '🗑️' })
      loadChallenges()
    } catch (error) {
      console.error('❌ [TeamChallengesManager] Error deleting challenge:', error)
      toast.error(error.message || 'Erreur de suppression')
    }
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingChallengeId(null)
    setChallengeForm({
      title: '',
      description: '',
      type: 'daily',
      goal_metric: 'tasks_completed',
      goal_value: 5,
      points_reward: 50,
      icon: 'Target',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
  }

  const getTypeLabel = (type) => {
    switch (type) {
      case 'daily': return 'Quotidien'
      case 'weekly': return 'Hebdomadaire'
      case 'monthly': return 'Mensuel'
      default: return type
    }
  }

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'daily': return 'bg-blue-500/20 text-blue-400'
      case 'weekly': return 'bg-purple-500/20 text-purple-400'
      case 'monthly': return 'bg-amber-500/20 text-amber-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getMetricLabel = (metric) => {
    switch (metric) {
      case 'tasks_completed': return 'Tâches complétées'
      case 'hours_tracked': return 'Heures trackées'
      case 'streak_days': return 'Jours de série'
      default: return metric
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Défis d'équipe</h3>
          <p className="text-sm text-muted-foreground">
            Créez des défis pour motiver votre équipe
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau défi
        </Button>
      </div>

      {/* Challenges List */}
      {challenges.length === 0 ? (
        <div className="bg-base-200/50 rounded-xl p-12 text-center">
          <Target className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Aucun défi créé
          </h3>
          <p className="text-sm text-muted-foreground/70 mb-4">
            Créez des défis pour motiver les membres de votre équipe
          </p>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Créer le premier défi
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-base-200/50 rounded-xl p-5 border-2 border-base-300 hover:border-primary/50 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold">{challenge.title}</h4>
                    <Badge className={getTypeBadgeColor(challenge.type)}>
                      {getTypeLabel(challenge.type)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                    onClick={() => handleEditChallenge(challenge)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDeleteChallenge(challenge.id, challenge.title)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Description */}
              {challenge.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {challenge.description.replace(/<[^>]*>/g, '')}
                </p>
              )}

              {/* Goal */}
              <div className="bg-base-100 rounded-lg p-3 mb-3">
                <div className="text-xs text-muted-foreground mb-1">Objectif</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {getMetricLabel(challenge.goal_metric)}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {challenge.goal_value}
                  </span>
                </div>
              </div>

              {/* Reward & Dates */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-amber-400">
                    +{challenge.points_reward} pts
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(challenge.start_date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                    {' → '}
                    {new Date(challenge.end_date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold mb-6">
              {editingChallengeId ? 'Modifier le défi' : 'Créer un nouveau défi'}
            </h3>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Titre *</label>
                <input
                  type="text"
                  value={challengeForm.title}
                  onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="Ex: Productivité de la semaine"
                />
              </div>

              {/* Type & Metric */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type *</label>
                  <select
                    value={challengeForm.type}
                    onChange={(e) => setChallengeForm({ ...challengeForm, type: e.target.value })}
                    className="select select-bordered w-full"
                  >
                    <option value="daily">Quotidien</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Métrique *</label>
                  <select
                    value={challengeForm.goal_metric}
                    onChange={(e) => setChallengeForm({ ...challengeForm, goal_metric: e.target.value })}
                    className="select select-bordered w-full"
                  >
                    <option value="tasks_completed">Tâches complétées</option>
                    <option value="hours_tracked">Heures trackées</option>
                    <option value="streak_days">Jours de série</option>
                  </select>
                </div>
              </div>

              {/* Goal Value & Points */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Valeur objectif *</label>
                  <input
                    type="number"
                    min="1"
                    value={challengeForm.goal_value}
                    onChange={(e) => setChallengeForm({ ...challengeForm, goal_value: parseInt(e.target.value) })}
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Points récompense *</label>
                  <input
                    type="number"
                    min="1"
                    value={challengeForm.points_reward}
                    onChange={(e) => setChallengeForm({ ...challengeForm, points_reward: parseInt(e.target.value) })}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date de début *</label>
                  <input
                    type="date"
                    value={challengeForm.start_date}
                    onChange={(e) => setChallengeForm({ ...challengeForm, start_date: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date de fin *</label>
                  <input
                    type="date"
                    value={challengeForm.end_date}
                    onChange={(e) => setChallengeForm({ ...challengeForm, end_date: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={challengeForm.description}
                  onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
                  className="textarea textarea-bordered w-full"
                  rows="3"
                  placeholder="Décrivez le défi..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateChallenge}
                className="flex-1 gap-2"
              >
                {editingChallengeId ? (
                  <>
                    <Pencil className="w-4 h-4" />
                    Modifier
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Créer
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
