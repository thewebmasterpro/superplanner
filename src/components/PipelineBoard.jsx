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
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { PipelineColumn } from './PipelineColumn'
import { PipelineCard } from './PipelineCard'

const COLUMNS = [
    { id: 'prospect_new', title: 'New Prospect', color: 'text-blue-700' },
    { id: 'prospect_interested', title: 'Interested', color: 'text-orange-700' },
    { id: 'proposal_sent', title: 'Proposal Sent', color: 'text-purple-700' },
    { id: 'negotiating', title: 'Negotiating', color: 'text-yellow-700' },
    { id: 'client', title: 'Closed Won', color: 'text-green-700' },
    { id: 'inactive', title: 'Inactive', color: 'text-gray-700' },
    { id: 'lost', title: 'Lost', color: 'text-red-700' },
]

export function PipelineBoard({ contacts, onStatusChange, onContactClick, onEdit, onDelete }) {
    const [activeId, setActiveId] = React.useState(null)
    const activeContact = React.useMemo(() =>
        activeId ? contacts.find(c => c.id === activeId) : null,
        [activeId, contacts]
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

        const activeContactData = active.data.current
        const overData = over.data.current

        let newStatus = over.id

        // If dropping over another card, get its status
        if (overData && overData.type === 'contact') {
            newStatus = overData.contact.status
        }

        const validStatuses = COLUMNS.map(c => c.id)

        if (activeContactData.contact.status !== newStatus && validStatuses.includes(newStatus)) {
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
            <div className="flex gap-6 h-full items-start overflow-x-auto pb-4 px-2 snap-x snap-mandatory">
                {COLUMNS.map((column) => (
                    <div key={column.id} className="min-w-[280px] w-[280px] snap-center">
                        <PipelineColumn
                            column={column}
                            contacts={contacts.filter((c) => (c.status || 'prospect_new') === column.id)}
                            onClick={onContactClick}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            activeId={activeId}
                        />
                    </div>
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
                {activeContact ? (
                    <PipelineCard
                        contact={activeContact}
                        isOverlay
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
