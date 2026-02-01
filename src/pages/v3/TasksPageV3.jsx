import { useState, useMemo } from 'react'
import DashboardLayoutV3 from '../../components/layout/DashboardLayoutV3'
import { TaskModal } from '../../components/TaskModal'
import { useTasks, useUpdateTask } from '../../hooks/useTasks'
import { CheckSquare, Filter, Plus, Search, LayoutGrid, List as ListIcon, MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

export default function TasksPageV3() {
    const { data: tasks = [], isLoading } = useTasks()
    const updateTask = useUpdateTask()
    const [viewMode, setViewMode] = useState('list') // 'list' or 'board'
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState(null)

    // Filter Logic
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === 'all' || task.status === statusFilter
            // Add more filters as needed consistent with legacy
            return matchesSearch && matchesStatus
        }).sort((a, b) => new Date(b.created) - new Date(a.created))
    }, [tasks, searchQuery, statusFilter])

    const handleEdit = (task) => {
        setSelectedTask(task)
        setIsTaskModalOpen(true)
    }

    const handleCreate = () => {
        setSelectedTask(null)
        setIsTaskModalOpen(true)
    }

    return (
        <DashboardLayoutV3>
            <div className="flex flex-col h-full gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
                            <CheckSquare className="w-8 h-8 text-primary" />
                            Mes Tâches
                        </h1>
                        <p className="text-muted-foreground">Gérez l'ensemble de vos tâches et projets.</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="join">
                            <button
                                className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setViewMode('list')}
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                            <button
                                className={`join-item btn btn-sm ${viewMode === 'board' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setViewMode('board')}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                        <button onClick={handleCreate} className="btn btn-primary btn-sm gap-2">
                            <Plus className="w-4 h-4" />
                            Nouvelle Tâche
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center bg-base-100 p-2 rounded-xl shadow-sm border border-base-200">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="input input-sm input-ghost w-full pl-9"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="divider divider-horizontal m-0 py-2"></div>
                    <select
                        className="select select-sm select-ghost"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="todo">À faire</option>
                        <option value="in_progress">En cours</option>
                        <option value="done">Terminé</option>
                    </select>
                </div>

                {/* Content */}
                <div className="card bg-base-100 shadow-xl flex-1 overflow-hidden">
                    <div className="card-body p-0 overflow-auto">
                        {viewMode === 'list' ? (
                            <table className="table table-zebra table-pin-rows">
                                <thead>
                                    <tr>
                                        <th className="w-12"></th>
                                        <th>Titre</th>
                                        <th>Priorité</th>
                                        <th>Statut</th>
                                        <th>Échéance</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTasks.map(task => (
                                        <tr key={task.id} className="hover cursor-pointer" onClick={() => handleEdit(task)}>
                                            <td onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-sm checkbox-primary"
                                                    checked={task.status === 'done'}
                                                    onChange={() => updateTask.mutate({ id: task.id, updates: { status: task.status === 'done' ? 'todo' : 'done' } })}
                                                />
                                            </td>
                                            <td>
                                                <div className="font-bold">{task.title}</div>
                                                <div className="text-xs opacity-50">{task.description}</div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-sm ${task.priority === 'high' ? 'badge-error' :
                                                        task.priority === 'medium' ? 'badge-warning' : 'badge-ghost'
                                                    }`}>
                                                    {task.priority || 'Normal'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge badge-sm badge-outline`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td>
                                                {task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : '-'}
                                            </td>
                                            <td>
                                                <button className="btn btn-ghost btn-xs btn-square">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTasks.length === 0 && (
                                        <tr>
                                            <td colspan="6" className="text-center py-10 text-muted-foreground">
                                                Aucune tâche trouvée
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-4 text-center text-muted-foreground">
                                <p>Vue Kanban à venir dans la prochaine mise à jour V3.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <TaskModal
                open={isTaskModalOpen}
                onOpenChange={setIsTaskModalOpen}
                task={selectedTask}
            />
        </DashboardLayoutV3>
    )
}
