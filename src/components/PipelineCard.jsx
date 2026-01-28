import React, { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Building2, Phone, Mail, Calendar, MoreHorizontal, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ComposeEmailModal } from './ComposeEmailModal'

export function PipelineCard({ contact, index, onClick, onEdit, onDelete, isOverlay, isPlaceholder }) {
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: contact.id,
        data: {
            type: 'contact',
            contact: contact
        },
        disabled: isOverlay
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isPlaceholder ? 0.3 : 1,
        visibility: isDragging && !isOverlay ? 'hidden' : 'visible',
    }

    // Prevent propagation for action buttons
    const handleAction = (e, callback) => {
        e.stopPropagation()
        e.preventDefault()
        callback?.()
    }

    // Allow default for links but prevent card click
    const handleLinkClick = (e) => {
        e.stopPropagation()
    }

    const handleEmailClick = (e) => {
        e.stopPropagation()
        e.preventDefault()
        setIsEmailModalOpen(true)
    }

    return (
        <>
            <Card
                ref={setNodeRef}
                style={style}
                className={`
                    group relative border-border/40 transition-all duration-200
                    ${isOverlay ? 'cursor-grabbing shadow-2xl border-primary/20 bg-background rotate-2 scale-105' : 'cursor-grab hover:shadow-md hover:border-primary/30'}
                    ${isPlaceholder ? 'grayscale pointer-events-none border-dashed' : ''}
                `}
                onClick={() => !isOverlay && !isDragging && onClick?.(contact)}
                {...attributes}
                {...listeners}
            >
                <CardContent className="p-3.5 space-y-3">
                    {/* Header: Name and Type Icon */}
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${contact.type === 'company' ? 'bg-blue-100 text-blue-600' : 'bg-primary/10 text-primary'
                                }`}>
                                {contact.type === 'company' ? (
                                    <Building2 className="w-4 h-4" />
                                ) : (
                                    <User className="w-4 h-4" />
                                )}
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm leading-tight text-foreground/90 group-hover:text-primary transition-colors line-clamp-1">
                                    {contact.name}
                                </h4>
                                {contact.company && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {contact.company}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => handleAction(e, () => onEdit(contact))}>
                                    <Edit2 className="w-3.5 h-3.5 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => handleAction(e, () => onDelete(contact))}
                                    className="text-destructive"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Contact Info (if available) */}
                    {(contact.email || contact.phone) && (
                        <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
                            {contact.email && (
                                <button
                                    onClick={handleEmailClick}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 hover:text-primary transition-colors hover:underline text-left"
                                >
                                    <Mail className="w-3 h-3 opacity-70" />
                                    <span className="truncate max-w-[180px]">{contact.email}</span>
                                </button>
                            )}
                            {contact.phone && (
                                <a
                                    href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleLinkClick}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 hover:text-green-600 transition-colors hover:underline"
                                >
                                    <Phone className="w-3 h-3 opacity-70" />
                                    <span>{contact.phone}</span>
                                </a>
                            )}
                        </div>
                    )}

                    {/* Footer: Tags/Contexts and Last Activity */}
                    <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                            {contact.contact_contexts?.slice(0, 2).map(cc => cc.context && (
                                <Badge
                                    key={cc.context.id}
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 h-4 font-medium border-transparent shrink-0"
                                    style={{
                                        backgroundColor: `${cc.context.color}15`,
                                        color: cc.context.color,
                                    }}
                                >
                                    {cc.context.name}
                                </Badge>
                            ))}
                            {(contact.contact_contexts?.length || 0) > 2 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                    +{contact.contact_contexts.length - 2}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground" title="Last updated">
                            <Calendar className="w-3 h-3" />
                            <span>
                                {new Date(contact.updated_at || contact.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ComposeEmailModal
                open={isEmailModalOpen}
                onOpenChange={setIsEmailModalOpen}
                contact={contact}
            />
        </>
    )
}
