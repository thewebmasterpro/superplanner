import { useState } from 'react'
import {
  Plus, Send, MoreVertical, Trash2, Edit2, Loader2,
  Rocket, Clock, CheckCircle, XCircle, FileText
} from 'lucide-react'
import { useSmsCampaigns } from '../../hooks/useSms'
import { SmsCampaignModal } from './SmsCampaignModal'
import { format } from 'date-fns'

const statusConfig = {
  draft: { label: 'Brouillon', badge: 'badge-ghost', icon: FileText },
  scheduled: { label: 'Programmée', badge: 'badge-warning', icon: Clock },
  sent: { label: 'Envoyée', badge: 'badge-success', icon: CheckCircle },
  failed: { label: 'Échouée', badge: 'badge-error', icon: XCircle },
}

export function SmsCampaignsList() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const { campaigns, isLoading, deleteCampaign, launchCampaign, isLaunching } = useSmsCampaigns({ status: statusFilter, search })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [menuOpenId, setMenuOpenId] = useState(null)

  const handleLaunch = (campaign) => {
    if (!confirm(`Envoyer la campagne "${campaign.name}" ? Cette action est irréversible.`)) return
    launchCampaign(campaign.id)
    setMenuOpenId(null)
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer cette campagne ?')) return
    deleteCampaign(id)
    setMenuOpenId(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'draft', 'scheduled', 'sent'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`btn btn-xs ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
            >
              {s === 'all' ? 'Toutes' : statusConfig[s]?.label || s}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditingCampaign(null); setIsModalOpen(true) }}
          className="btn btn-primary btn-sm gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle campagne
        </button>
      </div>

      <input
        type="text"
        placeholder="Rechercher une campagne..."
        className="input input-bordered input-sm w-full max-w-xs"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {campaigns.length === 0 ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center py-12">
            <Send className="w-16 h-16 text-base-content/20 mb-4" />
            <h3 className="text-lg font-semibold">Aucune campagne</h3>
            <p className="text-sm text-base-content/60 max-w-sm">
              Créez votre première campagne SMS pour envoyer des messages en masse à vos groupes de contacts.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(campaign => {
            const config = statusConfig[campaign.status] || statusConfig.draft
            const StatusIcon = config.icon
            return (
              <div key={campaign.id} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
                <div className="card-body p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <span className={`badge badge-sm ${config.badge} gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>
                      {campaign.message && (
                        <p className="text-sm text-base-content/60 mt-1 line-clamp-2">
                          {campaign.message}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-base-content/50">
                        {campaign.expand?.group_id && (
                          <span>Groupe: {campaign.expand.group_id.name}</span>
                        )}
                        {campaign.sent_count > 0 && (
                          <span>Envoyés: {campaign.sent_count}</span>
                        )}
                        {campaign.delivered_count > 0 && (
                          <span className="text-success">Livrés: {campaign.delivered_count}</span>
                        )}
                        {campaign.failed_count > 0 && (
                          <span className="text-error">Échoués: {campaign.failed_count}</span>
                        )}
                        {campaign.created && (
                          <span>Créée le {format(new Date(campaign.created), 'dd/MM/yyyy')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleLaunch(campaign)}
                          disabled={isLaunching}
                          className="btn btn-success btn-sm gap-1"
                        >
                          <Rocket className="w-4 h-4" />
                          Envoyer
                        </button>
                      )}
                      <div className="dropdown dropdown-end">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === campaign.id ? null : campaign.id)}
                          className="btn btn-ghost btn-xs btn-circle"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpenId === campaign.id && (
                          <ul className="dropdown-content z-50 menu p-2 shadow-lg bg-base-100 rounded-xl w-44">
                            <li>
                              <button
                                onClick={() => { setEditingCampaign(campaign); setIsModalOpen(true); setMenuOpenId(null) }}
                                className="gap-2"
                              >
                                <Edit2 className="w-4 h-4" /> Modifier
                              </button>
                            </li>
                            <li>
                              <button onClick={() => handleDelete(campaign.id)} className="gap-2 text-error">
                                <Trash2 className="w-4 h-4" /> Supprimer
                              </button>
                            </li>
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <SmsCampaignModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        campaign={editingCampaign}
      />
    </div>
  )
}
