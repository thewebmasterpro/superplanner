import React from 'react'
import { Progress } from '@/components/ui/progress'

export function CampaignProgressBar({ total, completed, color, label }) {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">{label}</span>
                <span style={{ color }}>{percentage}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/30 border border-border/10">
                <div
                    className="h-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: color || 'var(--primary)'
                    }}
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 shimmer opacity-30" />
                </div>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground/60">
                <span>{completed} items</span>
                <span>{total} total</span>
            </div>
        </div>
    )
}
