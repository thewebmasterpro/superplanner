import { useEffect } from 'react'
import { ChevronDown, Globe, Building, Briefcase, Code, Rocket, Boxes, LayoutGrid, Palette, Target } from 'lucide-react'
import { useContextStore } from '../stores/contextStore'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'

const iconMap = {
    briefcase: Briefcase,
    building: Building,
    code: Code,
    rocket: Rocket,
    box: Boxes,
    grid: LayoutGrid,
    palette: Palette,
    target: Target,
    default: Briefcase
}

export function ContextSelector() {
    const { contexts, activeContextId, loading, loadContexts, setActiveContext, getActiveContext } = useContextStore()

    useEffect(() => {
        loadContexts()
    }, [])

    const activeContext = getActiveContext()

    const getIcon = (iconName) => {
        const Icon = iconMap[iconName] || iconMap.default
        return Icon
    }

    // Dynamic style based on active context
    const triggerStyle = activeContext
        ? {
            borderColor: activeContext.color,
            backgroundColor: `${activeContext.color}10`, // 10% opacity
            color: activeContext.color
        }
        : {}

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-between gap-2 h-10 transition-all duration-300 relative overflow-hidden group hover:border-primary/50"
                    style={triggerStyle}
                    disabled={loading}
                >
                    {/* Subtle gradient background on hover if active */}
                    {activeContext && (
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                            style={{ background: `linear-gradient(135deg, ${activeContext.color} 0%, transparent 100%)` }}
                        />
                    )}

                    <div className="flex items-center gap-2 truncate z-10">
                        {activeContext ? (
                            <>
                                <div className="relative flex items-center justify-center">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                        style={{ backgroundColor: activeContext.color }}
                                    />
                                    {/* Pulse effect */}
                                    <div
                                        className="absolute w-2.5 h-2.5 rounded-full animate-ping opacity-20"
                                        style={{ backgroundColor: activeContext.color }}
                                    />
                                </div>
                                <span className="truncate font-medium">{activeContext.name}</span>
                            </>
                        ) : (
                            <>
                                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">Global View</span>
                            </>
                        )}
                    </div>
                    <ChevronDown className="w-4 h-4 opacity-50 shrink-0 z-10" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-2 animate-in fade-in zoom-in-95 duration-200">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal tracking-wider uppercase px-2 py-1.5">
                    Switch Context
                </DropdownMenuLabel>

                {/* Global Option */}
                <DropdownMenuItem
                    onClick={() => setActiveContext(null)}
                    className={`rounded-md mb-1 cursor-pointer transition-colors duration-200 ${!activeContextId ? 'bg-accent font-medium' : 'text-muted-foreground'}`}
                >
                    <Globe className="w-4 h-4 mr-2" />
                    <span>Global View</span>
                    {!activeContextId && <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Active</span>}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                {/* Context List */}
                {contexts.length === 0 ? (
                    <DropdownMenuItem disabled className="text-muted-foreground text-sm italic opacity-70">
                        No contexts configured
                    </DropdownMenuItem>
                ) : (
                    contexts.map(ctx => {
                        const Icon = getIcon(ctx.icon)
                        const isActive = activeContextId === ctx.id
                        return (
                            <DropdownMenuItem
                                key={ctx.id}
                                onClick={() => setActiveContext(ctx.id)}
                                className={`rounded-md mb-1 cursor-pointer group transition-all duration-200 ${isActive ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
                            >
                                <div
                                    className="w-3 h-3 rounded-full mr-3 shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110"
                                    style={{ backgroundColor: ctx.color || '#6366f1' }}
                                />
                                <span className={`truncate ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                    {ctx.name}
                                </span>
                                {isActive && (
                                    <span
                                        className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono"
                                        style={{ backgroundColor: `${ctx.color}15`, color: ctx.color }}
                                    >
                                        ACT
                                    </span>
                                )}
                            </DropdownMenuItem>
                        )
                    })
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
