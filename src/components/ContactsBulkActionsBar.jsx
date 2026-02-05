import { useState } from 'react'
import { Trash2, FolderOpen, Check, X, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { contactsService } from '../services/contacts.service'
import { STATUS_OPTIONS } from './ContactModal'

export function ContactsBulkActionsBar({ selectedIds, onClear, onSuccess }) {
    const queryClient = useQueryClient()
    const { workspaces } = useWorkspaceStore()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [loading, setLoading] = useState(false)

    const count = selectedIds.length

    const updateContacts = async (updates) => {
        setLoading(true)
        try {
            await contactsService.bulkUpdate(selectedIds, updates)
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            queryClient.invalidateQueries({ queryKey: ['contactsList'] })
            toast.success('Contacts updated successfully')
            onClear()
            onSuccess?.()
        } catch (error) {
            console.error('Update failed:', error)
            toast.error('Operation failed')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        setLoading(true)
        try {
            await contactsService.bulkDelete(selectedIds)
            toast.success(`${count} contact(s) deleted`)
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            queryClient.invalidateQueries({ queryKey: ['contactsList'] })
            onClear()
            onSuccess?.()
        } catch (error) {
            toast.error('Failed to delete contacts')
        } finally {
            setLoading(false)
            setShowDeleteConfirm(false)
        }
    }

    const handleStatusChange = (status) => {
        updateContacts({ status })
    }

    // For now, simple workspace override (or maybe add logic to append? simpler to just set contexts)
    // The service generic bulkUpdate calls update(id, updates). 
    // If we pass contextIds, it handles it!
    const handleWorkspaceChange = (workspaceId) => {
        // We probably want to ADD to workspaces or REPLACE?
        // Service's update method with contextIds REPLACES the list.
        // For bulk action "Move to Workspace" usually implies standardizing.
        // Let's implement as "Set Workspace" for now.
        updateContacts({ contextIds: workspaceId === 'none' ? [] : [workspaceId] })
    }

    return (
        <>
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4 flex-wrap max-w-[95vw]">
                <Badge variant="secondary" className="text-sm shrink-0">
                    {count} selected
                </Badge>

                {/* Status */}
                <Select onValueChange={handleStatusChange} disabled={loading}>
                    <SelectTrigger className="w-[140px] h-9">
                        <Check className="w-4 h-4 mr-1" />
                        <SelectValue placeholder="Set Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Workspace */}
                <Select onValueChange={handleWorkspaceChange} disabled={loading}>
                    <SelectTrigger className="w-[140px] h-9">
                        <FolderOpen className="w-4 h-4 mr-1" />
                        <SelectValue placeholder="Set Workspace" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Clear Workspaces</SelectItem>
                        {workspaces.map(w => (
                            <SelectItem key={w.id} value={w.id}>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color }} />
                                    {w.name}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Delete */}
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                </Button>

                {/* Clear selection */}
                <Button variant="ghost" size="icon" onClick={onClear} className="h-8 w-8 shrink-0">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {count} contact(s)?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. All data associated with these contacts will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
