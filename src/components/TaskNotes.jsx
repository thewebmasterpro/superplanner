import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

export function TaskNotes({ taskId }) {
    const [notes, setNotes] = useState([])
    const [newNote, setNewNote] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (taskId) {
            loadNotes()
        }
    }, [taskId])

    const loadNotes = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('task_notes')
                .select('*')
                .eq('task_id', taskId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setNotes(data || [])
        } catch (error) {
            console.error('Error loading notes:', error)
            toast.error('Failed to load notes')
        } finally {
            setLoading(false)
        }
    }

    const handleAddNote = async (e) => {
        e.preventDefault()
        if (!newNote.trim()) return

        setSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase
                .from('task_notes')
                .insert({
                    task_id: taskId,
                    user_id: user.id,
                    content: newNote.trim()
                })

            if (error) throw error

            setNewNote('')
            loadNotes()
            toast.success('Note added')
        } catch (error) {
            console.error(error)
            toast.error('Failed to add note')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 min-h-[200px] max-h-[400px] pr-2">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No notes yet. Start the conversation!
                    </div>
                ) : (
                    notes.map(note => (
                        <div key={note.id} className="bg-muted/50 p-3 rounded-lg space-y-1">
                            <div className="flex justify-between items-start text-xs text-muted-foreground">
                                <span className="font-medium">User</span>
                                <span>{formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="flex gap-2 pt-2 border-t">
                <Textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Type a note..."
                    className="min-h-[80px]"
                />
                <Button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || submitting}
                    className="self-end"
                    size="icon"
                >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
            </div>
        </div>
    )
}
