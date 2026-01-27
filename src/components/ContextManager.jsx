import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Building, MoreVertical, Archive, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useContextStore } from '../stores/contextStore'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const PRESET_COLORS = [
    '#22c55e', // Green
    '#6366f1', // Indigo
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#14b8a6', // Teal
]

export function ContextManager() {
    const { contexts, loadContexts, createContext, updateContext, deleteContext } = useContextStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingContext, setEditingContext] = useState(null)
    const [contextStats, setContextStats] = useState({})
    const [loading, setLoading] = useState(false)
    const [showArchived, setShowArchived] = useState(false)
    const [allContexts, setAllContexts] = useState([])

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#6366f1',
        icon: 'briefcase'
    })

    useEffect(() => {
        loadContexts()
        loadAllContextsWithStats()
    }, [])

    const loadAllContextsWithStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch all contexts including archived
            const { data: ctxs, error: ctxError } = await supabase
                .from('contexts')
                .select('*')
                .eq('user_id', user.id)
                .order('name')

            if (ctxError) throw ctxError
            setAllContexts(ctxs || [])

            // Fetch stats for each context
            const stats = {}
            for (const ctx of ctxs || []) {
                const [tasksRes, campaignsRes] = await Promise.all([
                    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('context_id', ctx.id),
                    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('context_id', ctx.id)
                ])
                stats[ctx.id] = {
                    tasks: tasksRes.count || 0,
                    campaigns: campaignsRes.count || 0
                }
            }
            setContextStats(stats)
        } catch (error) {
            console.error('Error loading contexts with stats:', error)
        }
    }

    const handleOpenCreate = () => {
        setEditingContext(null)
        setFormData({ name: '', description: '', color: '#6366f1', icon: 'briefcase' })
        setIsModalOpen(true)
    }

    const handleOpenEdit = (ctx) => {
        setEditingContext(ctx)
        setFormData({
            name: ctx.name || '',
            description: ctx.description || '',
            color: ctx.color || '#6366f1',
            icon: ctx.icon || 'briefcase'
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            toast.error('Context name is required')
            return
        }

        setLoading(true)
        try {
            if (editingContext) {
                await updateContext(editingContext.id, formData)
                toast.success('Context updated!')
            } else {
                await createContext(formData)
                toast.success('Context created!')
            }
            setIsModalOpen(false)
            loadAllContextsWithStats()
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (ctx) => {
        const stats = contextStats[ctx.id] || { tasks: 0, campaigns: 0 }
        const totalItems = stats.tasks + stats.campaigns

        let message = `Delete "${ctx.name}"?`
        if (totalItems > 0) {
            message += `\n\n⚠️ This context has ${stats.tasks} tasks and ${stats.campaigns} campaigns linked. They will become orphaned (no context).`
        }

        if (!window.confirm(message)) return

        try {
            await deleteContext(ctx.id, 'hard')
            toast.success('Context deleted')
            loadAllContextsWithStats()
        } catch (error) {
            toast.error('Failed to delete context')
        }
    }

    const handleArchive = async (ctx) => {
        try {
            const newStatus = ctx.status === 'archived' ? 'active' : 'archived'
            await updateContext(ctx.id, { status: newStatus })
            toast.success(ctx.status === 'archived' ? 'Context restored!' : 'Context archived!')
            loadAllContextsWithStats()
            loadContexts() // Refresh store
        } catch (error) {
            toast.error('Failed to update context')
        }
    }

    const displayedContexts = showArchived
        ? allContexts
        : allContexts.filter(c => c.status !== 'archived')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Your Contexts
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {allContexts.filter(c => c.status === 'active').length} active contexts
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowArchived(!showArchived)}>
                        {showArchived ? 'Hide Archived' : 'Show Archived'}
                    </Button>
                    <Button onClick={handleOpenCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Context
                    </Button>
                </div>
            </div>

            {/* Context List */}
            {displayedContexts.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Building className="w-12 h-12 text-muted-foreground mb-4" />
                        <h4 className="font-medium mb-2">No contexts yet</h4>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                            Create contexts to organize your work by company or project scope.
                        </p>
                        <Button onClick={handleOpenCreate}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Context
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {displayedContexts.map(ctx => {
                        const stats = contextStats[ctx.id] || { tasks: 0, campaigns: 0 }
                        const isArchived = ctx.status === 'archived'

                        return (
                            <Card key={ctx.id} className={`transition-all ${isArchived ? 'opacity-60' : ''}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: ctx.color + '20' }}
                                            >
                                                <div
                                                    className="w-5 h-5 rounded-full"
                                                    style={{ backgroundColor: ctx.color }}
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold">{ctx.name}</h4>
                                                    {isArchived && (
                                                        <Badge variant="secondary" className="text-xs">Archived</Badge>
                                                    )}
                                                </div>
                                                {ctx.description && (
                                                    <p className="text-sm text-muted-foreground mt-0.5">{ctx.description}</p>
                                                )}
                                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span><strong>{stats.tasks}</strong> tasks</span>
                                                    <span><strong>{stats.campaigns}</strong> campaigns</span>
                                                </div>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenEdit(ctx)}>
                                                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleArchive(ctx)}>
                                                    {isArchived ? (
                                                        <><RotateCcw className="w-4 h-4 mr-2" /> Restore</>
                                                    ) : (
                                                        <><Archive className="w-4 h-4 mr-2" /> Archive</>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(ctx)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingContext ? 'Edit Context' : 'Create New Context'}</DialogTitle>
                        <DialogDescription>
                            Contexts represent workspaces like companies or major project scopes.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Context Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Distriweb, Thewebmaster, Agence-smith"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of this workspace"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-2 flex-wrap">
                                    {PRESET_COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`w-8 h-8 rounded-full transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setFormData({ ...formData, color })}
                                        />
                                    ))}
                                </div>
                                <Input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="w-12 h-8 p-0 border-0"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {editingContext ? 'Save Changes' : 'Create Context'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
