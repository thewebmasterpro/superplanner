import { useState, useEffect } from 'react'
import { Plus, Search, Calendar as CalendarIcon, Filter, Layers, MoreVertical, Archive, Trash2, Edit2, LayoutGrid, GanttChartSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { CampaignModal } from '../components/CampaignModal'
import { CampaignGantt } from '../components/CampaignGantt'
import { CampaignDetails } from '../components/CampaignDetails'
import { toast } from 'react-hot-toast'
import { useContextStore } from '../stores/contextStore'

export function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active') // active, draft, completed, archived, all
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)
  const activeContextId = useContextStore(state => state.activeContextId)

  /* New state for View Mode & Selected Campaign */
  const [view, setView] = useState('list') // 'list' | 'gantt' | 'details'
  const [selectedCampaignId, setSelectedCampaignId] = useState(null)

  useEffect(() => {
    loadCampaigns()
  }, [activeContextId]) // Reload when context changes

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('campaigns')
        .select(`
          *,
          context:contexts(name, color),
          tasks:tasks(count),
          meetings:meetings(count)
        `)
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })

      // Filter by context if not Global view
      if (activeContextId) {
        query = query.eq('context_id', activeContextId)
      }

      const { data, error } = await query

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error loading campaigns:', error)
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', id)
      if (error) throw error
      toast.success('Campaign deleted')
      loadCampaigns()
      if (selectedCampaignId === id) {
        setView('list')
        setSelectedCampaignId(null)
      }
    } catch (error) {
      toast.error('Error deleting campaign')
    }
  }

  const handleArchive = async (id, currentStatus) => {
    const newStatus = currentStatus === 'archived' ? 'draft' : 'archived'
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      toast.success(`Campaign ${newStatus === 'archived' ? 'archived' : 'restored'}`)
      loadCampaigns()
    } catch (error) {
      toast.error('Error updating status')
    }
  }

  const handleOpenDetails = (campaignId) => {
    setSelectedCampaignId(campaignId)
    setView('details')
  }

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Render Details View if active
  if (view === 'details' && selectedCampaignId) {
    return (
      <div className="container-tight py-6">
        <CampaignDetails
          campaignId={selectedCampaignId}
          onBack={() => { setView('list'); setSelectedCampaignId(null); }}
          onEdit={(c) => { setEditingCampaign(c); setIsModalOpen(true); }}
        />
        <CampaignModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          campaign={editingCampaign}
          onSuccess={() => { loadCampaigns(); }} // Should ideally reload details too if open
        />
      </div>
    )
  }

  return (
    <div className="container-tight py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layers className="w-8 h-8 text-primary" />
            Campaigns
          </h1>
          <p className="text-muted-foreground">Manage your marketing campaigns and major projects</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-muted p-1 rounded-lg flex items-center">
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView('list')}
              title="List View"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={view === 'gantt' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView('gantt')}
              title="Gantt View"
            >
              <GanttChartSquare className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            {/* Centralized creation handled by Navbar */}
          </div>
        </div>
      </div>

      {view === 'list' && (
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('active')}
              size="sm"
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'draft' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('draft')}
              size="sm"
            >
              Drafts
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('completed')}
              size="sm"
            >
              Completed
            </Button>
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              size="sm"
            >
              All
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading campaigns...</div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/10">
          <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No campaigns found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first campaign.</p>
          <Button onClick={() => setIsModalOpen(true)}>Create Campaign</Button>
        </div>
      ) : view === 'gantt' ? (
        <CampaignGantt
          campaigns={filteredCampaigns}
          onEdit={(c) => { handleOpenDetails(c.id) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map(campaign => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow cursor-pointer border-l-4"
              style={{ borderLeftColor: campaign.status === 'active' ? '#22c55e' : 'transparent' }}
              onClick={() => handleOpenDetails(campaign.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-1" title={campaign.name}>
                      {campaign.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span className="capitalize">{campaign.status}</span>
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mr-2 -mt-2" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingCampaign(campaign); setIsModalOpen(true) }}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(campaign.id, campaign.status) }}>
                        <Archive className="w-4 h-4 mr-2" />
                        {campaign.status === 'archived' ? 'Restore' : 'Archive'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(campaign.id) }}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Start</p>
                    <p className="font-medium">{format(new Date(campaign.start_date), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">End</p>
                    <p className="font-medium">{format(new Date(campaign.end_date), 'MMM d, yyyy')}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm border-t pt-3">
                  <div className="flex gap-4">
                    <div title="Tasks">
                      <span className="font-bold">{campaign.tasks?.[0]?.count || 0}</span> <span className="text-muted-foreground">tasks</span>
                    </div>
                    <div title="Meetings">
                      <span className="font-bold">{campaign.meetings?.[0]?.count || 0}</span> <span className="text-muted-foreground">meetings</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
