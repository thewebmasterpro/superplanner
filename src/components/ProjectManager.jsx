import { useState, useEffect } from 'react'
import { projectsService } from '../services/projects.service'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, AlertCircle, Edit2 } from 'lucide-react'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useContacts } from '../hooks/useContacts'
import toast from 'react-hot-toast'

export function ProjectManager() {
    const { workspaces, loadWorkspaces } = useWorkspaceStore()
    const { contacts } = useContacts()
    const [projects, setProjects] = useState([])
    const [formData, setFormData] = useState({ name: '', description: '', context_id: '', contact_id: '' })
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            await loadWorkspaces()
            // Fetch with status='all' to avoid filtering by 'status' field if it doesn't exist (causing 400 -> fallback -> no expand)
            const records = await projectsService.getAll({ status: 'all' })
            setProjects(records)
        } catch (error) {
            console.error('Error loading projects:', error)
            toast.error('Échec du chargement des départements')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            toast.error('Le nom du département est requis')
            return
        }
        if (!formData.context_id) {
            toast.error('Le workspace est obligatoire pour chaque département')
            return
        }

        setLoading(true)
        try {
            const payload = {
                name: formData.name,
                description: formData.description || null,
                context_id: formData.context_id,
                contact_id: formData.contact_id || null
            }

            if (editingId) {
                await projectsService.update(editingId, payload)
                toast.success('Département mis à jour !')
            } else {
                await projectsService.create(payload)
                toast.success('Département ajouté !')
            }

            resetForm()
            loadData()
        } catch (error) {
            toast.error(`Échec de ${editingId ? 'la mise à jour' : "l'ajout"} du département : ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (project) => {
        setEditingId(project.id)
        setFormData({
            name: project.name,
            description: project.description || '',
            context_id: project.context_id || '', // Use raw ID
            contact_id: project.contact_id || ''  // Use raw ID
        })
        // Scroll to form (optional but nice)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDeleteProject = async (id) => {
        if (!window.confirm('Supprimer ce département ? Les tâches associées ne seront pas affectées.')) return

        try {
            await projectsService.delete(id)

            toast.success('Département supprimé !')
            loadData()
            if (editingId === id) resetForm()
        } catch (error) {
            toast.error(`Échec de la suppression du département : ${error.message}`)
        }
    }

    const resetForm = () => {
        setEditingId(null)
        setFormData({ name: '', description: '', context_id: '', contact_id: '' })
    }

    return (
        <div className="space-y-4">
            <Card className={editingId ? "border-primary border-2" : ""}>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="projectName">Nom du Département *</Label>
                                <Input
                                    id="projectName"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ex: Marketing, Développement"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="projectWorkspace">Workspace *</Label>
                                <Select
                                    value={formData.context_id}
                                    onValueChange={(value) => setFormData({ ...formData, context_id: value })}
                                >
                                    <SelectTrigger id="projectWorkspace">
                                        <SelectValue placeholder="Sélectionner un workspace" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {workspaces.map((w) => (
                                            <SelectItem key={w.id} value={w.id}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: w.color }}
                                                    />
                                                    {w.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="projectClient">Client (Optionnel)</Label>
                                <Select
                                    value={formData.contact_id === "" || !formData.contact_id ? "none" : formData.contact_id}
                                    onValueChange={(value) => setFormData({ ...formData, contact_id: value === "none" ? "" : value })}
                                >
                                    <SelectTrigger id="projectClient">
                                        <SelectValue placeholder="Sélectionner un client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Aucun</SelectItem>
                                        {contacts.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name} {c.company ? `(${c.company})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="projectDesc">Description (Optionnel)</Label>
                            <Input
                                id="projectDesc"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brève description du département"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={loading}>
                                <Plus className="w-4 h-4 mr-2" />
                                {editingId ? 'Modifier' : 'Ajouter'}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="ghost" onClick={resetForm}>
                                    Annuler
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {projects.length === 0 ? (
                            <p className="text-sm text-muted-foreground col-span-full py-8 text-center border-dashed border rounded-lg">
                                Aucun département. Créez-en un ci-dessus !
                            </p>
                        ) : (
                            projects.map((proj) => {
                                const workspace = workspaces.find(w => w.id === proj.context_id)
                                const client = contacts.find(c => c.id === proj.contact_id)
                                return (
                                    <div key={proj.id}
                                        className={`flex flex-col p-4 border rounded-lg transition-colors gap-2 ${editingId === proj.id ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-lg">{proj.name}</span>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(proj)}
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                                                    title="Modifier le département"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteProject(proj.id)}
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                    title="Supprimer le département"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        {proj.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">{proj.description}</p>
                                        )}
                                        <div className="flex items-center mt-auto flex-wrap gap-2">
                                            {workspace ? (
                                                <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded-full text-xs font-medium">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: workspace.color }}
                                                    />
                                                    {workspace.name}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-xs text-destructive font-medium">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Aucun workspace
                                                </div>
                                            )}
                                            {client && (
                                                <div className="flex items-center gap-2 px-2 py-1 border rounded-full text-xs text-muted-foreground">
                                                    {client.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
