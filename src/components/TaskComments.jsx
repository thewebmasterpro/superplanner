import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Send, Trash2, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

export function TaskComments({ taskId }) {
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState(null)

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id)
        })
        loadComments()

        // Subscribe to realtime changes
        const channel = supabase
            .channel('public:task_comments')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'task_comments',
                filter: `task_id=eq.${taskId}`
            }, () => {
                loadComments()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [taskId])

    const loadComments = async () => {
        try {
            // Fetch comment + user details (if possible, otherwise just ID)
            // Since we don't have a reliable join on auth.users for creating profiles yet,
            // we'll try to join team_members to get some info if available, or just show email if we can.
            // Actually, standard way is just show what we have.
            const { data, error } = await supabase
                .from('task_comments')
                .select(`
            *,
            user:user_id(email) 
        `) // Trying to fetch email from auth.users via RLS view (if exists) or assuming user_id link
                // If this fails due to no relation, we'll fallback to simple select
                .eq('task_id', taskId)
                .order('created_at', { ascending: true })

            if (error) {
                // Fallback simple fetch
                const { data: simpleData } = await supabase
                    .from('task_comments')
                    .select('*')
                    .eq('task_id', taskId)
                    .order('created_at', { ascending: true })

                setComments(simpleData || [])
            } else {
                setComments(data || [])
            }
        } catch (error) {
            console.error('Error loading comments:', error)
        }
    }

    const handleAddComment = async (e) => {
        e.preventDefault()
        if (!newComment.trim()) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('task_comments')
                .insert({
                    task_id: taskId,
                    user_id: userId,
                    content: newComment.trim()
                })

            if (error) throw error

            setNewComment('')
            // loadComments will trigger via realtime or we can call it manually
            loadComments()
        } catch (error) {
            toast.error('Failed to post comment')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (commentId) => {
        if (!confirm('Delete this comment?')) return

        try {
            const { error } = await supabase
                .from('task_comments')
                .delete()
                .eq('id', commentId)

            if (error) throw error
            // Realtime will update list
        } catch (error) {
            toast.error('Could not delete comment')
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 p-1 min-h-[200px]">
                {comments.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <div className="bg-muted/30 p-4 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl">💬</span>
                        </div>
                        <p className="text-sm">No comments yet. Start the conversation!</p>
                    </div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className={`flex gap-3 ${comment.user_id === userId ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="h-8 w-8 mt-1">
                                <AvatarFallback className="text-xs">
                                    <User className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>

                            <div className={`flex flex-col max-w-[80%] ${comment.user_id === userId ? 'items-end' : 'items-start'}`}>
                                <div className={`rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${comment.user_id === userId
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-muted rounded-tl-none'
                                    }`}>
                                    {comment.content}
                                </div>
                                <div className="flex items-center gap-2 mt-1 px-1">
                                    <span className="text-[10px] text-muted-foreground">
                                        {comment.user_id === userId ? 'You' : (comment.user?.email || 'User')} • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                    {comment.user_id === userId && (
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="text-[10px] text-destructive hover:underline"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="pt-4 mt-auto border-t">
                <form onSubmit={handleAddComment} className="flex gap-2">
                    <Textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="min-h-[2.5rem] max-h-24 py-2 resize-none"
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleAddComment(e)
                            }
                        }}
                    />
                    <Button type="submit" size="icon" disabled={loading || !newComment.trim()}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}
