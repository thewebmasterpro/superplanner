import { useQueryClient } from '@tanstack/react-query'
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react'
import { useTasks, useRestoreTask, usePermanentDeleteTask } from '../hooks/useTasks'
import { useContextStore } from '../stores/contextStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
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
import { useEffect } from 'react'

export function Trash() {
    const { setActiveContext } = useContextStore()

    // Force trash context when mounting
    useEffect(() => {
        setActiveContext('trash')
        return () => setActiveContext(null) // Reset on unmount
    }, [setActiveContext])

    const { data: tasks = [], isLoading } = useTasks()
    const restoreTask = useRestoreTask()
    const permanentDeleteTask = usePermanentDeleteTask()

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading trash...</div>
    }

    return (
        <div className="container-tight py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Trash2 className="w-8 h-8 text-destructive" />
                        Trash
                    </h1>
                    <p className="text-muted-foreground">Items in trash are automatically deleted after 30 days (coming soon).</p>
                </div>
            </div>

            <Card>
                {tasks.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
                            <Trash2 className="w-8 h-8 opacity-50" />
                        </div>
                        <p>Trash is empty</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {tasks.map(task => (
                            <div key={task.id} className="p-4 flex items-center justify-between group hover:bg-muted/50 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium line-through text-muted-foreground">{task.title}</span>
                                        {task.project && (
                                            <Badge variant="outline" className="text-xs">{task.project.name}</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Deleted on {new Date(task.deleted_at).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => restoreTask.mutate(task.id)}
                                        title="Restore"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Restore
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                title="Delete Permanently"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the task
                                                    <span className="font-medium text-foreground"> "{task.title}" </span>
                                                    from our servers.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    onClick={() => permanentDeleteTask.mutate(task.id)}
                                                >
                                                    Delete Forever
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}
