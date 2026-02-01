import { useMemo, useState } from 'react'
import { format, differenceInDays, addDays, startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function CampaignGantt({ campaigns, onEdit }) {
    const [viewMode, setViewMode] = useState('month') // 'month' | 'quarter'
    const [currentDate, setCurrentDate] = useState(new Date())

    // Calculate timeline range
    const { startDate, endDate, days } = useMemo(() => {
        let start = startOfMonth(currentDate)
        let end = endOfMonth(currentDate)

        if (viewMode === 'quarter') {
            end = endOfMonth(addDays(start, 90))
        }

        // Add buffer
        start = startOfWeek(start)
        end = endOfWeek(end)

        const days = eachDayOfInterval({ start, end })
        return { startDate: start, endDate: end, days }
    }, [currentDate, viewMode])

    const navigate = (direction) => {
        if (viewMode === 'month') {
            setCurrentDate(prev => addDays(prev, direction * 30))
        } else {
            setCurrentDate(prev => addDays(prev, direction * 90))
        }
    }

    const getPosition = (date) => {
        const totalDays = differenceInDays(endDate, startDate) + 1
        const diff = differenceInDays(new Date(date), startDate)
        return (diff / totalDays) * 100
    }

    const getWidth = (start, end) => {
        const totalDays = differenceInDays(endDate, startDate) + 1
        const s = new Date(start) < startDate ? startDate : new Date(start)
        const e = new Date(end) > endDate ? endDate : new Date(end)

        if (s > e) return 0

        const diff = differenceInDays(e, s) + 1
        return (diff / totalDays) * 100
    }

    const sortedCampaigns = useMemo(() => {
        return [...campaigns].sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    }, [campaigns])

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="font-medium min-w-[150px] text-center">
                        {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : 'QQQ yyyy')}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(1)}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('month')}
                    >
                        Month
                    </Button>
                    <Button
                        variant={viewMode === 'quarter' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('quarter')}
                    >
                        Quarter
                    </Button>
                </div>
            </div>

            {/* Gantt Chart */}
            <Card className="overflow-hidden border shadow-sm bg-white">
                <div className="overflow-x-auto">
                    <div className="min-w-[800px] relative">

                        {/* Header Dates */}
                        <div className="flex border-b h-10 bg-muted/30">
                            <div className="w-48 shrink-0 border-r px-4 flex items-center font-medium text-sm sticky left-0 bg-background z-10">
                                Projet
                            </div>
                            <div className="flex-1 relative">
                                {days.filter(d => d.getDate() === 1 || d.getDate() === 15).map(date => (
                                    <div
                                        key={date.toISOString()}
                                        className="absolute text-xs text-muted-foreground border-l pl-1 h-full flex items-center"
                                        style={{ left: `${getPosition(date)}%` }}
                                    >
                                        {format(date, 'MMM d')}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Grid Lines */}
                        <div className="absolute inset-0 top-10 pointer-events-none flex">
                            <div className="w-48 shrink-0 border-r bg-background/50 z-10"></div>
                            <div className="flex-1 relative">
                                {/* Render vertical lines for weeks */}
                                {days.filter(d => d.getDay() === 1).map(date => (
                                    <div
                                        key={`grid-${date.toISOString()}`}
                                        className="absolute border-l h-full border-border/30"
                                        style={{ left: `${getPosition(date)}%` }}
                                    />
                                ))}
                                {/* Today line */}
                                {isWithinInterval(new Date(), { start: startDate, end: endDate }) && (
                                    <div
                                        className="absolute w-px bg-red-400 h-full z-20"
                                        style={{ left: `${getPosition(new Date())}%` }}
                                    >
                                        <div className="w-2 h-2 bg-red-400 rounded-full -ml-[3px] -mt-1" title="Today"></div>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Rows */}
                        <div className="relative py-2 space-y-2">
                            {sortedCampaigns.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm">Aucun projet sur cette période</div>
                            )}

                            {sortedCampaigns.map(campaign => {
                                const barLeft = getPosition(campaign.start_date)
                                const barWidth = getWidth(campaign.start_date, campaign.end_date)

                                // If campaign is outside viewing range entirely
                                if (barWidth <= 0 && (new Date(campaign.end_date) < startDate || new Date(campaign.start_date) > endDate)) {
                                    return null
                                }

                                return (
                                    <div key={campaign.id} className="flex h-10 items-center hover:bg-muted/20 relative group">
                                        <div className="w-48 shrink-0 px-4 text-sm font-medium truncate sticky left-0 bg-background z-10 border-r h-full flex items-center">
                                            {campaign.name}
                                        </div>
                                        <div className="flex-1 relative h-full flex items-center px-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={`
                                                absolute h-6 rounded-md shadow-sm border cursor-pointer hover:brightness-95 transition-all
                                                ${campaign.status === 'active' ? 'bg-green-100 border-green-300 text-green-800' :
                                                                    campaign.status === 'completed' ? 'bg-blue-100 border-blue-300 text-blue-800' :
                                                                        campaign.status === 'draft' ? 'bg-gray-100 border-gray-300 text-gray-800' : 'bg-orange-100 border-orange-300 text-orange-800'}
                                            `}
                                                            style={{
                                                                left: `${Math.max(0, barLeft)}%`,
                                                                width: `${Math.min(100 - Math.max(0, barLeft), barWidth)}%`
                                                            }}
                                                            onClick={() => onEdit(campaign)}
                                                        >
                                                            <div className="px-2 text-xs truncate leading-6 font-medium">
                                                                {campaign.name}
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="font-bold">{campaign.name}</p>
                                                        <p className="text-xs">
                                                            {format(new Date(campaign.start_date), 'MMM d')} - {format(new Date(campaign.end_date), 'MMM d')}
                                                        </p>
                                                        <p className="text-xs capitalize px-1 py-0.5 rounded bg-muted w-fit mt-1">{campaign.status}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="flex gap-4 text-xs text-muted-foreground justify-end">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div> Active</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div> Draft</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div> Completed</div>
            </div>
        </div>
    )
}
