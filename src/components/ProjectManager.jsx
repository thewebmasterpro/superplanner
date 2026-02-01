import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Trash2, FolderKanban, AlertCircle } from 'lucide-react'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { toast } from 'sonner'

export function ProjectManager() {
    const { workspaces, loadWorkspaces } = useWorkspaceStore()
    const [projects, setProjects] = useState([])
    const [newProject, setNewProject] = useState({ name: '', description: '', context_id: '' })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            await loadWorkspaces()
            const { data, error } = await supabase
                .from('projects')
                .select(`
          *,
          contexts (
            name,
            color
          )
        `)
                .order('name')

            if (error) throw error
            setProjects(data || [])
        } catch (error) {
            console.error('Error loading projects:', error)
        }
    }

    const handleAddProject = async (e) => {
        e.preventDefault()
        if (!newProject.name.trim()) {
            toast.error('Project name is required')
            return
        }
        if (!newProject.context_id) {
            toast.error('Workspace is mandatory for all projects')
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const { error } = await supabase
                .from('projects')
                .insert({
                    name: newProject.name,
                    description: newProject.description || null,
                    context_id: newProject.context_id,
                    user_id: user.id
                })

            if (error) throw error

            toast.success('Project added successfully!')
            setNewProject({ name: '', description: '', context_id: '' })
            loadData()
        } catch (error) {
            toast.error(`Failed to add project: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteProject = async (id) => {
        if (!window.confirm('Delete this project? Tasks using it will remain unaffected.')) return

        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id)

            if (error) throw error

            toast.success('Project deleted successfully!')
            loadData()
        } catch (error) {
            toast.error(`Failed to delete project: ${error.message}`)
        }
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FolderKanban className="w-5 h-5 text-primary" />
                        Add New Project
                    </CardTitle>
                    <CardDescription>Create a new project. Each project must be linked to a workspace.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddProject} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="projectName">Project Name *</Label>
                                <Input
                                    id="projectName"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    placeholder="e.g., Website Redesign, Product Launch"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="projectWorkspace">Workspace *</Label>
                                <Select
                                    value={newProject.context_id}
                                    onValueChange={(value) => setNewProject({ ...newProject, context_id: value })}
                                >
                                    <SelectTrigger id="projectWorkspace">
                                        <SelectValue placeholder="Select a workspace" />
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
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="projectDesc">Description (Optional)</Label>
                            <Input
                                id="projectDesc"
                                value={newProject.description}
                                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                placeholder="Brief description of the project"
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Project
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your Projects</CardTitle>
                    <CardDescription>{projects.length} projects configured</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {projects.length === 0 ? (
                            <p className="text-sm text-muted-foreground col-span-full py-8 text-center border-dashed border rounded-lg">
                                No projects yet. Create one above!
                            </p>
                        ) : (
                            projects.map((proj) => (
                                <div key={proj.id} className="flex flex-col p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-lg">{proj.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteProject(proj.id)}
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {proj.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">{proj.description}</p>
                                    )}
                                    <div className="flex items-center mt-auto">
                                        {proj.contexts ? (
                                            <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded-full text-xs font-medium">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: proj.contexts.color }}
                                                />
                                                {proj.contexts.name}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-xs text-destructive font-medium">
                                                <AlertCircle className="w-3 h-3" />
                                                No workspace (Migration required)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
