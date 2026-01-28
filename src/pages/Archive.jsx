import { Archive, RefreshCw, FolderOpen, Trash2, X } from 'lucide-react'
import { useTasks, useRestoreTask, useMoveToTrash, useBulkRestoreTasks, useBulkMoveToTrash, useEmptyArchive } from '../hooks/useTasks'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
        return <div className="p-8 text-center text-muted-foreground">Loading archive...</div>
    }

    const isAllSelected = tasks.length > 0 && selectedIds.length === tasks.length

    return (
        <div className="container-tight py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Archive className="w-8 h-8 text-primary" />
                        Archive
                    </h1>
                    <p className="text-muted-foreground">Completed projects and old tasks kept for reference.</p>
                </div>
                {tasks.length > 0 && (
                    <AlertDialog open={showEmptyConfirm} onOpenChange={setShowEmptyConfirm}>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Empty Archive
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Empty Archive?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will move all {tasks.length} archived items to the Trash. You can still restore them from there.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleEmptyArchive} className="bg-destructive text-destructive-foreground">
                                    Move All to Trash
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            <Card className="overflow-hidden">
                {tasks.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
                            <FolderOpen className="w-8 h-8 opacity-50" />
                        </div>
                        <p>Archive is empty</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {/* Header with Select All */}
                        <div className="p-4 bg-muted/30 flex items-center gap-4">
                            <Checkbox
                                checked={isAllSelected}
                                onCheckedChange={toggleSelectAll}
                                aria-label="Select all"
                            />
                            <span className="text-sm font-medium text-muted-foreground">
                                {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select tasks'}
                            </span>
                        </div>

                        {tasks.map(task => (
                            <div key={task.id} className={`p-4 flex items-center gap-4 group transition-colors ${selectedIds.includes(task.id) ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
                                <Checkbox
                                    checked={selectedIds.includes(task.id)}
                                    onCheckedChange={() => toggleSelect(task.id)}
                                />
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground/80">{task.title}</span>
                                        {task.project && (
                                            <Badge variant="outline" className="text-xs">{task.project.name}</Badge>
                                        )}
                                        {task.context && (
                                            <Badge variant="outline" className="text-xs" style={{ color: task.context.color, borderColor: task.context.color }}>
                                                {task.context.name}
                                            </Badge>
                                        )}
                                        {task.status === 'done' && (
                                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Done</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>Archived on {new Date(task.archived_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => restoreTask.mutate(task.id)}
                                        title="Restore to Tasks"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Restore
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => moveToTrash.mutate(task.id)}
                                        title="Move to Trash"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Bulk Actions Floating Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border shadow-xl rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4">
                    <span className="text-sm font-semibold border-r pr-4">{selectedIds.length} tasks selected</span>

                    <Button variant="ghost" size="sm" onClick={handleBulkRestore} className="text-primary hover:text-primary hover:bg-primary/10">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Restore
                    </Button>

                    <Button variant="ghost" size="sm" onClick={handleBulkTrash} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Move to Trash
                    </Button>

                    <Button variant="ghost" size="icon" onClick={() => setSelectedIds([])} className="h-8 w-8 rounded-full ml-2">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    )
}
