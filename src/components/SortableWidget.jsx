import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export function SortableWidget({ id, children, isEditing }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        height: '100%',
        zIndex: isDragging ? 1000 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="h-full relative group">
            {isEditing && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 right-2 z-[60] p-1.5 bg-primary text-primary-foreground rounded-md shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-all"
                    title="Glisser pour réorganiser"
                >
                    <GripVertical className="w-4 h-4" />
                </div>
            )}

            <div className="h-full">
                {children}
            </div>

            {isEditing && (
                <div className="absolute inset-0 border-2 border-primary/40 bg-primary/5 rounded-xl pointer-events-none -z-10" />
            )}
        </div>
    );
}
