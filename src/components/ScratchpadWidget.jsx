import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Save, Loader2, StickyNote } from 'lucide-react'
import { settingsService } from '../services/settings.service'
import { useUserStore } from '../stores/userStore'
import { toast } from 'react-hot-toast'

export function ScratchpadWidget() {
    const { preferences, setPreferences } = useUserStore()
    const [content, setContent] = useState('')
    const [status, setStatus] = useState('saved') // 'saved', 'saving', 'unsaved'

    // Use a ref to track if it's the initial load to avoid overwriting with empty state
    const isInitialized = useRef(false)
    const timeoutRef = useRef(null)

    // Sync with store on mount
    useEffect(() => {
        if (preferences?.scratchpad_content !== undefined) {
            setContent(preferences.scratchpad_content || '')
            isInitialized.current = true
        }
    }, [preferences?.scratchpad_content])

    const handleChange = (e) => {
        const newValue = e.target.value
        setContent(newValue)
        setStatus('unsaved')

        // Debounce save
        if (timeoutRef.current) clearTimeout(timeoutRef.current)

        timeoutRef.current = setTimeout(async () => {
            setStatus('saving')
            try {
                // Optimistic update in store via service
                // Note: userStore typically updates itself after successful API call if we use the service directly,
                // but here we are using the store's update action if available, or service.
                // Assuming useUserStore exposes updatePreferences (it usually should).
                // If not, we use settingsService directly and invalidate queries or let stored update.

                await settingsService.updatePreferences({ scratchpad_content: newValue })

                // Also update local store if needed (depends on store implementation)
                setPreferences({ scratchpad_content: newValue })

                setStatus('saved')
            } catch (error) {
                console.error('Failed to save note', error)
                setStatus('error')
                toast.error('Failed to save note')
            }
        }, 1500) // 1.5s delay
    }

    return (
        <Card className="h-full flex flex-col bg-yellow-50/50 dark:bg-yellow-950/10 border-yellow-200 dark:border-yellow-800/50">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Scratchpad
                    </CardTitle>
                </div>
                <div className="text-xs text-muted-foreground">
                    {status === 'saving' && (
                        <span className="flex items-center gap-1 text-yellow-600">
                            <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                        </span>
                    )}
                    {status === 'saved' && <span className="text-green-600/70">Saved</span>}
                    {status === 'unsaved' && <span className="text-amber-500/70">Typing...</span>}
                    {status === 'error' && <span className="text-red-500">Error</span>}
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-[150px]">
                <Textarea
                    value={content}
                    onChange={handleChange}
                    placeholder="Quick notes, numbers, ideas..."
                    className="w-full h-full min-h-[150px] resize-none border-0 bg-transparent focus-visible:ring-0 px-4 py-2 text-base leading-relaxed placeholder:text-yellow-800/20 dark:placeholder:text-yellow-200/20"
                />
            </CardContent>
        </Card>
    )
}
