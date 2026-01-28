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
import { Loader2, Send, Paperclip } from 'lucide-react'
import { useContacts } from '../hooks/useContacts'
import toast from 'react-hot-toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

export function ComposeEmailModal({ open, onOpenChange, contact, recipientEmail, onSuccess }) {
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [sending, setSending] = useState(false)
    const { sendEmail } = useContacts()

    const handleSend = async () => {
        if (!subject || !body || !contact) return

        setSending(true)
        try {
            await sendEmail({
                to: recipientEmail || contact.email,
                subject,
                html: body,
                contactId: contact.id
            }, {
                onSuccess: () => {
                    toast.success('Email sent successfully')
                    onOpenChange(false)
                    setSubject('')
                    setBody('')
                    onSuccess?.()
                },
                onError: (err) => {
                    toast.error('Failed to send email: ' + err.message)
                }
            })
        } catch (error) {
            console.error('Send error:', error)
            toast.error('Failed to send email')
        } finally {
            setSending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>New Email</DialogTitle>
                    <DialogDescription>
                        To: {contact?.name} &lt;{recipientEmail || contact?.email}&gt;
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Input
                            placeholder="Subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="font-medium text-lg border-0 border-b rounded-none px-0 focus-visible:ring-0 shadow-none"
                            autoFocus
                        />
                    </div>
                    <div className="min-h-[250px] relative">
                        <ReactQuill
                            theme="snow"
                            value={body}
                            onChange={setBody}
                            className="h-[200px]"
                            placeholder="Write your message..."
                        />
                    </div>
                </div>

                <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <Paperclip className="w-4 h-4" />
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Discard
                        </Button>
                        <Button onClick={handleSend} disabled={sending || !subject || !body}>
                            {sending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Email
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
