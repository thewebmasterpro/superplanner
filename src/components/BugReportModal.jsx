import { useState } from 'react'
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
import { Loader2, Bug } from 'lucide-react'
import { useUIStore } from '../stores/uiStore'
import { useCreateTask } from '../hooks/useTasks'
import { useWorkspaceStore } from '../stores/workspaceStore'
import toast from 'react-hot-toast'

export function BugReportModal() {
    const { isBugModalOpen, setBugModalOpen } = useUIStore()
    const createTask = useCreateTask()
    const { activeWorkspaceId } = useWorkspaceStore()

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        severity: 'medium',
    })

    // Reset form when modal opens/closes
    const handleOpenChange = (open) => {
        if (!open) {
            setFormData({ title: '', description: '', severity: 'medium' })
        }
        setBugModalOpen(open)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.title.trim()) return

        setLoading(true)
        try {
            // Create a task that represents this bug
            // We'll tag it as #BUG and prefix title for clarity
            const bugTitle = `[BUG] ${formData.title}`
            const bugDescription = `**Severity:** ${formData.severity.toUpperCase()}\n\n${formData.description}\n\n*Reported via Internal Bug Form*`

            // Ensure we have a valid workspace context. If 'all' or null, try to find one or fail gracefully?
            // Service might handle context_id optionality, but good to be explicit.
            // If activeWorkspaceId is 'trash' or 'archive', we shouldn't create there.
            // We'll let the user know if they need to switch context, or just default to null/empty string if allowed.

            await createTask.mutateAsync({
                title: bugTitle,
                description: bugDescription,
                status: 'todo',
                priority: formData.severity === 'critical' ? 'high' : (formData.severity === 'high' ? 'high' : 'medium'),
                type: 'task',
                tags: [], // We ideally want a tag ID for 'BUG', but simply putting it in title is safer for now without looking up tags.
                context_id: (activeWorkspaceId && activeWorkspaceId !== 'all' && activeWorkspaceId !== 'trash') ? activeWorkspaceId : undefined
            })

            toast.success("Bug reported successfully! Added to your tasks.")
            handleOpenChange(false)
        } catch (error) {
            console.error('Failed to submit bug report:', error)
            toast.error("Failed to submit bug report. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isBugModalOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Bug className="w-5 h-5" />
                        Report a Bug
                    </DialogTitle>
                    <DialogDescription>
                        Found an issue? Describe it below and we'll save it as a task for you to track.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Summary</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Cannot save settings on mobile"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="severity">Severity</Label>
                        <Select
                            value={formData.severity}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, severity: val }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low - Minor annoyance</SelectItem>
                                <SelectItem value="medium">Medium - Standard issue</SelectItem>
                                <SelectItem value="high">High - Feature broken</SelectItem>
                                <SelectItem value="critical">Critical - App unusable</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Details</Label>
                        <Textarea
                            id="description"
                            placeholder="Steps to reproduce, expected behavior, etc."
                            className="min-h-[120px]"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="destructive" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Report
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
