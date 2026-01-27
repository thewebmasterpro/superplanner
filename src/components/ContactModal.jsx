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
import { Loader2, X } from 'lucide-react'
import { useContacts } from '../hooks/useContacts'
import { useContextStore } from '../stores/contextStore'

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

                <form onSubmit={handleSubmit} className="space-y-4">
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
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input
                                id="company"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                placeholder="Acme Inc."
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
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+33 6 12 34 56 78"
                            />
                        </div>
                    </div>

                    {/* Type & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                <SelectTrigger>
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
                                <SelectTrigger>
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
                        <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                            {contexts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No contexts available</p>
                            ) : (
                                contexts.map(ctx => (
                                    <Badge
                                        key={ctx.id}
                                        variant={formData.contextIds.includes(ctx.id) ? "default" : "outline"}
                                        className="cursor-pointer transition-colors"
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
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !formData.name.trim()}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isEditing ? 'Save Changes' : 'Create Contact'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// Export status options for use elsewhere
export { STATUS_OPTIONS }
