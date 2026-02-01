import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Loader2, Filter, X, CheckSquare, LayoutGrid, List as ListIcon, AlertCircle, Clock, AlertTriangle } from 'lucide-react'
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

export function Tasks() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: contactsList = [] } = useContactsList()
  const updateTaskMutation = useUpdateTask()
  const { isTaskModalOpen, setTaskModalOpen, searchQuery, setSearchQuery, setModalTask, modalTask } = useUIStore()
  const { workspaces, activeWorkspaceId } = useWorkspaceStore()

  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [workspaceFilter, setWorkspaceFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('task')
  const [tagFilter, setTagFilter] = useState('all')
  const [dueDateFilter, setDueDateFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('created_desc')
  const [selectedIds, setSelectedIds] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [isCampaignModalOpen, setCampaignModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState('table')


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
    typeFilter !== 'task',
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
    setTypeFilter('task')
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display">Mes Tâches</h1>
        <div className="flex items-center gap-3">
          <div data-tour="tasks-view-toggle" className="flex items-center gap-1">
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
          <button data-tour="tasks-create" onClick={() => { setModalTask({ type: 'task' }); setTaskModalOpen(true); }} className="btn gap-2 shadow-none transition-transform hover:scale-105 active:scale-95">
            <Plus className="w-5 h-5" />
            Nouvelle Tâche
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger-fast">
        {[
          {
            label: 'Actives',
            value: filteredTasks.filter(t => t.status !== 'done').length,
            icon: <CheckSquare className="w-5 h-5" />,
            color: 'text-primary',
          },
          {
            label: 'Haute Priorité',
            value: filteredTasks.filter(t => { const p = String(t.priority).toLowerCase(); return p === 'high' || p === '5' || p === '4' }).length,
            icon: <AlertCircle className="w-5 h-5" />,
            color: 'text-error',
          },
          {
            label: "Aujourd'hui",
            value: filteredTasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString()).length,
            icon: <Clock className="w-5 h-5" />,
            color: 'text-info',
          },
          {
            label: 'En Retard',
            value: filteredTasks.filter(t => t.due_date && new Date(t.due_date) < today && t.status !== 'done').length,
            icon: <AlertTriangle className="w-5 h-5" />,
            color: 'text-warning',
          },
        ].map((stat) => (
          <div key={stat.label} className="stats shadow bg-base-100 border border-base-300">
            <div className="stat">
              <div className={`stat-figure ${stat.color}`}>{stat.icon}</div>
              <div className="stat-title">{stat.label}</div>
              <div className={`stat-value ${stat.color} font-display`}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div data-tour="tasks-search" className="flex flex-wrap gap-2 items-center animate-slide-up delay-100">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input
            type="text"
            placeholder="Rechercher une tâche..."
            className="input input-bordered input-sm w-full pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="select select-bordered select-sm font-bold text-xs"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
        >
          <option value="created_desc">Plus récent</option>
          <option value="created_asc">Plus ancien</option>
          <option value="priority_desc">Priorité haute</option>
          <option value="priority_asc">Priorité basse</option>
          <option value="duedate_asc">Échéance proche</option>
          <option value="title_asc">Titre (A-Z)</option>
        </select>

        <button
          data-tour="tasks-filters"
          className={`btn btn-sm gap-2 ${showFilters ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4" />
          Filtres
          {activeFilterCount > 0 && <span className="badge badge-sm badge-primary">{activeFilterCount}</span>}
        </button>

        {(activeFilterCount > 0 || searchQuery) && (
          <button className="btn btn-error btn-ghost btn-sm" onClick={clearAllFilters}>
            <X className="w-4 h-4" />
            Effacer
          </button>
        )}
      </div>

      {/* Expanded Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-base-200/50 rounded-2xl border border-base-300 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="form-control">
            <label className="label py-1"><span className="label-text text-[10px] font-bold uppercase opacity-50">Statut</span></label>
            <select className="select select-bordered select-sm font-bold text-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">Tous</option>
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="blocked">Bloqué</option>
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
          <p className="mt-4 text-muted-foreground font-medium">Chargement des tâches...</p>
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
        <div data-tour="tasks-table" className="card bg-base-100 shadow-xl border border-base-300 flex-1 overflow-hidden">
          <div className="card-body p-0 overflow-auto">
            {filteredTasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-6">
                  <CheckSquare className="w-10 h-10 opacity-20" />
                </div>
                <h3 className="text-xl font-bold mb-2">Aucune tâche trouvée</h3>
                <p className="text-muted-foreground max-w-xs mb-6">
                  {tasks.length === 0
                    ? "Commencez par créer votre première tâche pour organiser votre travail."
                    : "Aucune tâche ne correspond à vos filtres actuels."}
                </p>
              </div>
            ) : (
              <table className="table table-sm table-pin-rows">
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
                    <th>Tâche</th>
                    <th className="w-28 text-right">Échéance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isSelected={selectedIds.includes(task.id)}
                      onSelect={() => toggleSelect(task.id)}
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
          Affichage de {filteredTasks.length} sur {tasks.length} tâches
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

function TaskRow({ task, isSelected, onSelect, onClick, isOverdue }) {
  const context = task.expand?.context_id
  const campaign = task.expand?.campaign_id
  const tags = task.expand?.tags || []

  const priorityBorders = {
    1: 'border-l-blue-400',
    'low': 'border-l-blue-400',
    2: 'border-l-green-400',
    3: 'border-l-yellow-400',
    'medium': 'border-l-yellow-400',
    4: 'border-l-orange-400',
    5: 'border-l-red-500',
    'high': 'border-l-red-500',
  }

  const statusDots = {
    todo: 'bg-base-300',
    in_progress: 'bg-info',
    blocked: 'bg-warning',
    done: 'bg-success',
    cancelled: 'bg-error',
  }

  const borderClass = priorityBorders[String(task.priority).toLowerCase()] || 'border-l-base-300'

  const formatDueDate = (dateStr) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const now = new Date()
    const todayStr = now.toDateString()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === todayStr) return "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) return 'Demain'
    return format(date, 'dd MMM')
  }

  return (
    <tr
      className={`cursor-pointer group transition-colors hover:bg-base-200/50 border-l-4 ${borderClass} ${isSelected ? 'bg-base-200/30' : ''}`}
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
        <div className="flex flex-col gap-0.5 py-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDots[task.status] || 'bg-base-300'}`} />
            <span className={`font-bold text-sm ${task.status === 'done' ? 'line-through opacity-60' : 'text-base-content'}`}>
              {task.title}
            </span>
            {context && (
              <span
                className="badge badge-xs border-none font-bold text-[10px]"
                style={{ backgroundColor: `${context.color}35`, color: context.color }}
              >
                {context.name}
              </span>
            )}
            {campaign && (
              <span className="badge badge-xs font-bold text-[10px] border-indigo-400/40 text-indigo-600 bg-indigo-500/10">
                {campaign.name}
              </span>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-5">
              {tags.map(tag => (
                <span
                  key={tag.id}
                  className="text-[9px] font-bold uppercase tracking-tight"
                  style={{ color: tag.color }}
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="text-right">
        {task.due_date ? (
          <span className={`text-xs font-bold ${isOverdue ? 'text-error' : 'opacity-50'}`}>
            {formatDueDate(task.due_date)}
          </span>
        ) : (
          <span className="text-xs opacity-20">—</span>
        )}
      </td>
    </tr>
  )
}
