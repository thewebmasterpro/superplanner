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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function CampaignModal({ open, onOpenChange, campaign = null, onSuccess }) {
    const isEditing = !!campaign
    const [loading, setLoading] = useState(false)
    const [contexts, setContexts] = useState([])

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
            loadContexts()
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
                setFormData({
                    name: '',
                    description: '',
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: '',
                    context_id: '',
                    priority: 3,
                    status: 'draft'
                })
            }
        }
    }, [open, campaign])

    const loadContexts = async () => {
        try {
            const { data, error } = await supabase.from('contexts').select('*').order('name')
            if (error) throw error
            setContexts(data || [])
        } catch (error) {
            console.error('Error loading contexts:', error)
        }
    }

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
                            <Label htmlFor="context">Context</Label>
                            <Select
                                value={formData.context_id || "none"}
                                onValueChange={(val) => setFormData({ ...formData, context_id: val === "none" ? "" : val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select context" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {contexts.map(ctx => (
                                        <SelectItem key={ctx.id} value={ctx.id}>{ctx.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
