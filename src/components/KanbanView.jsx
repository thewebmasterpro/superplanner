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

    const handleDragEnd = (event) => {
        const { active, over } = event
        if (!over) return

        const activeTask = active.data.current
        const overData = over.data.current

        let newStatus = over.id

        // If dropping over another card, get its status
        if (overData && overData.type === 'task') {
            newStatus = overData.status
        }

        if (activeTask.status !== newStatus && COLUMNS.find(c => c.id === newStatus)) {
            onStatusChange(active.id, newStatus)
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full items-start">
                {COLUMNS.map((column) => (
                    <KanbanColumn
                        key={column.id}
                        column={column}
                        tasks={tasks.filter((t) => t.status === column.id)}
                        onTaskClick={onTaskClick}
                    />
                ))}
            </div>
        </DndContext>
    )
}

function KanbanColumn({ column, tasks, onTaskClick }) {
    const { setNodeRef } = useDroppable({
        id: column.id,
        data: {
            type: 'column',
            status: column.id
        }
    })

    return (
        <div ref={setNodeRef} className="flex flex-col gap-4 min-h-[500px]">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${column.color}`} />
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                        {column.title}
                    </h3>
                    <Badge variant="secondary" className="ml-2 bg-muted/50">
                        {tasks.length}
                    </Badge>
                </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-2 min-h-[200px] border border-dashed border-border/50">
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
                            />
                        ))}
                        {tasks.length === 0 && (
                            <div className="text-center py-10 text-xs text-muted-foreground opacity-50 italic">
                                No items
                            </div>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    )
}

function KanbanCard({ task, onClick }) {
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
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={`glass-card card-hover cursor-grab active:cursor-grabbing border-border/40 group ${isDragging ? 'shadow-2xl ring-2 ring-primary/20' : ''
                }`}
            onClick={onClick}
            {...attributes}
            {...listeners}
        >
            <CardContent className="p-3 space-y-3">
                <div className="flex justify-between items-start gap-2">
                    <h4 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                        {task.title}
                    </h4>
                </div>

                {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                    </p>
                )}

                <div className="flex flex-wrap gap-1">
                    {task.context && (
                        <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0 h-4"
                            style={{
                                backgroundColor: `${task.context.color}10`,
                                borderColor: `${task.context.color}30`,
                                color: task.context.color,
                            }}
                        >
                            {task.context.name}
                        </Badge>
                    )}
                    {task.priority >= 4 && (
                        <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                            P{task.priority}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[10px]">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                        </span>
                    </div>
                    {task.assigned_to && (
                        <Avatar className="h-5 w-5 border border-background">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                <User className="h-3 w-3" />
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
