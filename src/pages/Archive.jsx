import { Archive, RefreshCw, FolderOpen, Trash2, X, Loader2 } from 'lucide-react'
import { useTasks, useRestoreTask, useMoveToTrash, useBulkRestoreTasks, useBulkMoveToTrash, useEmptyArchive } from '../hooks/useTasks'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEffect, useState } from 'react'

export function ArchivePage() {
    const { setActiveWorkspace } = useWorkspaceStore()
    const [selectedIds, setSelectedIds] = useState([])
    const [showEmptyConfirm, setShowEmptyConfirm] = useState(false)

    // Force archive workspace when mounting
    useEffect(() => {
        setActiveWorkspace('archive')
        return () => setActiveWorkspace(null) // Reset on unmount
    }, [setActiveWorkspace])

    const { data: tasks = [], isLoading } = useTasks()
    const restoreTask = useRestoreTask()
    const moveToTrash = useMoveToTrash()
    const bulkRestore = useBulkRestoreTasks()
    const bulkMoveToTrash = useBulkMoveToTrash()
    const emptyArchive = useEmptyArchive()

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === tasks.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(tasks.map(t => t.id))
        }
    }

    const handleEmptyArchive = () => {
        emptyArchive.mutate(undefined, {
            onSuccess: () => setShowEmptyConfirm(false)
        })
    }

    const handleBulkRestore = () => {
        bulkRestore.mutate(selectedIds, {
            onSuccess: () => setSelectedIds([])
        })
    }

    const handleBulkTrash = () => {
        bulkMoveToTrash.mutate(selectedIds, {
            onSuccess: () => setSelectedIds([])
        })
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
                <p className="mt-4 text-muted-foreground font-medium">Chargement de l'archive...</p>
            </div>
        )
    }

    const isAllSelected = tasks.length > 0 && selectedIds.length === tasks.length

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display flex items-center gap-2 text-primary">
                        <Archive className="w-8 h-8" />
                        Archives
                    </h1>
                    <p className="text-muted-foreground">Projets terminés et anciennes tâches conservés pour référence.</p>
                </div>
                {tasks.length > 0 && (
                    <button
                        data-tour="archive-empty"
                        className="btn btn-error btn-outline btn-sm gap-2 font-bold"
                        onClick={() => setShowEmptyConfirm(true)}
                    >
                        <Trash2 className="w-4 h-4" />
                        Vider l'archive
                    </button>
                )}
            </div>

            {/* Content */}
            <div data-tour="archive-table" className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 dark:hover:shadow-purple-500/30 transition-all flex-1 overflow-hidden">
                <div className="card-body p-0 overflow-auto">
                    {tasks.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                            <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-6">
                                <FolderOpen className="w-10 h-10 opacity-20" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">L'archive est vide</h3>
                            <p className="text-muted-foreground max-w-xs">Aucun élément n'a été archivé pour le moment.</p>
                        </div>
                    ) : (
                        <table className="table table-zebra table-pin-rows">
                            <thead className="bg-base-200 dark:bg-black/30">
                                <tr>
                                    <th>Élément</th>
                                    <th>Date d'archivage</th>
                                    <th className="text-right">Actions</th>
                                    <th className="w-12 text-right">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm border-base-300 dark:border-white/30 bg-base-100 dark:bg-white/10 checked:border-primary checked:bg-primary checked:text-primary-content"
                                            checked={isAllSelected}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task.id} className="hover group transition-colors">
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-base-content/80 group-hover:text-primary transition-colors">{task.title}</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {task.expand?.project_id && (
                                                        <span className="badge badge-xs text-[10px] bg-base-200 border-none font-bold uppercase tracking-widest text-base-content/60">
                                                            {task.expand.project_id.name}
                                                        </span>
                                                    )}
                                                    {task.expand?.context_id && (
                                                        <span className="badge badge-xs text-[10px] border-none font-black uppercase tracking-widest" style={{ backgroundColor: `${task.expand.context_id.color}20`, color: task.expand.context_id.color }}>
                                                            {task.expand.context_id.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-xs font-bold opacity-40">
                                            {new Date(task.archived_at || task.updated).toLocaleDateString()}
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="btn btn-primary btn-ghost btn-xs font-bold gap-2"
                                                    onClick={() => restoreTask.mutate(task.id)}
                                                    title="Désarchiver"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                    Restaurer
                                                </button>
                                                <button
                                                    className="btn btn-error btn-ghost btn-xs btn-square"
                                                    onClick={() => moveToTrash.mutate(task.id)}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-sm border-base-300 dark:border-white/30 bg-base-100 dark:bg-white/10 checked:border-primary checked:bg-primary checked:text-primary-content"
                                                checked={selectedIds.includes(task.id)}
                                                onChange={() => toggleSelect(task.id)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Bulk Actions Floating Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border border-base-300 dark:border-white/20 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-4">
                    <span className="text-xs font-black uppercase tracking-widest border-r border-base-300 pr-6">{selectedIds.length} sélectionnés</span>

                    <button className="btn btn-primary btn-sm gap-2 shadow-lg" onClick={handleBulkRestore}>
                        <RefreshCw className="w-4 h-4" />
                        Restaurer tout
                    </button>

                    <button className="btn btn-error btn-sm gap-2 shadow-lg" onClick={handleBulkTrash}>
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                    </button>

                    <button className="btn btn-ghost btn-xs btn-circle ml-2" onClick={() => setSelectedIds([])}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Confirm Modals */}
            {showEmptyConfirm && (
                <div className="modal modal-open">
                    <div className="modal-box border border-base-300 shadow-2xl">
                        <h3 className="font-bold text-lg text-error flex items-center gap-2">
                            <Trash2 className="w-5 h-5" />
                            Vider l'archive ?
                        </h3>
                        <p className="py-4 text-sm opacity-70">
                            Tous les éléments seront déplacés vers la corbeille. Vous pourrez toujours les restaurer de là si besoin.
                        </p>
                        <div className="modal-action">
                            <button className="btn btn-ghost btn-sm font-bold" onClick={() => setShowEmptyConfirm(false)}>Annuler</button>
                            <button className="btn btn-error btn-sm font-bold shadow-lg" onClick={handleEmptyArchive}>Déplacer vers corbeille</button>
                        </div>
                    </div>
                    <div className="modal-backdrop bg-black/20 backdrop-blur-sm" onClick={() => setShowEmptyConfirm(false)}></div>
                </div>
            )}
        </div>
    )
}
