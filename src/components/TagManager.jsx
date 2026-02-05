import { useState, useEffect } from 'react'
import pb from '../lib/pocketbase'
import { tagsService } from '../services/tags.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

export function TagManager() {
    const [tags, setTags] = useState([])
    const [newTag, setNewTag] = useState({ name: '', color: '#6366f1' })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadTags()
    }, [])

    const loadTags = async () => {
        try {
            const records = await tagsService.getAll()
            setTags(records || [])
        } catch (error) {
            console.error('Error loading tags:', error)
            toast.error('Failed to load tags')
        }
    }

    const handleCreateTag = async (e) => {
        e.preventDefault()
        if (!newTag.name.trim()) return

        setLoading(true)
        try {
            const user = pb.authStore.model

            await tagsService.create({
                name: newTag.name,
                color: newTag.color,
                user_id: user?.id
            })

            toast.success('Tag created!')
            setNewTag({ name: '', color: '#6366f1' })
            loadTags()
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteTag = async (id) => {
        if (!confirm('Delete this tag?')) return

        try {
            await tagsService.delete(id)
            toast.success('Tag deleted')
            loadTags()
        } catch (error) {
            toast.error('Failed to delete tag')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end gap-4 border p-4 rounded-lg bg-card">
                <div className="space-y-2 flex-1">
                    <Label>New Tag Name</Label>
                    <Input
                        value={newTag.name}
                        onChange={e => setNewTag({ ...newTag, name: e.target.value })}
                        placeholder="e.g. Urgent, Waiting"
                    />
                </div>
                <div className="space-y-2 w-24">
                    <Label>Color</Label>
                    <Input
                        type="color"
                        value={newTag.color}
                        onChange={e => setNewTag({ ...newTag, color: e.target.value })}
                        className="h-10 p-1"
                    />
                </div>
                <Button onClick={handleCreateTag} disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                </Button>
            </div>

            <div className="flex flex-wrap gap-2">
                {tags.length === 0 && <p className="text-muted-foreground text-sm">No tags created yet.</p>}

                {tags.map(tag => (
                    <Badge
                        key={tag.id}
                        variant="secondary"
                        className="pl-2 pr-1 py-1 flex items-center gap-2 text-sm"
                        style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: `${tag.color}40` }}
                    >
                        <Tag className="w-3 h-3" />
                        {tag.name}
                        <button
                            onClick={() => handleDeleteTag(tag.id)}
                            className="ml-1 hover:text-destructive transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    )
}
