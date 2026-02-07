import { useState } from 'react'
import { useTeamPool, useClaimTask, useCreatePoolTask } from '../hooks/useTaskPool'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useUIStore } from '../stores/uiStore'
import { Hand, Calendar, Inbox, Clock, Flag, Loader2, Plus, X } from 'lucide-react'
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

/**
 * TeamPoolManager - Composant réutilisable pour gérer le pool de tâches d'une équipe
 * Utilisé dans TeamSettings (onglet Pool) et TeamPoolPage (page dédiée)
 */
export function TeamPoolManager({ teamId, teamName }) {
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)
  const { setModalTask, setTaskModalOpen } = useUIStore()
  const { data: poolTasks = [], isLoading } = useTeamPool(teamId)
  const claimTask = useClaimTask()
  const createPoolTask = useCreatePoolTask()

  const [claimingId, setClaimingId] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: '', claim_deadline: '' })

  const handleCreatePoolTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim() || !teamId) return

    await createPoolTask.mutateAsync({
      data: {
        ...newTask,
        type: 'task',
        context_id: activeWorkspaceId || null,
      },
      teamId,
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
    const colors = { low: 'badge-info', medium: 'badge-warning', high: 'badge-error' }
    return colors[priority] || 'badge-ghost'
  }

  const getPriorityIcon = (priority) => {
    if (priority === 'high') return '🔥'
    if (priority === 'medium') return '⚡'
    return '📌'
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm uppercase opacity-60 flex items-center gap-2">
            <Hand className="w-4 h-4" />
            Pool de tâches ({poolTasks.length})
          </h3>
          {teamName && (
            <p className="text-xs text-muted-foreground mt-1">
              Tâches disponibles pour <strong>{teamName}</strong>
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          {showCreateForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showCreateForm ? 'Annuler' : 'Nouvelle tâche'}
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <form onSubmit={handleCreatePoolTask} className="p-4 rounded-2xl bg-base-200/30 dark:bg-white/5 border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <Label htmlFor="pool-due">Échéance</Label>
              <Input
                id="pool-due"
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pool-claim-deadline">Limite claim</Label>
              <Input
                id="pool-claim-deadline"
                type="date"
                value={newTask.claim_deadline}
                onChange={(e) => setNewTask({ ...newTask, claim_deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={!newTask.title.trim() || createPoolTask.isPending} className="gap-2">
              {createPoolTask.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Ajouter au pool
            </Button>
          </div>
        </form>
      )}

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : poolTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 opacity-20" />
          </div>
          <p className="text-sm font-bold mb-1">Le pool est vide</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Cliquez sur "Nouvelle tâche" pour ajouter une tâche au pool.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {poolTasks.map(task => {
            const isExpiringSoon = task.claim_deadline &&
              (new Date(task.claim_deadline) - new Date()) < 24 * 60 * 60 * 1000

            return (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-base-200/30 dark:bg-black/30 rounded-2xl hover:bg-base-200/50 dark:hover:bg-black/40 transition-colors border border-transparent hover:border-base-300 dark:border-white/10 dark:hover:border-white/20 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => handleViewTask(task)}
                      className="font-bold text-sm text-left truncate group-hover:text-primary transition-colors"
                    >
                      {task.title}
                    </button>
                    <span className={`badge badge-xs ${getPriorityColor(task.priority)} gap-1 shrink-0`}>
                      {getPriorityIcon(task.priority)} {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs opacity-50 line-clamp-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs opacity-50">
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.due_date), 'dd MMM', { locale: fr })}
                      </span>
                    )}
                    {task.claim_deadline && (
                      <span className={`flex items-center gap-1 ${isExpiringSoon ? 'text-warning font-bold opacity-100' : ''}`}>
                        <Clock className="w-3 h-3" />
                        Limite: {format(new Date(task.claim_deadline), 'dd MMM', { locale: fr })}
                        {isExpiringSoon && <Flag className="w-3 h-3 text-warning" />}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleClaim(task)}
                  disabled={claimingId === task.id}
                  className="gap-2 ml-3 shrink-0"
                >
                  {claimingId === task.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Hand className="w-4 h-4" />
                      <span className="hidden sm:inline">Prendre</span>
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
