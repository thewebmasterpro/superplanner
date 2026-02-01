import { useMemo } from 'react'
import {
    CheckCircle2,
    Calendar,
    Users,
    Trash2,
    Zap,
    Clock,
    Loader2
} from 'lucide-react'
import { useUpdateTask, useMoveToTrash } from '../hooks/useTasks'
import { useUIStore } from '../stores/uiStore'
import { cn } from '../lib/utils'
import { isToday, isTomorrow, isBefore, addDays, parseISO } from 'date-fns'

// Pure helpers (outside component to avoid re-creation on each render)
function checkIsImportant(t) {
    const p = String(t.priority || '').toLowerCase()
    return p === 'high' || p === 'urgent' || p === '5' || p === '4' || t.priority >= 4
}

function checkIsUrgent(t) {
    if (!t.due_date) return false
    try {
        const dueDate = parseISO(t.due_date)
        const tomorrow = addDays(new Date(), 1)
        return isBefore(dueDate, tomorrow) || isToday(dueDate) || isTomorrow(dueDate)
    } catch {
        return false
    }
}

// Static style map (Tailwind can't detect dynamically constructed classes)
const QUADRANT_STYLES = {
    q1: { bg: 'bg-error/5', text: 'text-error', badge: 'badge-error', btn: 'btn-error' },
    q2: { bg: 'bg-primary/5', text: 'text-primary', badge: 'badge-primary', btn: 'btn-primary' },
    q3: { bg: 'bg-warning/5', text: 'text-warning', badge: 'badge-warning', btn: 'btn-warning' },
    q4: { bg: 'bg-base-content/5', text: 'text-base-content', badge: 'badge-ghost', btn: 'btn-ghost' }
}

export function EisenhowerWidget({ tasks = [] }) {
    const updateTask = useUpdateTask()
    const moveToTrash = useMoveToTrash()
    const { setTaskModalOpen, setModalTask } = useUIStore()

    // Categorize tasks into 4 quadrants
    const matrix = useMemo(() => {
        const categories = {
            q1: { title: 'DO IT NOW', icon: <Zap className="w-4 h-4" />, items: [], desc: 'Urgent & Important' },
            q2: { title: 'PLAN IT', icon: <Calendar className="w-4 h-4" />, items: [], desc: 'Important, Not Urgent' },
            q3: { title: 'DELEGATE', icon: <Users className="w-4 h-4" />, items: [], desc: 'Urgent, Not Important' },
            q4: { title: 'ELIMINATE', icon: <Trash2 className="w-4 h-4" />, items: [], desc: 'Not Urgent or Important' }
        }

        const activeTasks = (tasks || []).filter(t => t.status !== 'done' && t.status !== 'cancelled')

        activeTasks.forEach(t => {
            const important = checkIsImportant(t)
            const urgent = checkIsUrgent(t)

            if (important && urgent) categories.q1.items.push(t)
            else if (important && !urgent) categories.q2.items.push(t)
            else if (!important && urgent) categories.q3.items.push(t)
            else categories.q4.items.push(t)
        })

        // Sort each quadrant by priority then due date
        Object.values(categories).forEach(q => {
            q.items.sort((a, b) => {
                const pA = parseInt(a.priority) || 1
                const pB = parseInt(b.priority) || 1
                if (pB !== pA) return pB - pA
                return (a.due_date || '').localeCompare(b.due_date || '')
            })
        })

        return categories
    }, [tasks])

    const handleTaskClick = (task) => {
        setModalTask(task)
        setTaskModalOpen(true)
    }

    const handleAction = (e, task, type) => {
        e.stopPropagation()
        switch (type) {
            case 'q1':
                updateTask.mutate({ id: task.id, updates: { status: 'done' } })
                break
            case 'q2':
                handleTaskClick(task) // Planning = open modal
                break
            case 'q3':
                handleTaskClick(task) // Delegating = open modal (assignment)
                break
            case 'q4':
                moveToTrash.mutate(task.id)
                break
            default:
                break
        }
    }

    const renderQuadrant = (id, q) => {
        const styles = QUADRANT_STYLES[id]
        return (
        <div key={id} className="flex flex-col h-full min-h-[180px] bg-base-100/30 rounded-2xl border border-base-content/5 overflow-hidden group/quad">
            {/* Quadrant Header */}
            <div className={cn(
                "px-3 py-2 flex items-center justify-between border-b border-base-content/5",
                styles.bg
            )}>
                <div className="flex items-center gap-2">
                    <span className={cn("p-1 rounded-md bg-base-100 shadow-sm", styles.text)}>
                        {q.icon}
                    </span>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black tracking-widest uppercase opacity-70 leading-tight">
                            {q.title}
                        </span>
                        <span className="text-[8px] font-medium opacity-40 uppercase tracking-tighter">
                            {q.desc}
                        </span>
                    </div>
                </div>
                <div className={cn("badge badge-sm font-bold", styles.badge)}>
                    {q.items.length}
                </div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar max-h-[220px]">
                {q.items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-8">
                        <CheckCircle2 className="w-8 h-8 mb-2" />
                        <span className="text-[10px] uppercase font-bold">Libre</span>
                    </div>
                ) : (
                    q.items.slice(0, 5).map(task => (
                        <div
                            key={task.id}
                            onClick={() => handleTaskClick(task)}
                            className="group/item relative bg-base-100 p-2 rounded-xl border border-base-content/5 shadow-sm hover:border-primary/30 transition-all cursor-pointer hover:shadow-md"
                        >
                            <div className="flex justify-between items-start gap-2">
                                <span className="text-xs font-bold leading-tight line-clamp-2 flex-1">
                                    {task.title}
                                </span>
                                <button
                                    disabled={updateTask.isPending || moveToTrash.isPending}
                                    onClick={(e) => handleAction(e, task, id)}
                                    className={cn(
                                        "btn btn-xs btn-square opacity-0 group-hover/item:opacity-100 transition-opacity",
                                        styles.btn
                                    )}
                                    aria-label={`Action for ${task.title}`}
                                >
                                    {(updateTask.isPending || moveToTrash.isPending) ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : id === 'q1' ? (
                                        <CheckCircle2 className="w-3 h-3" />
                                    ) : id === 'q4' ? (
                                        <Trash2 className="w-3 h-3" />
                                    ) : (
                                        <Clock className="w-3 h-3" />
                                    )}
                                </button>
                            </div>
                            {task.due_date && (
                                <div className="text-[9px] opacity-40 mt-1 flex items-center gap-1 font-mono">
                                    <Clock className="w-2.5 h-2.5" />
                                    {new Date(task.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                </div>
                            )}
                        </div>
                    ))
                )}
                {q.items.length > 5 && (
                    <div className="text-center">
                        <span className="text-[10px] font-bold opacity-30 tracking-widest uppercase">
                            + {q.items.length - 5} autres
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full animate-in fade-in duration-500">
            {Object.entries(matrix).map(([id, q]) => renderQuadrant(id, q))}
        </div>
    )
}
