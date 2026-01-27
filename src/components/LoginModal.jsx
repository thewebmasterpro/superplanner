import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import LoginSupabase from './LoginSupabase'
import { useState } from 'react'

export function LoginModal({ open, onOpenChange, onLoginSuccess }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 bg-transparent border-none shadow-none">
                <div className="bg-card border rounded-lg shadow-lg overflow-hidden p-6">
                    {/* Pass minimal props to LoginSupabase to fit in modal */}
                    <LoginSupabase onLoginSuccess={onLoginSuccess} isModal={true} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
