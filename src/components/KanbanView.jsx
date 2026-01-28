import React from 'react'
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Calendar, MoreVertical } from 'lucide-react'

const COLUMNS = [
    { id: 'todo', title: 'To Do', color: 'bg-slate-500' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-orange-500' },
    { id: 'blocked', title: 'Blocked', color: 'bg-red-500' },
    { id: 'done', title: 'Done', color: 'bg-green-500' },
]

export function KanbanView({ tasks, onStatusChange, onTaskClick }) {
    const [activeId, setActiveId] = React.useState(null)
    const activeTask = React.useMemo(() =>
        activeId ? tasks.find(t => t.id === activeId) : null,
        [activeId, tasks]
    )

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragStart = (event) => {
        setActiveId(event.active.id)
    }

    const handleDragEnd = (event) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const activeTaskData = active.data.current
        const overData = over.data.current

        let newStatus = over.id

        // If dropping over another card, get its status
        if (overData && overData.type === 'task') {
            newStatus = overData.status
        }

        if (activeTaskData.status !== newStatus && COLUMNS.find(c => c.id === newStatus)) {
            onStatusChange(active.id, newStatus)
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full items-start">
                {COLUMNS.map((column) => (
                    <KanbanColumn
                        key={column.id}
                        column={column}
                        tasks={tasks.filter((t) => t.status === column.id)}
                        onTaskClick={onTaskClick}
                        activeId={activeId}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: '0.4',
                        },
                    },
                }),
            }}>
                {activeTask ? (
                    <div className="rotate-3 scale-105 transition-transform duration-200 pointer-events-none shadow-2xl rounded-xl ring-2 ring-primary/20 bg-background">
                        <KanbanCard
                            task={activeTask}
                            isOverlay
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}

function KanbanColumn({ column, tasks, onTaskClick, activeId }) {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
        data: {
            type: 'column',
            status: column.id
        }
    })

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col gap-4 min-h-[500px] transition-colors duration-200 rounded-2xl p-2 ${isOver ? 'bg-primary/5 ring-2 ring-primary/20' : ''
                }`}
        >
            <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${column.color} shadow-sm`} />
                    <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground/80">
                        {column.title}
                    </h3>
                    <Badge variant="secondary" className="ml-1 bg-muted/50 font-mono text-[10px]">
                        {tasks.length}
                    </Badge>
                </div>
            </div>

            <div className={`rounded-xl p-2 flex-1 border border-dashed transition-all duration-300 ${isOver ? 'border-primary/40 bg-background/50' : 'border-border/50 bg-muted/20'
                }`}>
                <SortableContext
                    id={column.id}
                    items={tasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-3">
                        {tasks.map((task) => (
                            <KanbanCard
                                key={task.id}
                                task={task}
                                onClick={() => onTaskClick(task)}
                                isPlaceholder={activeId === task.id}
                            />
                        ))}
                        {tasks.length === 0 && !isOver && (
                            <div className="text-center py-10 text-xs text-muted-foreground/30 font-medium italic">
                                Drop tasks here
                            </div>
                        )}
                        {isOver && tasks.length === 0 && (
                            <div className="text-center py-10 text-xs text-primary/40 font-bold animate-pulse">
                                Drop to move
                            </div>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    )
}

function KanbanCard({ task, onClick, isOverlay, isPlaceholder }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'task',
            status: task.status,
        },
        disabled: isOverlay
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isPlaceholder ? 0.3 : 1,
        visibility: isDragging && !isOverlay ? 'hidden' : 'visible',
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={`
                group relative border-border/40 transition-all duration-200
                ${isOverlay ? 'cursor-grabbing shadow-2xl border-primary/20' : 'cursor-grab hover:shadow-md hover:border-primary/30'}
                ${isPlaceholder ? 'grayscale pointer-events-none border-dashed' : ''}
            `}
            onClick={!isOverlay ? onClick : undefined}
            {...attributes}
            {...listeners}
        >
            <CardContent className="p-3.5 space-y-3">
                <div className="flex justify-between items-start gap-2">
                    <h4 className="font-semibold text-sm leading-tight text-foreground/90 group-hover:text-primary transition-colors line-clamp-2">
                        {task.title}
                    </h4>
                </div>

                {task.description && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                        {task.description}
                    </p>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                    {task.context && (
                        <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 font-medium border-transparent uppercase tracking-tight"
                            style={{
                                backgroundColor: `${task.context.color}15`,
                                color: task.context.color,
                            }}
                        >
                            {task.context.name}
                        </Badge>
                    )}
                    {task.priority >= 4 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 font-bold shadow-sm">
                            P{task.priority}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/30 mt-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No date'}
                        </span>
                    </div>
                    {task.assigned_to && (
                        <Avatar className="h-5 w-5 border border-background shadow-sm ring-1 ring-border/50">
                            <AvatarFallback className="text-[10px] bg-primary/5 text-primary font-bold">
                                {task.assigned_to.substring(0, 1).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
