import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useWorkspaceStore } from '../stores/workspaceStore'

export function CampaignModal({ open, onOpenChange, campaign = null, onSuccess }) {
    const isEditing = !!campaign
    const [loading, setLoading] = useState(false)
    const { workspaces, activeWorkspaceId, getActiveWorkspace, loadWorkspaces } = useWorkspaceStore()

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        context_id: '',
        priority: 3,
        status: 'draft'
    })

    useEffect(() => {
        if (open) {
            loadWorkspaces()
            if (campaign) {
                setFormData({
                    name: campaign.name || '',
                    description: campaign.description || '',
                    start_date: campaign.start_date || '',
                    end_date: campaign.end_date || '',
                    context_id: campaign.context_id || '',
                    priority: campaign.priority || 3,
                    status: campaign.status || 'draft'
                })
            } else {
                // For new campaigns: inherit activeWorkspaceId
                setFormData({
                    name: '',
                    description: '',
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: '',
                    context_id: activeWorkspaceId || '',  // Auto-inherit
                    priority: 3,
                    status: 'draft'
                })
            }
        }
    }, [open, campaign, activeWorkspaceId])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim() || !formData.start_date || !formData.end_date) {
            toast.error('Please fill in all required fields')
            return
        }

        if (formData.end_date < formData.start_date) {
            toast.error('End date must be after start date')
            return
        }

        // Validate context_id is required in Global view (when creating)
        if (!isEditing && !activeWorkspaceId && !formData.context_id) {
            toast.error('Please select a workspace before creating')
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const payload = {
                ...formData,
                context_id: formData.context_id || null, // Handle empty string
                user_id: user.id
            }

            let error
            if (isEditing) {
                ({ error } = await supabase
                    .from('campaigns')
                    .update(payload)
                    .eq('id', campaign.id))
            } else {
                ({ error } = await supabase
                    .from('campaigns')
                    .insert(payload))
            }

            if (error) throw error

            toast.success(isEditing ? 'Campaign updated' : 'Campaign created')
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error('Error saving campaign:', error)
            toast.error('Failed to save campaign')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Campaign' : 'New Campaign'}</DialogTitle>
                    <DialogDescription>
                        Create a campaign to organize your marketing efforts or projects.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Campaign Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Summer Sale, Website Redesign"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date *</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_date">End Date *</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Goals, target audience, notes..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="workspace" className="flex items-center gap-2">
                                Workspace
                                {!activeWorkspaceId && !isEditing && (
                                    <span className="text-xs text-amber-500 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Required
                                    </span>
                                )}
                            </Label>
                            {activeWorkspaceId && !isEditing ? (
                                <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: getActiveWorkspace()?.color || '#6366f1' }}
                                    />
                                    <span className="text-sm">{getActiveWorkspace()?.name || 'Unknown'}</span>
                                    <Badge variant="outline" className="ml-auto text-xs">Auto</Badge>
                                </div>
                            ) : (
                                <Select
                                    value={formData.context_id || "none"}
                                    onValueChange={(val) => setFormData({ ...formData, context_id: val === "none" ? "" : val })}
                                >
                                    <SelectTrigger className={!activeWorkspaceId && !formData.context_id && !isEditing ? 'border-amber-500' : ''}>
                                        <SelectValue placeholder="Select workspace" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isEditing && <SelectItem value="none">None</SelectItem>}
                                        {workspaces.map(w => (
                                            <SelectItem key={w.id} value={w.id}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color || '#6366f1' }} />
                                                    {w.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={String(formData.priority)}
                                onValueChange={(val) => setFormData({ ...formData, priority: parseInt(val) })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Low</SelectItem>
                                    <SelectItem value="2">Normal</SelectItem>
                                    <SelectItem value="3">Medium</SelectItem>
                                    <SelectItem value="4">High</SelectItem>
                                    <SelectItem value="5">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(val) => setFormData({ ...formData, status: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isEditing ? 'Save Changes' : 'Create Campaign'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
