import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Loader2, Filter, X, Video, MoreHorizontal, LayoutGrid, List as ListIcon } from 'lucide-react'
import { useTasks, useUpdateTask } from '@/hooks/useTasks'
import { useContactsList } from '@/hooks/useContacts'
import { useUIStore } from '@/stores/uiStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { tagsService } from '@/services/tags.service'
import { campaignsService } from '@/services/campaigns.service'
import { CampaignModal } from '@/components/CampaignModal'
import { TaskModal } from '@/components/TaskModal'
import { KanbanView } from '@/components/KanbanView'
import { BulkActionsBar } from '@/components/BulkActionsBar'
import { format } from 'date-fns'

export function Meetings() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: contactsList = [] } = useContactsList()
  const updateTaskMutation = useUpdateTask()
  const { isTaskModalOpen, setTaskModalOpen, searchQuery, setSearchQuery, setModalTask, modalTask } = useUIStore()
  const { workspaces, activeWorkspaceId } = useWorkspaceStore()

  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [workspaceFilter, setWorkspaceFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('meeting')
  const [tagFilter, setTagFilter] = useState('all')
  const [dueDateFilter, setDueDateFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('created_desc')
  const [selectedIds, setSelectedIds] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [isCampaignModalOpen, setCampaignModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState('table')
  const [completingTaskId, setCompletingTaskId] = useState(null)

  const [tags, setTags] = useState([])
  const [campaigns, setCampaigns] = useState([])

  useEffect(() => {
    loadFilterOptions()
  }, [])

  useEffect(() => {
    setWorkspaceFilter('all')
  }, [activeWorkspaceId])

  const loadFilterOptions = async () => {
    try {
      const [tagsRes, campaignsRes] = await Promise.all([
        tagsService.getAll(),
        campaignsService.getAll()
      ])
      setTags(tagsRes)
      setCampaigns(campaignsRes)
    } catch (e) {
      console.error("Error loading filters", e)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(today)
  endOfWeek.setDate(today.getDate() + 7)

  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase()
    const result = tasks.filter((task) => {
      const matchesSearch = !query ||
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.expand?.context_id?.name?.toLowerCase()?.includes(query)

      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || String(task.priority).toLowerCase() === priorityFilter
      const matchesWorkspace = workspaceFilter === 'all' ||
        (workspaceFilter === 'none' ? !task.context_id : task.context_id === workspaceFilter)
      const matchesCampaign = campaignFilter === 'all' ||
        (campaignFilter === 'none' ? !task.campaign_id : task.campaign_id === campaignFilter)
      const matchesType = typeFilter === 'all' || (task.type || 'task') === typeFilter
      const matchesTag = tagFilter === 'all' ||
        task.expand?.tags?.some(tag => tag.id === tagFilter) || task.tags?.includes(tagFilter)

      const matchesClient = clientFilter === 'all' || task.contact_id === clientFilter

      let matchesAssignee = true
      if (assigneeFilter === 'assigned') {
        matchesAssignee = !!task.assigned_to
      } else if (assigneeFilter === 'unassigned') {
        matchesAssignee = !task.assigned_to
      }

      let matchesDueDate = true
      if (dueDateFilter !== 'all' && task.due_date) {
        const dueDate = new Date(task.due_date)
        dueDate.setHours(0, 0, 0, 0)

        if (dueDateFilter === 'overdue') {
          matchesDueDate = dueDate < today && task.status !== 'done'
        } else if (dueDateFilter === 'today') {
          matchesDueDate = dueDate.getTime() === today.getTime()
        } else if (dueDateFilter === 'week') {
          matchesDueDate = dueDate >= today && dueDate <= endOfWeek
        } else if (dueDateFilter === 'no_date') {
          matchesDueDate = false
        }
      } else if (dueDateFilter === 'no_date') {
        matchesDueDate = !task.due_date
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesWorkspace &&
        matchesCampaign && matchesType && matchesTag && matchesDueDate && matchesClient && matchesAssignee
    })

    return result.sort((a, b) => {
      const getPrio = (p) => {
        const pStr = String(p).toLowerCase()
        if (pStr === 'high' || pStr === '5') return 5
        if (pStr === 'medium' || pStr === '3') return 3
        if (pStr === 'low' || pStr === '1') return 1
        return parseInt(p) || 0
      }

      switch (sortOrder) {
        case 'priority_desc':
          return getPrio(b.priority) - getPrio(a.priority)
        case 'priority_asc':
          return getPrio(a.priority) - getPrio(b.priority)
        case 'duedate_asc':
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date) - new Date(b.due_date)
        case 'duedate_desc':
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(b.due_date) - new Date(a.due_date)
        case 'title_asc':
          return (a.title || '').localeCompare(b.title || '')
        case 'created_asc':
          return new Date(a.created) - new Date(b.created)
        case 'created_desc':
        default:
          return new Date(b.created) - new Date(a.created)
      }
    })
  }, [tasks, searchQuery, statusFilter, priorityFilter, workspaceFilter, campaignFilter, typeFilter, tagFilter, dueDateFilter, clientFilter, assigneeFilter, sortOrder])

  const activeFilterCount = [
    statusFilter !== 'all',
    priorityFilter !== 'all',
    workspaceFilter !== 'all',
    campaignFilter !== 'all',
    typeFilter !== 'meeting',
    tagFilter !== 'all',
    clientFilter !== 'all',
    dueDateFilter !== 'all',
    assigneeFilter !== 'all',
  ].filter(Boolean).length

  const clearAllFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setWorkspaceFilter('all')
    setCampaignFilter('all')
    setTypeFilter('meeting')
    setTagFilter('all')
    setDueDateFilter('all')
    setClientFilter('all')
    setAssigneeFilter('all')
  }

  const toggleSelect = (taskId, e) => {
    e?.stopPropagation?.()
    setSelectedIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTasks.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredTasks.map(t => t.id))
    }
  }

  const isAllSelected = filteredTasks.length > 0 && selectedIds.length === filteredTasks.length

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-2 text-primary">
            <Video className="w-8 h-8" />
            Réunions
          </h1>
          <p className="text-muted-foreground font-medium">Gérez vos rendez-vous et appels professionnels.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              className={`btn btn-sm btn-ghost btn-square transition-transform hover:scale-110 active:scale-95 ${viewMode === 'table' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Vue Liste"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              className={`btn btn-sm btn-ghost btn-square transition-transform hover:scale-110 active:scale-95 ${viewMode === 'kanban' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Vue Tableau"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button data-tour="meetings-create" onClick={() => { setModalTask({ type: 'meeting' }); setTaskModalOpen(true); }} className="btn gap-2 shadow-none transition-transform hover:scale-105 active:scale-95">
            <Plus className="w-5 h-5" />
            Nouvelle Réunion
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center animate-stagger-fast">
        <div className="stats shadow bg-base-100 border border-base-300 overflow-hidden">
          <div className="stat">
            <div className="stat-title text-[10px] uppercase font-bold opacity-50 tracking-widest">À venir</div>
            <div className="stat-value text-2xl text-primary">{filteredTasks.length}</div>
          </div>
        </div>
        <div className="stats shadow bg-base-100 border border-base-300 overflow-hidden">
          <div className="stat">
            <div className="stat-title text-[10px] uppercase font-bold opacity-50 tracking-widest">Prioritaires</div>
            <div className="stat-value text-2xl text-error">
              {filteredTasks.filter(t => {
                const p = String(t.priority).toLowerCase()
                return p === 'high' || p === '5' || p === '4'
              }).length}
            </div>
          </div>
        </div>
        <div className="stats shadow bg-base-100 border border-base-300 overflow-hidden">
          <div className="stat">
            <div className="stat-title text-[10px] uppercase font-bold opacity-50 tracking-widest">Aujourd'hui</div>
            <div className="stat-value text-2xl text-info">
              {filteredTasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString()).length}
            </div>
          </div>
        </div>
        <div className="stats shadow bg-base-100 border border-base-300 overflow-hidden">
          <div className="stat">
            <div className="stat-title text-[10px] uppercase font-bold opacity-50 tracking-widest">Complétées</div>
            <div className="stat-value text-2xl text-success">{tasks.filter(t => t.type === 'meeting' && t.status === 'done').length}</div>
          </div>
        </div>
      </div>

      {/* Main Action Bar */}
      <div data-tour="meetings-search" className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-base-100 p-3 rounded-2xl border border-base-300 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center flex-1 w-full">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              type="text"
              placeholder="Rechercher une réunion..."
              className="input input-sm input-ghost w-full pl-9 focus:bg-base-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className={`btn btn-sm gap-2 ${showFilters ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filtres
            {activeFilterCount > 0 && <span className="badge badge-sm badge-ghost">{activeFilterCount}</span>}
          </button>

          {(activeFilterCount > 0 || searchQuery) && (
            <button className="btn btn-error btn-ghost btn-sm" onClick={clearAllFilters}>
              <X className="w-4 h-4" />
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-base-200/50 rounded-2xl border border-base-300 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="form-control">
            <label className="label py-1"><span className="label-text text-[10px] font-bold uppercase opacity-50">Statut</span></label>
            <select className="select select-bordered select-sm font-bold text-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">Tous</option>
              <option value="todo">À venir</option>
              <option value="in_progress">En cours</option>
              <option value="blocked">Reporté</option>
              <option value="done">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text text-[10px] font-bold uppercase opacity-50">Priorité</span></label>
            <select className="select select-bordered select-sm font-bold text-xs" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="all">Toutes</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text text-[10px] font-bold uppercase opacity-50">Workspace</span></label>
            <select className="select select-bordered select-sm font-bold text-xs" value={workspaceFilter} onChange={e => setWorkspaceFilter(e.target.value)}>
              <option value="all">Tous</option>
              <option value="none">Sans</option>
              {workspaces.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text text-[10px] font-bold uppercase opacity-50">Échéance</span></label>
            <select className="select select-bordered select-sm font-bold text-xs" value={dueDateFilter} onChange={e => setDueDateFilter(e.target.value)}>
              <option value="all">Toutes</option>
              <option value="overdue">En retard</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="no_date">Sans date</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text text-[10px] font-bold uppercase opacity-50">Tri</span></label>
            <select className="select select-bordered select-sm font-bold text-xs" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
              <option value="created_desc">Plus récent</option>
              <option value="created_asc">Plus ancien</option>
              <option value="priority_desc">Priorité haute</option>
              <option value="priority_asc">Priorité basse</option>
              <option value="duedate_asc">Échéance proche</option>
              <option value="title_asc">Titre (A-Z)</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text text-[10px] font-bold uppercase opacity-50">Client</span></label>
            <select className="select select-bordered select-sm font-bold text-xs" value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
              <option value="all">Tous</option>
              {contactsList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
          <p className="mt-4 text-muted-foreground font-medium">Chargement des réunions...</p>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="flex-1 min-h-0">
          <KanbanView
            tasks={filteredTasks}
            onStatusChange={(taskId, newStatus) => {
              updateTaskMutation.mutate({ id: taskId, updates: { status: newStatus } })
            }}
            onTaskClick={(task) => {
              setModalTask(task)
              setTaskModalOpen(true)
            }}
          />
        </div>
      ) : (
        <div data-tour="meetings-list" className="card bg-base-100 shadow-xl border border-base-300 flex-1 overflow-hidden">
          <div className="card-body p-0 overflow-auto">
            {filteredTasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-6">
                  <Video className="w-10 h-10 opacity-20" />
                </div>
                <h3 className="text-xl font-bold mb-2">Aucune réunion trouvée</h3>
                <p className="text-muted-foreground max-w-xs mb-6">
                  {tasks.filter(t => t.type === 'meeting').length === 0
                    ? "Planifiez votre première réunion pour commencer à organiser votre temps."
                    : "Aucune réunion ne correspond à vos filtres actuels."}
                </p>
              </div>
            ) : (
              <table className="table table-zebra table-pin-rows">
                <thead className="bg-base-200">
                  <tr>
                    <th className="w-12">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm border-base-300 bg-base-200 checked:border-primary checked:bg-primary checked:text-primary-content"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Réunion</th>
                    <th>Statut</th>
                    <th>Échéance</th>
                    <th>Priorité</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isSelected={selectedIds.includes(task.id)}
                      isCompleting={completingTaskId === task.id}
                      onSelect={() => toggleSelect(task.id)}
                      onComplete={async () => {
                        setCompletingTaskId(task.id)
                        await updateTaskMutation.mutateAsync({ id: task.id, updates: { status: 'done' } })
                        setTimeout(() => setCompletingTaskId(null), 1000)
                      }}
                      onClick={() => {
                        setModalTask(task)
                        setTaskModalOpen(true)
                      }}
                      isOverdue={task.due_date && new Date(task.due_date) < today && task.status !== 'done'}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Results Info */}
      {filteredTasks.length > 0 && (
        <div className="text-center py-2 opacity-50 text-[10px] font-black uppercase tracking-widest">
          Affichage de {filteredTasks.length} sur {tasks.filter(t => t.type === 'meeting').length} réunions
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <BulkActionsBar
          selectedIds={selectedIds}
          onClear={() => setSelectedIds([])}
          onSuccess={() => setSelectedIds([])}
        />
      )}

      <CampaignModal
        open={isCampaignModalOpen}
        onOpenChange={setCampaignModalOpen}
        onSuccess={loadFilterOptions}
      />

      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={setTaskModalOpen}
        task={modalTask}
      />
    </div>
  )
}

function TaskRow({ task, isSelected, isCompleting, onSelect, onComplete, onClick, isOverdue }) {
  const context = task.expand?.context_id
  const campaign = task.expand?.campaign_id
  const tags = task.expand?.tags || []

  const priorityColors = {
    1: 'bg-blue-500',
    'low': 'bg-blue-500',
    2: 'bg-green-500',
    3: 'bg-yellow-500',
    'medium': 'bg-yellow-500',
    4: 'bg-orange-500',
    5: 'bg-red-500',
    'high': 'bg-red-500',
  }

  const statusBadges = {
    todo: 'badge-ghost',
    in_progress: 'badge-info',
    blocked: 'badge-warning',
    done: 'badge-success',
    cancelled: 'badge-error',
  }

  return (
    <tr
      className={`hover cursor-pointer group transition-all ${isSelected ? 'active' : ''}`}
      onClick={onClick}
    >
      <td onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="checkbox checkbox-sm border-base-300 bg-base-200 checked:border-primary checked:bg-primary checked:text-primary-content"
          checked={isSelected}
          onChange={onSelect}
        />
      </td>
      <td>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">📅</span>
            <span className={`font-bold ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>
              {task.title}
            </span>
            {context && (
              <span
                className="badge badge-sm border-none font-bold text-[10px]"
                style={{ backgroundColor: `${context.color}20`, color: context.color }}
              >
                {context.name}
              </span>
            )}
            {campaign && (
              <span className="badge badge-sm badge-outline border-indigo-500/30 text-indigo-500 font-bold text-[10px]">
                🚀 {campaign.name}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {tags.map(tag => (
              <span
                key={tag.id}
                className="badge badge-outline border-none text-[8px] h-4 font-black uppercase tracking-tighter"
                style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 opacity-70 group-hover:opacity-100 font-medium">
              {task.description}
            </p>
          )}
        </div>
      </td>
      <td>
        <span className={`badge badge-sm border-none font-bold capitalize ${statusBadges[task.status] || 'badge-ghost'}`}>
          {task.status?.replace('_', ' ')}
        </span>
      </td>
      <td>
        <div className={`text-xs font-bold ${isOverdue ? 'text-error animate-pulse' : 'opacity-60'}`}>
          {task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : '-'}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${priorityColors[String(task.priority).toLowerCase()] || 'bg-base-300'} shadow-sm`} />
          <span className="text-[10px] font-bold opacity-50 uppercase">P{task.priority || 0}</span>
        </div>
      </td>
    </tr>
  )
}
