import { useState } from 'react'
import DashboardLayoutV3 from '../../components/layout/DashboardLayoutV3'
import { useUserStore } from '../../stores/userStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useTeamPool, useClaimTask, useCreatePoolTask } from '../../hooks/useTaskPool'
import { useUIStore } from '../../stores/uiStore'
import { Hand, Calendar, AlertCircle, Inbox, Clock, Flag, Loader2, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard, StatsCardGroup } from '@/components/ui/StatsCard'

function TeamPoolPageContent() {
  const { currentTeam } = useUserStore()
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)
  const { setModalTask, setTaskModalOpen } = useUIStore()
  const { data: poolTasks = [], isLoading } = useTeamPool(currentTeam?.id)
  const claimTask = useClaimTask()
  const createPoolTask = useCreatePoolTask()

  const [claimingId, setClaimingId] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: '', claim_deadline: '' })

  const handleCreatePoolTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim() || !currentTeam?.id) return

    await createPoolTask.mutateAsync({
      data: {
        ...newTask,
        type: 'task',
        context_id: activeWorkspaceId || null,
      },
      teamId: currentTeam.id,
    })

    setNewTask({ title: '', description: '', priority: 'medium', due_date: '', claim_deadline: '' })
    setShowCreateForm(false)
  }

  const handleClaim = async (task) => {
    setClaimingId(task.id)
    try {
      await claimTask.mutateAsync(task.id)
    } finally {
      setClaimingId(null)
    }
  }

  const handleViewTask = (task) => {
    setModalTask(task)
    setTaskModalOpen(true)
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'badge-info',
      medium: 'badge-warning',
      high: 'badge-error'
    }
    return colors[priority] || 'badge-ghost'
  }

  const getPriorityIcon = (priority) => {
    if (priority === 'high') return '🔥'
    if (priority === 'medium') return '⚡'
    return '📌'
  }

  if (!currentTeam) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="w-16 h-16 text-warning mb-4" />
          <h2 className="text-2xl font-bold mb-2">Aucune équipe sélectionnée</h2>
          <p className="text-muted-foreground max-w-md">
            Vous devez faire partie d'une équipe pour accéder au pool de tâches.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          dataTour="pool-header"
          icon={Hand}
          title="Pool de Tâches"
          description={<>Tâches disponibles pour l'équipe <strong>{currentTeam.name}</strong></>}
        />
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreateForm ? 'Annuler' : 'Créer une tâche pool'}
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <form onSubmit={handleCreatePoolTask} className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-primary/30 dark:border-purple-500/50 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="card-body p-6 space-y-4">
            <h3 className="font-bold text-sm uppercase opacity-50">Nouvelle tâche pour le pool</h3>

            <div className="space-y-2">
              <Label htmlFor="pool-title">Titre *</Label>
              <Input
                id="pool-title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Ex: Préparer le rapport mensuel"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pool-description">Description</Label>
              <Textarea
                id="pool-description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Détails optionnels..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">📌 Basse</SelectItem>
                    <SelectItem value="medium">⚡ Moyenne</SelectItem>
                    <SelectItem value="high">🔥 Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pool-due">Date d'échéance</Label>
                <Input
                  id="pool-due"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pool-claim-deadline">Limite pour prendre</Label>
                <Input
                  id="pool-claim-deadline"
                  type="date"
                  value={newTask.claim_deadline}
                  onChange={(e) => setNewTask({ ...newTask, claim_deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={!newTask.title.trim() || createPoolTask.isPending} className="gap-2">
                {createPoolTask.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Ajouter au pool
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Stats */}
      <StatsCardGroup cols={3} data-tour="pool-stats">
        <StatsCard
          title="Disponibles"
          value={poolTasks.length}
          className="text-primary"
        />
        <StatsCard
          title="Priorité haute"
          value={poolTasks.filter(t => t.priority === 'high').length}
          className="text-error"
        />
        <StatsCard
          title="Urgentes"
          value={poolTasks.filter(t => {
            if (!t.due_date && !t.claim_deadline) return false
            const deadline = new Date(t.claim_deadline || t.due_date)
            const now = new Date()
            const diff = deadline - now
            return diff < 3 * 24 * 60 * 60 * 1000 && diff > 0
          }).length}
          className="text-warning"
        />
      </StatsCardGroup>

      {/* Tasks List */}
      <div data-tour="pool-tasks" className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-20">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : poolTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-6">
                <Inbox className="w-10 h-10 opacity-20" />
              </div>
              <h3 className="text-xl font-bold mb-2">Le pool est vide</h3>
              <p className="text-muted-foreground max-w-xs">
                Aucune tâche disponible pour le moment. Cliquez sur "Créer une tâche pool" pour en ajouter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead className="bg-base-200 dark:bg-black/30">
                  <tr>
                    <th>Tâche</th>
                    <th>Priorité</th>
                    <th>Deadline</th>
                    <th>Limite claim</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {poolTasks.map(task => {
                    const isExpiringSoon = task.claim_deadline &&
                      (new Date(task.claim_deadline) - new Date()) < 24 * 60 * 60 * 1000

                    return (
                      <tr key={task.id} className="hover group transition-colors">
                        <td>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleViewTask(task)}
                              className="font-bold text-left text-base-content/80 group-hover:text-primary transition-colors"
                            >
                              {task.title}
                            </button>
                            {task.description && (
                              <p className="text-xs opacity-60 line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {task.project_id && (
                                <span className="badge badge-xs bg-base-200 border-none">
                                  Projet
                                </span>
                              )}
                              {task.category_id && (
                                <span className="badge badge-xs bg-base-200 border-none">
                                  Catégorie
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getPriorityColor(task.priority)} gap-1`}>
                            <span>{getPriorityIcon(task.priority)}</span>
                            {task.priority}
                          </span>
                        </td>
                        <td>
                          {task.due_date ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3.5 h-3.5 opacity-50" />
                              {format(new Date(task.due_date), 'dd MMM yyyy', { locale: fr })}
                            </div>
                          ) : (
                            <span className="text-xs opacity-40">-</span>
                          )}
                        </td>
                        <td>
                          {task.claim_deadline ? (
                            <div className={`flex items-center gap-1 text-sm ${isExpiringSoon ? 'text-warning font-bold' : ''}`}>
                              <Clock className="w-3.5 h-3.5" />
                              {format(new Date(task.claim_deadline), 'dd MMM', { locale: fr })}
                              {isExpiringSoon && <Flag className="w-3.5 h-3.5 ml-1 text-warning" />}
                            </div>
                          ) : (
                            <span className="text-xs opacity-40">Aucune limite</span>
                          )}
                        </td>
                        <td className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleClaim(task)}
                            disabled={claimingId === task.id}
                            className="gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95"
                          >
                            {claimingId === task.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Hand className="w-4 h-4" />
                                <span className="hidden md:inline">Prendre</span>
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Help Card */}
      <div data-tour="pool-help" className="card bg-info/10 border border-info/20 shadow-sm">
        <div className="card-body p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-info shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-bold text-sm">Comment ça marche ?</h3>
              <ul className="text-xs space-y-1 opacity-80">
                <li>• <strong>Prendre une tâche</strong> : Cliquez sur "Prendre" pour vous assigner la tâche</li>
                <li>• <strong>Limite de claim</strong> : Certaines tâches ont une date limite pour être prises</li>
                <li>• <strong>Libérer une tâche</strong> : Si vous êtes bloqué, retournez-la au pool depuis vos tâches</li>
                <li>• <strong>Priorités</strong> : Les tâches urgentes sont marquées 🔥, moyennes ⚡, basses 📌</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TeamPoolPage() {
  return (
    <DashboardLayoutV3>
      <TeamPoolPageContent />
    </DashboardLayoutV3>
  )
}
