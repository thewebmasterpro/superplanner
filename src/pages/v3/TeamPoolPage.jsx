import DashboardLayoutV3 from '../../components/layout/DashboardLayoutV3'
import { useUserStore } from '../../stores/userStore'
import { useTeamPool } from '../../hooks/useTaskPool'
import { Hand, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard, StatsCardGroup } from '@/components/ui/StatsCard'
import { TeamPoolManager } from '../../components/TeamPoolManager'

function TeamPoolPageContent() {
  const { currentTeam } = useUserStore()
  const { data: poolTasks = [] } = useTeamPool(currentTeam?.id)

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
      <PageHeader
        dataTour="pool-header"
        icon={Hand}
        title="Pool de Tâches"
        description={<>Tâches disponibles pour l'équipe <strong>{currentTeam.name}</strong></>}
      />

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

      {/* Pool Manager */}
      <div data-tour="pool-tasks" className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all">
        <div className="card-body">
          <TeamPoolManager teamId={currentTeam.id} teamName={currentTeam.name} />
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
