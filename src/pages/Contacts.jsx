import { useState, useMemo } from 'react'
import { Plus, Search, User, Building2, Phone, Mail, Filter, MoreHorizontal, Trash2, Edit2, Loader2, List, Columns, MessageCircle } from 'lucide-react'
import { useContacts } from '../hooks/useContacts'
import { useWorkspaceStore } from '../stores/workspaceStore'
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
import { PipelineBoard } from '../components/PipelineBoard'
import { ComposeEmailModal } from '../components/ComposeEmailModal'
import { ContactsBulkActionsBar } from '../components/ContactsBulkActionsBar'
import { Checkbox } from '@/components/ui/checkbox'
import toast from 'react-hot-toast'

export function Contacts({ initialView = 'list' }) {
    const { searchQuery } = useUIStore()
    const [statusFilter, setStatusFilter] = useState('all')
    const [workspaceFilter, setWorkspaceFilter] = useState('all')
    const [viewMode, setViewMode] = useState(initialView) // 'list' or 'pipeline'
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedContact, setSelectedContact] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [selectedIds, setSelectedIds] = useState([]) // For bulk actions
    // Email Modal state for list view
    const [emailContact, setEmailContact] = useState(null)
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)

    const { contacts, isLoading, deleteContact, updateContact } = useContacts({
        status: viewMode === 'pipeline' ? 'all' : statusFilter, // Force all statuses in pipeline view
        workspaceId: workspaceFilter,
        search: searchQuery
    })

    const { workspaces } = useWorkspaceStore()

    // Stats
    const stats = useMemo(() => {
        const all = contacts.length
        const clients = contacts.filter(c => c.status === 'client').length
        const prospects = contacts.filter(c => c.status && c.status.startsWith('prospect')).length
        const pipeline = contacts.filter(c => ['proposal_sent', 'negotiating'].includes(c.status)).length
        return { all, clients, prospects, pipeline }
    }, [contacts])

    const handleEmail = (contact, e) => {
        e?.stopPropagation()
        setEmailContact(contact)
        setIsEmailModalOpen(true)
    }

    const handleWhatsApp = (contact, e) => {
        e?.stopPropagation()
        if (contact.phone) {
            window.open(`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`, '_blank')
        }
    }

    const handleEdit = (contact) => {
        // Always get the latest version from contacts array to avoid stale data
        const latestContact = contacts.find(c => c.id === contact.id) || contact
        setSelectedContact(latestContact)
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

    // Selection Logic
    const toggleSelection = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === contacts.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(contacts.map(c => c.id))
        }
    }

    const handleStatusChange = async (contactId, newStatus) => {
        const contact = contacts.find(c => c.id === contactId)
        if (!contact) return

        try {
            updateContact({
                id: contactId,
                status: newStatus
            }, {
                onSuccess: () => {
                    toast.success(`Moved to ${STATUS_OPTIONS.find(o => o.value === newStatus)?.label || newStatus}`)
                }
            })
        } catch (error) {
            console.error('Failed to update status:', error)
            toast.error('Failed to update status')
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
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display flex items-center gap-2 text-primary">
                        <User className="w-8 h-8" />
                        Contacts
                    </h1>
                    <p className="text-muted-foreground">Gérez vos clients, prospects et partenaires.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div data-tour="contacts-view-toggle" className="flex items-center gap-1">
                        <button
                            className={`btn btn-sm btn-ghost btn-square transition-transform hover:scale-110 active:scale-95 ${viewMode === 'list' ? 'btn-active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            className={`btn btn-sm btn-ghost btn-square transition-transform hover:scale-110 active:scale-95 ${viewMode === 'pipeline' ? 'btn-active' : ''}`}
                            onClick={() => setViewMode('pipeline')}
                        >
                            <Columns className="w-4 h-4" />
                        </button>
                    </div>
                    <button data-tour="contacts-create" onClick={handleNew} className="btn gap-2 shadow-none transition-transform hover:scale-105 active:scale-95">
                        <Plus className="w-5 h-5" />
                        Nouveau Contact
                    </button>
                </div>
            </div>

            {/* Stats */}
            {viewMode === 'list' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger-fast">
                    <div className="stats shadow bg-base-100 border border-base-300">
                        <div className="stat">
                            <div className="stat-title text-xs font-bold uppercase opacity-50">Total</div>
                            <div className="stat-value text-2xl tracking-tight">{stats.all}</div>
                        </div>
                    </div>
                    <div className="stats shadow bg-base-100 border border-base-300">
                        <div className="stat">
                            <div className="stat-title text-xs font-bold uppercase opacity-50 text-success">Clients</div>
                            <div className="stat-value text-success text-2xl tracking-tight">{stats.clients}</div>
                        </div>
                    </div>
                    <div className="stats shadow bg-base-100 border border-base-300">
                        <div className="stat">
                            <div className="stat-title text-xs font-bold uppercase opacity-50 text-info">Prospects</div>
                            <div className="stat-value text-info text-2xl tracking-tight">{stats.prospects}</div>
                        </div>
                    </div>
                    <div className="stats shadow bg-base-100 border border-base-300">
                        <div className="stat overflow-visible">
                            <div className="stat-title text-xs font-bold uppercase opacity-50 text-warning">En Pipeline</div>
                            <div className="stat-value text-warning text-2xl tracking-tight flex items-center gap-2">
                                {stats.pipeline}
                                {stats.pipeline > 0 && <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
                                </span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div data-tour="contacts-search" className="flex flex-wrap gap-2 items-center bg-base-100 p-3 rounded-2xl shadow-sm border border-base-300">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input
                        type="text"
                        placeholder="Rechercher un contact..."
                        className="input input-sm input-ghost w-full pl-9 focus:bg-base-200"
                        value={searchQuery}
                        onChange={(e) => useUIStore.setState({ searchQuery: e.target.value })}
                    />
                </div>
                {viewMode === 'list' && (
                    <>
                        <div className="divider divider-horizontal m-0 py-2"></div>
                        <select
                            className="select select-sm rounded-xl bg-base-200/30 border border-base-300 font-bold text-xs pl-4 focus:border-primary/50 focus:outline-none transition-colors"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Tous les statuts</option>
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </>
                )}
                <div className="divider divider-horizontal m-0 py-2"></div>
                <select
                    className="select select-sm rounded-xl bg-base-200/30 border border-base-300 font-bold text-xs pl-4 focus:border-primary/50 focus:outline-none transition-colors"
                    value={workspaceFilter}
                    onChange={e => setWorkspaceFilter(e.target.value)}
                >
                    <option value="all">Tous les workspaces</option>
                    {workspaces.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </select>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20 flex-1">
                    <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
                </div>
            ) : viewMode === 'pipeline' ? (
                <div className="flex-1 overflow-hidden min-h-0">
                    <PipelineBoard
                        contacts={contacts}
                        onStatusChange={handleStatusChange}
                        onContactClick={handleEdit}
                        onEdit={handleEdit}
                        onDelete={(c) => setDeleteConfirm(c)}
                    />
                </div>
            ) : (
                <div data-tour="contacts-table" className="card bg-base-100 shadow-xl border border-base-300 flex-1 overflow-hidden">
                    <div className="card-body p-0 overflow-auto">
                        {contacts.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                                <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-6">
                                    <User className="w-10 h-10 opacity-20" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Aucun contact trouvé</h3>
                                <p className="text-muted-foreground max-w-xs mb-6">Gérez vos clients, prospects et partenaires plus efficacement.</p>
                                <button className="btn btn-primary btn-sm" onClick={handleNew}>Créer votre premier contact</button>
                            </div>
                        ) : (
                            <table className="table table-zebra table-pin-rows">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th className="w-12">
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-sm border-base-300 bg-base-200 checked:border-primary checked:bg-primary checked:text-primary-content"
                                                checked={contacts.length > 0 && selectedIds.length === contacts.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th>Contact</th>
                                        <th>Statut</th>
                                        <th>Workspaces</th>
                                        <th>Coordonnées</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contacts.map(contact => (
                                        <tr
                                            key={contact.id}
                                            className={`hover cursor-pointer group ${selectedIds.includes(contact.id) ? 'active' : ''}`}
                                            onClick={() => handleEdit(contact)}
                                        >
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-sm border-base-300 bg-base-200 checked:border-primary checked:bg-primary checked:text-primary-content"
                                                    checked={selectedIds.includes(contact.id)}
                                                    onChange={() => toggleSelection(contact.id)}
                                                />
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar placeholder">
                                                        <div className="bg-primary/10 text-primary rounded-2xl w-10 h-10">
                                                            {contact.type === 'company' ? (
                                                                <Building2 className="w-5 h-5" />
                                                            ) : (
                                                                <span className="text-sm font-bold">{contact.name?.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">{contact.name}</div>
                                                        <div className="text-[10px] uppercase opacity-50 font-black tracking-widest">{contact.company}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {getStatusBadge(contact.status)}
                                            </td>
                                            <td>
                                                <div className="flex flex-wrap gap-1">
                                                    {contact.contact_contexts?.map(cc => cc.context && (
                                                        <span
                                                            key={cc.context.id}
                                                            className="badge badge-outline border-none text-[10px] h-5 font-bold"
                                                            style={{
                                                                backgroundColor: `${cc.context.color}20`,
                                                                color: cc.context.color
                                                            }}
                                                        >
                                                            {cc.context.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-0.5 text-xs opacity-70">
                                                    {contact.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {contact.email}</div>}
                                                    {contact.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {contact.phone}</div>}
                                                </div>
                                            </td>
                                            <td className="text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1">
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {contact.email && (
                                                            <button
                                                                className="btn btn-primary btn-ghost btn-xs btn-square"
                                                                onClick={(e) => handleEmail(contact, e)}
                                                                title="Envoyer un email"
                                                            >
                                                                <Mail className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        {contact.phone && (
                                                            <button
                                                                className="btn btn-success btn-ghost btn-xs btn-square"
                                                                onClick={(e) => handleWhatsApp(contact, e)}
                                                                title="WhatsApp"
                                                            >
                                                                <MessageCircle className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn btn-ghost btn-xs btn-square"
                                                            onClick={() => handleEdit(contact)}
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            className="btn btn-error btn-ghost btn-xs btn-square"
                                                            onClick={() => setDeleteConfirm(contact)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <div className="dropdown dropdown-end md:hidden">
                                                        <label tabIndex={0} className="btn btn-ghost btn-xs btn-square">
                                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                                        </label>
                                                        <ul tabIndex={0} className="dropdown-content z-[20] menu p-2 shadow bg-base-100 rounded-box w-32 border border-base-300">
                                                            <li><a onClick={() => handleEdit(contact)}><Edit2 className="w-4 h-4" /> Éditer</a></li>
                                                            <li><a onClick={() => setDeleteConfirm(contact)} className="text-error"><Trash2 className="w-4 h-4" /> Supprimer</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Contact Modal */}
            <ContactModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                contact={selectedContact}
            />

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-sm">
                        <h3 className="font-bold text-lg text-error">Supprimer "{deleteConfirm?.name}" ?</h3>
                        <p className="py-4 text-sm opacity-70">
                            Cette action est irréversible. Toutes les données associées à ce contact seront supprimées.
                        </p>
                        <div className="modal-action">
                            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>Annuler</button>
                            <button className="btn btn-error btn-sm" onClick={handleDelete}>Supprimer définitivement</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Modal for List View */}
            <ComposeEmailModal
                open={isEmailModalOpen}
                onOpenChange={setIsEmailModalOpen}
                contact={emailContact}
                onSuccess={() => {
                    setEmailContact(null)
                }}
            />

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <ContactsBulkActionsBar
                    selectedIds={selectedIds}
                    onClear={() => setSelectedIds([])}
                    onSuccess={() => setSelectedIds([])}
                />
            )}
        </div>
    )
}
