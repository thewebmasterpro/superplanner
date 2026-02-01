import { useTasks, useUpdateTask, useMoveToTrash } from '../../hooks/useTasks'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AlertCircle, CheckCircle2, MoreHorizontal, Trash2 } from 'lucide-react'
import Swal from 'sweetalert2'

export default function TaskListV3() {
    const { data: tasks, isLoading, error } = useTasks()
    const updateTask = useUpdateTask()
    const moveToTrash = useMoveToTrash()

    if (isLoading) {
        return <div className="p-8 text-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>
    }

    if (error) {
        return <div className="alert alert-error"><span>Erreur de chargement des tâches : {error.message}</span></div>
    }

    // Filter for active tasks (not completed)
    const activeTasks = tasks?.filter(t => t.status !== 'done' && t.status !== 'cancelled') || []

    // Check priority logic: assuming '5' or 'urgent' is high
    const isHighPriority = (p) => p === '5' || p === 'urgent' || p === 'high'

    const handleToggleComplete = (task) => {
        updateTask.mutate({
            id: task.id,
            updates: { status: 'done', completed_at: new Date().toISOString() }
        })
    }

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Êtes-vous sûr ?',
            text: "Cette tâche sera déplacée vers la corbeille.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler',
            background: '#1d232a', // DaisyUI dark theme background approximate
            color: '#a6adbb'
        }).then((result) => {
            if (result.isConfirmed) {
                moveToTrash.mutate(id)
                Swal.fire({
                    title: 'Supprimée !',
                    text: 'La tâche a été déplacée vers la corbeille.',
                    icon: 'success',
                    background: '#1d232a',
                    color: '#a6adbb',
                    timer: 1500,
                    showConfirmButton: false
                })
            }
        })
    }

    if (activeTasks.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Aucune tâche en cours. Bon travail !</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
                <thead>
                    <tr>
                        <th></th>
                        <th>Tâche</th>
                        <th>Priorité</th>
                        <th>Statut</th>
                        <th>Échéance</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {activeTasks.map((task) => (
                        <tr key={task.id} className="hover group">
                            <th>
                                <label>
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary checkbox-sm"
                                        checked={false}
                                        onChange={() => handleToggleComplete(task)}
                                    />
                                </label>
                            </th>
                            <td>
                                <div className="font-bold flex items-center gap-2">
                                    {task.title}
                                    {isHighPriority(task.priority) && <AlertCircle className="w-4 h-4 text-error" />}
                                </div>
                                {task.description && (
                                    <div className="text-xs opacity-50 truncate max-w-[200px]">{task.description}</div>
                                )}
                            </td>
                            <td>
                                <div className={`badge ${isHighPriority(task.priority) ? 'badge-error' : 'badge-ghost'} gap-2`}>
                                    {task.priority || 'Normal'}
                                </div>
                            </td>
                            <td>
                                <div className="badge badge-outline text-xs">{task.status}</div>
                            </td>
                            <td className="text-sm">
                                {task.due_date ? format(new Date(task.due_date), 'dd MMM', { locale: fr }) : '-'}
                            </td>
                            <td className="text-right">
                                <button
                                    className="btn btn-ghost btn-xs text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDelete(task.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
