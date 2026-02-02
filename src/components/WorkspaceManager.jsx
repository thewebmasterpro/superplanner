import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Building, MoreVertical, Archive, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import { useWorkspaceStore } from '../stores/workspaceStore'
import { workspacesService } from '../services/workspaces.service'
import { tasksService } from '../services/tasks.service'
import { campaignsService } from '../services/campaigns.service'
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

export function WorkspaceManager() {
    const { workspaces, loadWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaceStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingWorkspace, setEditingWorkspace] = useState(null)
    const [workspaceStats, setWorkspaceStats] = useState({})
    const [loading, setLoading] = useState(false)
    const [showArchived, setShowArchived] = useState(false)
    const [allWorkspaces, setAllWorkspaces] = useState([])

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#6366f1',
        icon: 'briefcase'
    })

    useEffect(() => {
        loadWorkspaces()
        loadAllWorkspacesWithStats()
    }, [])

    const loadAllWorkspacesWithStats = async () => {
        try {
            // Fetch all workspaces including archived
            // Use service
            const ctxs = await workspacesService.getAll()

            setAllWorkspaces(ctxs || [])

            // Fetch stats for each workspace
            const stats = {}
            await Promise.all(ctxs.map(async (ctx) => {
                try {
                    // Fetch all items to count them. 
                    // TODO: Optimization - Add getCount method to services to avoid fetching full lists
                    const tasks = await tasksService.getAll({
                        filter: `context_id = "${ctx.id}"`
                    })
                    const campaigns = await campaignsService.getAll({
                        filter: `context_id = "${ctx.id}"`
                    })

                    stats[ctx.id] = {
                        tasks: tasks.length,
                        campaigns: campaigns.length
                    }
                } catch (e) {
                    stats[ctx.id] = { tasks: 0, campaigns: 0 }
                }
            }))

            setWorkspaceStats(stats)
        } catch (error) {
            console.error('Error loading workspaces with stats:', error)
        }
    }

    const handleOpenCreate = () => {
        setEditingWorkspace(null)
        setFormData({ name: '', description: '', color: '#6366f1', icon: 'briefcase' })
        setIsModalOpen(true)
    }

    const handleOpenEdit = (ctx) => {
        setEditingWorkspace(ctx)
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
            toast.error('Workspace name is required')
            return
        }

        setLoading(true)
        try {
            if (editingWorkspace) {
                await updateWorkspace(editingWorkspace.id, formData)
                toast.success('Workspace updated!')
            } else {
                await createWorkspace(formData)
                toast.success('Workspace created!')
            }
            setIsModalOpen(false)
            loadAllWorkspacesWithStats()
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (ctx) => {
        const stats = workspaceStats[ctx.id] || { tasks: 0, campaigns: 0 }
        const totalItems = stats.tasks + stats.campaigns

        let message = `Delete "${ctx.name}"?`
        if (totalItems > 0) {
            message += `\n\n⚠️ Ce workspace contient ${stats.tasks} tâches et ${stats.campaigns} projets liés. Ils deviendront orphelins (sans workspace).`
        }

        if (!window.confirm(message)) return

        try {
            await deleteWorkspace(ctx.id, 'hard')
            toast.success('Workspace deleted')
            loadAllWorkspacesWithStats()
        } catch (error) {
            toast.error('Failed to delete workspace')
        }
    }

    const handleArchive = async (ctx) => {
        try {
            const newStatus = ctx.status === 'archived' ? 'active' : 'archived'
            await updateWorkspace(ctx.id, { status: newStatus })
            toast.success(ctx.status === 'archived' ? 'Workspace restored!' : 'Workspace archived!')
            loadAllWorkspacesWithStats()
            loadWorkspaces() // Refresh store
        } catch (error) {
            toast.error('Failed to update workspace')
        }
    }

    const displayedWorkspaces = showArchived
        ? allWorkspaces
        : allWorkspaces.filter(c => c.status !== 'archived')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {allWorkspaces.filter(c => c.status === 'active').length} workspaces actifs
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowArchived(!showArchived)}>
                        {showArchived ? 'Masquer archivés' : 'Voir archivés'}
                    </Button>
                    <Button size="sm" onClick={handleOpenCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau
                    </Button>
                </div>
            </div>

            {/* Workspace List */}
            {displayedWorkspaces.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Building className="w-12 h-12 text-muted-foreground mb-4" />
                        <h4 className="font-medium mb-2">No workspaces yet</h4>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                            Create workspaces to organize your work by company or project scope.
                        </p>
                        <Button onClick={handleOpenCreate}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Workspace
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {displayedWorkspaces.map(ctx => {
                        const stats = workspaceStats[ctx.id] || { tasks: 0, campaigns: 0 }
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
                                                    <span><strong>{stats.campaigns}</strong> projets</span>
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
                        <DialogTitle>{editingWorkspace ? 'Edit Workspace' : 'Create New Workspace'}</DialogTitle>
                        <DialogDescription>
                            Workspaces represent contexts like companies or major project scopes.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Workspace Name *</Label>
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
                                {editingWorkspace ? 'Save Changes' : 'Create Workspace'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
