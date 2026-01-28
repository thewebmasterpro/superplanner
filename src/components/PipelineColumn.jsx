import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge } from '@/components/ui/badge'
import { PipelineCard } from './PipelineCard'

export function PipelineColumn({ column, contacts, onClick, onEdit, onDelete, activeId }) {
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
            className={`flex flex-col gap-3 min-h-[500px] transition-colors duration-200 rounded-2xl p-2 ${isOver ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-transparent'
                }`}
        >
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${column.color.replace('text-', 'bg-').replace('700', '100')}`}>
                <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-xs uppercase tracking-widest ${column.color}`}>
                        {column.title}
                    </h3>
                </div>
                <Badge variant="secondary" className="bg-white/50 font-mono text-[10px] text-foreground/70 shadow-sm">
                    {contacts.length}
                </Badge>
            </div>

            <div className={`rounded-xl p-2 flex-1 border border-dashed transition-all duration-300 flex flex-col gap-3 ${isOver ? 'border-primary/40 bg-background/50' : 'border-border/40 bg-muted/10'
                }`}>
                <SortableContext
                    id={column.id}
                    items={contacts.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {contacts.map((contact, index) => (
                        <PipelineCard
                            key={contact.id}
                            contact={contact}
                            index={index}
                            onClick={onClick}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            isPlaceholder={activeId === contact.id}
                        />
                    ))}
                </SortableContext>

                {contacts.length === 0 && !isOver && (
                    <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/30 font-medium italic min-h-[100px]">
                        Drop contacts here
                    </div>
                )}
                {isOver && contacts.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-xs text-primary/40 font-bold animate-pulse min-h-[100px]">
                        Drop to move
                    </div>
                )}
            </div>
        </div>
    )
}
