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
        <div ref={setNodeRef} style={style} className="h-full">
            {isEditing && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 right-2 z-50 p-1.5 bg-background/80 backdrop-blur-sm rounded-md shadow-sm border border-border/50 cursor-grab active:cursor-grabbing hover:bg-accent transition-colors"
                >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>
            )}
            <div className={`h-full ${isEditing ? 'pointer-events-none select-none' : ''}`}>
                {children}
            </div>
            {isEditing && (
                <div className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-xl pointer-events-none" />
            )}
        </div>
    );
}
