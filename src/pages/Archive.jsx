import { useQueryClient } from '@tanstack/react-query'
import { Archive, RefreshCw, FolderOpen } from 'lucide-react'
import { useTasks, useRestoreTask, useMoveToTrash } from '../hooks/useTasks'
import { useContextStore } from '../stores/contextStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useEffect } from 'react'

export function ArchivePage() {
    const { setActiveContext } = useContextStore()

    // Force archive context when mounting
    useEffect(() => {
        setActiveContext('archive')
        return () => setActiveContext(null) // Reset on unmount
    }, [setActiveContext])

    const { data: tasks = [], isLoading } = useTasks()
    const restoreTask = useRestoreTask()
    const moveToTrash = useMoveToTrash()

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading archive...</div>
    }

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
            </div>

            <Card>
                {tasks.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
                            <FolderOpen className="w-8 h-8 opacity-50" />
                        </div>
                        <p>Archive is empty</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {tasks.map(task => (
                            <div key={task.id} className="p-4 flex items-center justify-between group hover:bg-muted/50 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground/80">{task.title}</span>
                                        {task.project && (
                                            <Badge variant="outline" className="text-xs">{task.project.name}</Badge>
                                        )}
                                        {task.status === 'done' && (
                                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Done</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>Archived on {new Date(task.archived_at).toLocaleDateString()}</span>
                                        {task.context && (
                                            <>• <span style={{ color: task.context.color }}>{task.context.name}</span></>
                                        )}
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
        </div>
    )
}
