import { useState, useEffect } from 'react'
import { Plus, Search, Layers, MoreVertical, Archive, Trash2, Edit2, LayoutGrid, GanttChartSquare, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { campaignsService } from '../services/campaigns.service'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { CampaignModal } from '../components/CampaignModal'
import { CampaignDetails } from '../components/CampaignDetails'
import { CampaignGantt } from '../components/CampaignGantt'

export function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active') // active, draft, completed, archived, all
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)

  /* New state for View Mode & Selected Campaign */
  const [view, setView] = useState('list') // 'list' | 'gantt' | 'details'
  const [selectedCampaignId, setSelectedCampaignId] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    loadCampaigns()
  }, [activeWorkspaceId, statusFilter, search, refreshTrigger])

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const data = await campaignsService.getAll({
        workspaceId: activeWorkspaceId,
        status: statusFilter,
        search: search
      })
      setCampaigns(data)
    } catch (error) {
      console.error('Error loading campaigns:', error)
      toast.error('Échec du chargement des projets')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer ce projet ?')) return

    try {
      await campaignsService.delete(id)
      toast.success('Projet supprimé')
      loadCampaigns()
      if (selectedCampaignId === id) {
        setView('list')
        setSelectedCampaignId(null)
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error(error.message || 'Erreur lors de la suppression')
    }
  }

  const handleArchive = async (id, currentStatus) => {
    try {
      if (currentStatus === 'archived') {
        await campaignsService.restore(id)
        toast.success('Projet restauré')
      } else {
        await campaignsService.archive(id)
        toast.success('Projet archivé')
      }
      loadCampaigns()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error(error.message || 'Erreur lors de la mise à jour')
    }
  }

  const handleOpenDetails = (campaignId) => {
    setSelectedCampaignId(campaignId)
    setView('details')
  }

  const filteredCampaigns = campaigns

  // Render Details View if active
  if (view === 'details' && selectedCampaignId) {
    return (
      <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
        <CampaignDetails
          campaignId={selectedCampaignId}
          lastUpdated={refreshTrigger}
          onBack={() => { setView('list'); setSelectedCampaignId(null); }}
          onEdit={(c) => { setEditingCampaign(c); setIsModalOpen(true); }}
        />
        <CampaignModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          campaign={editingCampaign}
          onSuccess={() => {
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-2 text-primary">
            <Layers className="w-8 h-8" />
            Projets
          </h1>
          <p className="text-muted-foreground">Gérez vos projets et initiatives.</p>
        </div>
        <div className="flex items-center gap-3">
          <div data-tour="campaigns-view-toggle" className="flex items-center gap-1">
            <button
              className={`btn btn-sm btn-ghost btn-square transition-transform hover:scale-110 active:scale-95 ${view === 'list' ? 'btn-active' : ''}`}
              onClick={() => setView('list')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              className={`btn btn-sm btn-ghost btn-square transition-transform hover:scale-110 active:scale-95 ${view === 'gantt' ? 'btn-active' : ''}`}
              onClick={() => setView('gantt')}
            >
              <GanttChartSquare className="w-4 h-4" />
            </button>
          </div>
          <button data-tour="campaigns-create" className="btn gap-2 shadow-none transition-transform hover:scale-105 active:scale-95" onClick={() => { setEditingCampaign(null); setIsModalOpen(true); }}>
            <Plus className="w-5 h-5" />
            Nouveau Projet
          </button>
        </div>
      </div>

      {/* Filters */}
      {view === 'list' && (
        <div data-tour="campaigns-filters" className="flex flex-wrap gap-2 items-center bg-base-100 p-3 rounded-2xl shadow-sm border border-base-300">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              type="text"
              placeholder="Rechercher un projet..."
              className="input input-sm input-ghost w-full pl-9 focus:bg-base-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="divider divider-horizontal m-0 py-2"></div>
          <div className="join bg-base-200/50 p-0.5">
            {['active', 'draft', 'completed', 'all'].map((status) => (
              <button
                key={status}
                className={`join-item btn btn-sm px-3 font-bold ${statusFilter === status ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'active' ? 'Actives' : status === 'draft' ? 'Brouillons' : status === 'completed' ? 'Terminées' : 'Toutes'}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
          <p className="mt-4 text-muted-foreground font-medium">Chargement des projets...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-20 bg-base-100 rounded-3xl border border-dashed border-base-300">
          <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-6">
            <Layers className="w-10 h-10 opacity-20" />
          </div>
          <h3 className="text-xl font-bold mb-2">Aucun projet trouvé</h3>
          <p className="text-muted-foreground max-w-sm mb-8">Commencez par créer votre premier projet.</p>
          <button className="btn btn-primary shadow-lg" onClick={() => { setEditingCampaign(null); setIsModalOpen(true); }}>Créer un Projet</button>
        </div>
      ) : view === 'gantt' ? (
        <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden flex-1 min-h-0">
          <div className="card-body p-0 overflow-auto">
            <CampaignGantt
              campaigns={filteredCampaigns}
              onEdit={(c) => { handleOpenDetails(c.id) }}
            />
          </div>
        </div>
      ) : (
        <div data-tour="campaigns-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map(campaign => (
            <div
              key={campaign.id}
              className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-1"
              onClick={() => handleOpenDetails(campaign.id)}
            >
              <div className="card-body p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1 pr-8">
                    <h2 className="card-title text-base font-bold line-clamp-1 group-hover:text-primary transition-colors">
                      {campaign.name}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className={`badge badge-xs text-[10px] font-black uppercase tracking-widest ${campaign.status === 'active' ? 'badge-success' : campaign.status === 'draft' ? 'badge-ghost' : 'badge-primary'}`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                  <div className="dropdown dropdown-end" onClick={e => e.stopPropagation()}>
                    <label tabIndex={0} className="btn btn-ghost btn-xs btn-square">
                      <MoreVertical className="w-4 h-4 opacity-50" />
                    </label>
                    <ul tabIndex={0} className="dropdown-content z-[20] menu p-2 shadow bg-base-100 rounded-box w-32 border border-base-300">
                      <li><a onClick={() => { setEditingCampaign(campaign); setIsModalOpen(true) }}><Edit2 className="w-4 h-4" /> Éditer</a></li>
                      <li><a onClick={() => handleArchive(campaign.id, campaign.status)}><Archive className="w-4 h-4" /> {campaign.status === 'archived' ? 'Restaurer' : 'Archiver'}</a></li>
                      <div className="divider my-1"></div>
                      <li><a onClick={() => handleDelete(campaign.id)} className="text-error"><Trash2 className="w-4 h-4" /> Supprimer</a></li>
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-base-200">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-40 mb-1">Début</div>
                    <div className="text-sm font-medium">{format(new Date(campaign.start_date || Date.now()), 'd MMM yyyy')}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-40 mb-1">Fin</div>
                    <div className="text-sm font-medium">{format(new Date(campaign.end_date || Date.now()), 'd MMM yyyy')}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="avatar placeholder" title={`${campaign.tasks?.[0]?.count || 0} Tâches`}>
                      <div className="bg-primary/10 text-primary rounded-full w-8 border-2 border-base-100">
                        <span className="text-[10px] font-black">{campaign.tasks?.[0]?.count || 0}T</span>
                      </div>
                    </div>
                    <div className="avatar placeholder" title={`${campaign.meetings?.[0]?.count || 0} Meetings`}>
                      <div className="bg-info/10 text-info rounded-full w-8 border-2 border-base-100">
                        <span className="text-[10px] font-black">{campaign.meetings?.[0]?.count || 0}M</span>
                      </div>
                    </div>
                  </div>
                  <div className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-all font-bold"> Voir Détails </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CampaignModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        campaign={editingCampaign}
        onSuccess={loadCampaigns}
      />
    </div>
  )
}

