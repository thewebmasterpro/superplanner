import { useState, useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, X, Calendar, CheckSquare, MessageSquare, Clock } from 'lucide-react'
import { useContacts } from '../hooks/useContacts'
import { useContextStore } from '../stores/contextStore'
import { supabase } from '../lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const STATUS_OPTIONS = [
    { value: 'prospect_new', label: '🆕 New Prospect', color: 'bg-blue-100 text-blue-700' },
    { value: 'prospect_interested', label: '🔥 Interested', color: 'bg-orange-100 text-orange-700' },
    { value: 'proposal_sent', label: '📤 Proposal Sent', color: 'bg-purple-100 text-purple-700' },
    { value: 'negotiating', label: '🤝 Negotiating', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'client', label: '✅ Client', color: 'bg-green-100 text-green-700' },
    { value: 'inactive', label: '💤 Inactive', color: 'bg-gray-100 text-gray-700' },
    { value: 'lost', label: '❌ Lost', color: 'bg-red-100 text-red-700' },
]

export function ContactModal({ open, onOpenChange, contact }) {
    const { createContact, updateContact, isCreating, isUpdating } = useContacts()
    const { contexts } = useContextStore()
    const isEditing = !!contact?.id

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'prospect_new',
        type: 'individual',
        notes: '',
        contextIds: []
    })

    const [activities, setActivities] = useState([])
    const [loadingActivities, setLoadingActivities] = useState(false)

    useEffect(() => {
        if (contact?.id) {
            loadActivities()
        }
    }, [contact, open])

    const loadActivities = async () => {
        setLoadingActivities(true)
        try {
            const { data: tasks, error: tError } = await supabase
                .from('tasks')
                .select('*')
                .eq('contact_id', contact.id)
                .order('created_at', { ascending: false })
                .limit(10)

            if (tError) throw tError
            setActivities(tasks || [])
        } catch (error) {
            console.error('Error loading activities:', error)
        } finally {
            setLoadingActivities(false)
        }
    }

    useEffect(() => {
        if (contact) {
            setFormData({
                name: contact.name || '',
                email: contact.email || '',
                phone: contact.phone || '',
                company: contact.company || '',
                status: contact.status || 'prospect_new',
                type: contact.type || 'individual',
                notes: contact.notes || '',
                contextIds: contact.contact_contexts?.map(cc => cc.context?.id).filter(Boolean) || []
            })
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                company: '',
                status: 'prospect_new',
                type: 'individual',
                notes: '',
                contextIds: []
            })
        }
    }, [contact, open])

    const handleSubmit = (e) => {
        e.preventDefault()

        if (isEditing) {
            updateContact({ id: contact.id, ...formData }, {
                onSuccess: () => onOpenChange(false)
            })
        } else {
            createContact(formData, {
                onSuccess: () => onOpenChange(false)
            })
        }
    }

    const toggleContext = (contextId) => {
        setFormData(prev => ({
            ...prev,
            contextIds: prev.contextIds.includes(contextId)
                ? prev.contextIds.filter(id => id !== contextId)
                : [...prev.contextIds, contextId]
        }))
    }

    const loading = isCreating || isUpdating

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Contact' : 'New Contact'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Update contact details' : 'Add a new client or prospect'}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details">
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            {/* Name & Company */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="John Doe"
                                        required
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company">Company</Label>
                                    <Input
                                        id="company"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        placeholder="Acme Inc."
                                        className="bg-background/50"
                                    />
                                </div>
                            </div>

                            {/* Email & Phone */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@example.com"
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+33 6 12 34 56 78"
                                        className="bg-background/50"
                                    />
                                </div>
                            </div>

                            {/* Type & Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                        <SelectTrigger className="bg-background/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="individual">👤 Individual</SelectItem>
                                            <SelectItem value="company">🏢 Company</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                        <SelectTrigger className="bg-background/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUS_OPTIONS.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Contexts (multi-select) */}
                            <div className="space-y-2">
                                <Label>Contexts</Label>
                                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/20">
                                    {contexts.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No contexts available</p>
                                    ) : (
                                        contexts.map(ctx => (
                                            <Badge
                                                key={ctx.id}
                                                variant={formData.contextIds.includes(ctx.id) ? "default" : "outline"}
                                                className="cursor-pointer transition-all hover:scale-105"
                                                style={formData.contextIds.includes(ctx.id) ? { backgroundColor: ctx.color } : {}}
                                                onClick={() => toggleContext(ctx.id)}
                                            >
                                                {formData.contextIds.includes(ctx.id) && '✓ '}
                                                {ctx.name}
                                            </Badge>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Additional notes about this contact..."
                                    rows={3}
                                    className="bg-background/50"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading || !formData.name.trim()} className="shadow-lg shadow-primary/10">
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {isEditing ? 'Save Changes' : 'Create Contact'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="timeline">
                        <div className="h-[400px] w-full pr-4 pt-4 overflow-y-auto">
                            {loadingActivities ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground">
                                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>No recorded activities yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-6 relative before:absolute before:inset-0 before:left-2.5 before:w-px before:bg-border/50">
                                    {activities.map((activity, idx) => (
                                        <div key={activity.id} className="relative pl-8 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            </div>
                                            <div className="bg-muted/30 p-3 rounded-lg border border-border/40 hover:border-primary/30 transition-colors">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                                        {activity.type === 'meeting' ? 'Meeting' : 'Task'}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(activity.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <h5 className="text-sm font-medium">{activity.title}</h5>
                                                {activity.status === 'done' && (
                                                    <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-600 border-none h-5 px-1.5 text-[10px]">
                                                        Completed
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

// Export status options for use elsewhere
export { STATUS_OPTIONS }
