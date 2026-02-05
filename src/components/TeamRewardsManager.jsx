import { useState, useEffect } from 'react'
import { Gift, Plus, Award, History, Users, X, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { gamificationService } from '../services/gamification.service'
import { teamsService } from '../services/teams.service'
import toast from 'react-hot-toast'

/**
 * TeamRewardsManager - Interface for team leaders to create and award rewards
 */
export function TeamRewardsManager({ teamId, isLeader }) {
  const [rewards, setRewards] = useState([])
  const [members, setMembers] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeView, setActiveView] = useState('rewards') // 'rewards', 'award', 'history'

  // Create reward modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    points: 50,
    start_date: '',
    end_date: ''
  })

  // Award reward modal
  const [awardModalOpen, setAwardModalOpen] = useState(false)
  const [selectedReward, setSelectedReward] = useState(null)
  const [selectedMember, setSelectedMember] = useState('')
  const [awardReason, setAwardReason] = useState('')

  useEffect(() => {
    if (teamId) {
      loadData()
    }
  }, [teamId])

  const loadData = async () => {
    console.log('🔄 [TeamRewardsManager] Loading data for team:', teamId)
    setLoading(true)
    try {
      const [rewardsData, membersData, historyData] = await Promise.all([
        gamificationService.getTeamRewards(teamId),
        teamsService.getTeamMembers(teamId),
        gamificationService.getTeamRewardHistory(teamId, 20)
      ])
      console.log('🔄 [TeamRewardsManager] Data loaded:', {
        rewards: rewardsData.length,
        members: membersData.length,
        history: historyData.length
      })
      setRewards(rewardsData)
      setMembers(membersData)
      setHistory(historyData)
    } catch (error) {
      console.error('❌ [TeamRewardsManager] Error loading data:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReward = async (e) => {
    e.preventDefault()
    if (!rewardForm.name.trim() || rewardForm.points <= 0) {
      toast.error('Nom et points requis')
      return
    }

    // Validate dates
    if (rewardForm.start_date && rewardForm.end_date) {
      if (new Date(rewardForm.end_date) < new Date(rewardForm.start_date)) {
        toast.error('La date de fin doit être après la date de début')
        return
      }
    }

    setLoading(true)
    try {
      await gamificationService.createTeamReward(teamId, rewardForm)
      toast.success('Récompense créée!')
      setCreateModalOpen(false)
      setRewardForm({ name: '', description: '', points: 50, start_date: '', end_date: '' })
      loadData()
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReward = async (rewardId, rewardName) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la récompense "${rewardName}" ?`)) {
      return
    }

    setLoading(true)
    try {
      await gamificationService.deleteTeamReward(teamId, rewardId)
      toast.success('Récompense supprimée!')
      loadData()
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la suppression')
    } finally {
      setLoading(false)
    }
  }

  const handleAwardReward = async (e) => {
    e.preventDefault()
    if (!selectedMember) {
      toast.error('Sélectionnez un membre')
      return
    }

    setLoading(true)
    try {
      const result = await gamificationService.awardTeamReward(
        teamId,
        selectedReward.id,
        selectedMember,
        awardReason
      )

      if (result?.pointsAwarded) {
        toast.success(`🎉 ${result.pointsAwarded} points attribués!`)
      } else {
        toast.success('Récompense attribuée!')
      }

      setAwardModalOpen(false)
      setSelectedReward(null)
      setSelectedMember('')
      setAwardReason('')
      loadData()
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'attribution')
    } finally {
      setLoading(false)
    }
  }

  const openAwardModal = (reward) => {
    setSelectedReward(reward)
    setAwardModalOpen(true)
  }

  if (!isLeader) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            Seuls les chefs d'équipe peuvent gérer les récompenses
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={activeView === 'rewards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('rewards')}
          >
            <Gift className="w-4 h-4 mr-2" />
            Récompenses
          </Button>
          <Button
            variant={activeView === 'history' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('history')}
          >
            <History className="w-4 h-4 mr-2" />
            Historique
          </Button>
        </div>

        {activeView === 'rewards' && (
          <Button size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle récompense
          </Button>
        )}
      </div>

      {/* Content */}
      {activeView === 'rewards' ? (
        // Rewards List
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rewards.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-2">Aucune récompense</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Créez des récompenses pour motiver votre équipe
                </p>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer la première récompense
                </Button>
              </CardContent>
            </Card>
          ) : (
            rewards.map((reward) => (
              <Card key={reward.id} className="hover:border-purple-500/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-400" />
                      <CardTitle className="text-base">{reward.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                        {reward.points} pts
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteReward(reward.id, reward.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {reward.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {reward.description}
                    </p>
                  )}
                  {(reward.start_date || reward.end_date) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {reward.start_date && new Date(reward.start_date).toLocaleDateString('fr-FR')}
                        {reward.start_date && reward.end_date && ' → '}
                        {reward.end_date && new Date(reward.end_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => openAwardModal(reward)}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Attribuer
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        // History View
        <Card>
          <CardContent className="p-0">
            {history.length === 0 ? (
              <div className="p-12 text-center">
                <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Aucune récompense attribuée pour le moment
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Récompense
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Membre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Raison
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(entry.date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {entry.rewardName}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {entry.memberName}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                            +{entry.points} pts
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {entry.reason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Reward Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une récompense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateReward} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reward-name">Nom de la récompense *</Label>
              <Input
                id="reward-name"
                value={rewardForm.name}
                onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                placeholder="Ex: Meilleur contributeur du mois"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward-description">Description</Label>
              <Input
                id="reward-description"
                value={rewardForm.description}
                onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                placeholder="Description de la récompense (optionnel)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward-points">Points *</Label>
              <Input
                id="reward-points"
                type="number"
                min="1"
                value={rewardForm.points}
                onChange={(e) => setRewardForm({ ...rewardForm, points: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reward-start-date">Date de début</Label>
                <Input
                  id="reward-start-date"
                  type="date"
                  value={rewardForm.start_date}
                  onChange={(e) => setRewardForm({ ...rewardForm, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward-end-date">Date de fin</Label>
                <Input
                  id="reward-end-date"
                  type="date"
                  value={rewardForm.end_date}
                  onChange={(e) => setRewardForm({ ...rewardForm, end_date: e.target.value })}
                  min={rewardForm.start_date}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Award Reward Modal */}
      <Dialog open={awardModalOpen} onOpenChange={setAwardModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Attribuer: {selectedReward?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAwardReward} className="space-y-4">
            <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Points à attribuer:</span>
                <Badge className="bg-purple-500 text-white">
                  +{selectedReward?.points} points
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-select">Sélectionner un membre *</Label>
              <select
                id="member-select"
                className="w-full border rounded-md p-2"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                required
              >
                <option value="">-- Choisir un membre --</option>
                {members.map((member) => (
                  <option key={member.id} value={member.user_id}>
                    {member.expand?.user_id?.name || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="award-reason">Raison (optionnel)</Label>
              <Input
                id="award-reason"
                value={awardReason}
                onChange={(e) => setAwardReason(e.target.value)}
                placeholder="Ex: Excellent travail sur le projet X"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAwardModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                <Gift className="w-4 h-4 mr-2" />
                Attribuer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
