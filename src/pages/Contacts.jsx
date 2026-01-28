import { useState, useMemo } from 'react'
import { Plus, Search, User, Building2, Phone, Mail, Filter, MoreHorizontal, Trash2, Edit2, Loader2 } from 'lucide-react'
import { useContacts } from '../hooks/useContacts'
import { useContextStore } from '../stores/contextStore'
import { useUIStore } from '../stores/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ContactModal, STATUS_OPTIONS } from '../components/ContactModal'

export function Contacts() {
    const { searchQuery } = useUIStore()
    const [statusFilter, setStatusFilter] = useState('all')
    const [contextFilter, setContextFilter] = useState('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedContact, setSelectedContact] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const { contacts, isLoading, deleteContact } = useContacts({
        status: statusFilter,
        contextId: contextFilter,
        search: searchQuery
    })
    const { contexts } = useContextStore()

    // Stats
    const stats = useMemo(() => {
        const all = contacts.length
        const clients = contacts.filter(c => c.status === 'client').length
        const prospects = contacts.filter(c => c.status.startsWith('prospect')).length
        const pipeline = contacts.filter(c => ['proposal_sent', 'negotiating'].includes(c.status)).length
        return { all, clients, prospects, pipeline }
    }, [contacts])

    const handleEdit = (contact) => {
        setSelectedContact(contact)
        setIsModalOpen(true)
    }

    const handleNew = () => {
        setSelectedContact(null)
        setIsModalOpen(true)
    }

    const handleDelete = () => {
        if (deleteConfirm) {
            deleteContact(deleteConfirm.id)
            setDeleteConfirm(null)
        }
    }

    const getStatusBadge = (status) => {
        const opt = STATUS_OPTIONS.find(o => o.value === status)
        return opt ? (
            <Badge className={opt.color}>{opt.label}</Badge>
        ) : (
            <Badge variant="outline">{status}</Badge>
        )
    }

    return (
        <div className="container-tight py-8 section-gap">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight font-display flex items-center gap-2">
                        <User className="w-8 h-8 text-primary" />
                        Contacts
                    </h1>
                    <p className="text-muted-foreground font-medium">Manage your clients and prospects</p>
                </div>
                <div className="flex gap-2">
                    {/* Centralized creation handled by Navbar */}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card className="glass-card card-hover border-border/40">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold tracking-tight">{stats.all}</p>
                    </CardContent>
                </Card>
                <Card className="glass-card card-hover border-border/40">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clients</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold tracking-tight text-green-600">{stats.clients}</p>
                    </CardContent>
                </Card>
                <Card className="glass-card card-hover border-border/40">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prospects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold tracking-tight text-blue-600">{stats.prospects}</p>
                    </CardContent>
                </Card>
                <Card className="glass-card card-hover border-border/40 relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold tracking-tight text-purple-600">{stats.pipeline}</p>
                        {stats.pipeline > 0 && (
                            <div className="absolute top-2 right-2 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-4 flex-wrap justify-end">

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            {STATUS_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={contextFilter} onValueChange={setContextFilter}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Context" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Contexts</SelectItem>
                            {contexts.map(ctx => (
                                <SelectItem key={ctx.id} value={ctx.id}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ctx.color }} />
                                        {ctx.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Contacts List */}
            <Card className="glass-panel overflow-hidden border-border/40 shadow-xl rounded-xl">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No contacts found</p>
                            <Button variant="link" onClick={handleNew}>Create your first contact</Button>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-muted/30 border-b border-border/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contexts</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Info</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {contacts.map(contact => (
                                    <tr
                                        key={contact.id}
                                        className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => handleEdit(contact)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    {contact.type === 'company' ? (
                                                        <Building2 className="w-5 h-5 text-primary" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{contact.name}</p>
                                                    {contact.company && (
                                                        <p className="text-sm text-muted-foreground">{contact.company}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(contact.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {contact.contact_contexts?.map(cc => cc.context && (
                                                    <Badge
                                                        key={cc.context.id}
                                                        variant="outline"
                                                        className="text-xs"
                                                        style={{
                                                            backgroundColor: `${cc.context.color}15`,
                                                            borderColor: cc.context.color,
                                                            color: cc.context.color
                                                        }}
                                                    >
                                                        {cc.context.name}
                                                    </Badge>
                                                ))}
                                                {(!contact.contact_contexts || contact.contact_contexts.length === 0) && (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm">
                                                {contact.email && (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Mail className="w-3 h-3" />
                                                        {contact.email}
                                                    </div>
                                                )}
                                                {contact.phone && (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Phone className="w-3 h-3" />
                                                        {contact.phone}
                                                    </div>
                                                )}
                                                {!contact.email && !contact.phone && '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(contact); }}>
                                                        <Edit2 className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(contact); }}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>

            {/* Contact Modal */}
            <ContactModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                contact={selectedContact}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{deleteConfirm?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. All data associated with this contact will be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
