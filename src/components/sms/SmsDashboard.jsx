import {
  MessageSquare, Send, CheckCircle, XCircle, Smartphone,
  Users, Layers, TrendingUp
} from 'lucide-react'
import { useSmsStats } from '../../hooks/useSms'

export function SmsDashboard() {
  const { data: stats, isLoading } = useSmsStats()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card bg-base-100 shadow animate-pulse">
            <div className="card-body p-4">
              <div className="h-4 bg-base-300 rounded w-24 mb-2" />
              <div className="h-8 bg-base-300 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const statCards = [
    { label: 'Messages Total', value: stats?.totalMessages || 0, icon: MessageSquare, color: 'text-primary' },
    { label: 'Envoyés', value: stats?.sentCount || 0, icon: Send, color: 'text-info' },
    { label: 'Délivrés', value: stats?.deliveredCount || 0, icon: CheckCircle, color: 'text-success' },
    { label: 'Échoués', value: stats?.failedCount || 0, icon: XCircle, color: 'text-error' },
    { label: 'Appareils', value: stats?.totalDevices || 0, icon: Smartphone, color: 'text-warning' },
    { label: 'Campagnes', value: stats?.totalCampaigns || 0, icon: Layers, color: 'text-secondary' },
    { label: 'Groupes', value: stats?.totalGroups || 0, icon: Users, color: 'text-accent' },
    { label: 'Taux de livraison', value: `${stats?.deliveryRate || 0}%`, icon: TrendingUp, color: 'text-success' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-base-content/60 uppercase tracking-wider">
                    {card.label}
                  </span>
                  <Icon className={cn('w-5 h-5', card.color)} />
                </div>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Start Guide */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h3 className="card-title text-lg">Guide de démarrage rapide</h3>
          <div className="steps steps-vertical lg:steps-horizontal w-full mt-4">
            <div className="step step-primary">
              <div className="text-sm mt-2">
                <strong>1. Ajouter un appareil</strong>
                <p className="text-xs text-base-content/60">Enregistrez votre Android avec son numéro</p>
              </div>
            </div>
            <div className="step step-primary">
              <div className="text-sm mt-2">
                <strong>2. Créer un groupe</strong>
                <p className="text-xs text-base-content/60">Importez vos contacts via CSV</p>
              </div>
            </div>
            <div className="step step-primary">
              <div className="text-sm mt-2">
                <strong>3. Lancer une campagne</strong>
                <p className="text-xs text-base-content/60">Envoyez des SMS personnalisés en masse</p>
              </div>
            </div>
            <div className="step step-primary">
              <div className="text-sm mt-2">
                <strong>4. Suivre les résultats</strong>
                <p className="text-xs text-base-content/60">Consultez les stats en temps réel</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Info Card */}
      <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 shadow-md">
        <div className="card-body">
          <h3 className="card-title text-lg">API & Intégrations</h3>
          <p className="text-sm text-base-content/70">
            Intégrez l'envoi de SMS dans vos applications via notre API REST.
            Utilisez les webhooks pour recevoir les notifications de livraison.
          </p>
          <div className="mt-3 mockup-code bg-base-300 text-sm">
            <pre data-prefix="$"><code>POST /api/collections/sms_messages/records</code></pre>
            <pre data-prefix=">" className="text-success"><code>{'{ "recipient": "+33...", "body": "Hello {{name}}!" }'}</code></pre>
          </div>
          <p className="text-xs text-base-content/50 mt-2">
            Variables disponibles : {'{{name}}'}, {'{{phone}}'}, {'{{email}}'}
          </p>
        </div>
      </div>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
