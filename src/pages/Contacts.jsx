import { useState, useMemo } from 'react'
import { Plus, Search, User, Building2, Phone, Mail, Filter, MoreHorizontal, Trash2, Edit2, Loader2 } from 'lucide-react'
import { useContacts } from '../hooks/useContacts'
import { useContextStore } from '../stores/contextStore'
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
    const [searchQuery, setSearchQuery] = useState('')
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
        <div className="container-tight py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Contacts</h1>
                    <p className="text-muted-foreground">Manage your clients and prospects</p>
                </div>
                <Button onClick={handleNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Contact
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{stats.all}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Clients</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">{stats.clients}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Prospects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-blue-600">{stats.prospects}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">In Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-purple-600">{stats.pipeline}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search contacts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

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
            <Card>
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
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Contact</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Contexts</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Contact Info</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
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
