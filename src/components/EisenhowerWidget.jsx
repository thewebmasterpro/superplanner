import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { useUpdateTask } from '../hooks/useTasks'
import { cn } from '../lib/utils'

export function EisenhowerWidget({ tasks }) {
    const updateTask = useUpdateTask()

    // Filter for Urgent & Important
    // Criteria:
    // 1. Status is NOT done/cancelled
    // 2. Priority is High (4) or Urgent (5)
    // 3. Due Date is Today, Overdue, or Tomorrow (Immediate attention)
    const urgentTask = tasks
        .filter(t => {
            if (t.status === 'done' || t.status === 'cancelled') return false

            // Priority check (assuming 1-5 scale, 4=High, 5=Urgent)
            const isPriority = (t.priority || 0) >= 4

            // Date check
            const today = new Date().toISOString().split('T')[0]
            const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
            const isDueSoon = t.due_date && t.due_date <= tomorrow

            return isPriority && isDueSoon
        })
        .sort((a, b) => {
            // Sort by Priority desc, then Due Date asc
            if (b.priority !== a.priority) return b.priority - a.priority
            return (a.due_date || '').localeCompare(b.due_date || '')
        })[0] // Get top 1

    const handleComplete = (e) => {
        e.stopPropagation()
        if (urgentTask) {
            updateTask.mutate({
                id: urgentTask.id,
                updates: { status: 'done' }
            })
        }
    }

    if (!urgentTask) {
        return (
            <Card className="h-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-green-900 dark:text-green-100">All Clear!</h3>
                        <p className="text-sm text-green-700 dark:text-green-300">No urgent & important tasks right now.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full border-red-200 dark:border-red-900 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />

            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                            <CardTitle className="text-lg font-bold text-red-700 dark:text-red-400">
                                DO IT NOW
                            </CardTitle>
                        </div>
                        <CardDescription>Urgent & Important</CardDescription>
                    </div>
                    <Badge variant="destructive" className="animate-in fade-in zoom-in">
                        P{urgentTask.priority}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div>
                    <h4 className={cn(
                        "text-xl font-bold leading-tight mb-2 line-clamp-2",
                        "group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors"
                    )}>
                        {urgentTask.title}
                    </h4>
                    {urgentTask.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {urgentTask.description}
                        </p>
                    )}
                </div>

                <div className="pt-2">
                    <Button
                        className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02]"
                        onClick={handleComplete}
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark as Done
                    </Button>
                </div>
            </CardContent>

            {/* Background decoration */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full blur-2xl -z-10" />
        </Card>
    )
}
