import { useEffect } from 'react'
import { ChevronDown, Globe, Building, Briefcase } from 'lucide-react'
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
    code: Globe, // Fallback
    rocket: Globe,
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

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-between gap-2 h-10 bg-background/50 hover:bg-background"
                    disabled={loading}
                >
                    <div className="flex items-center gap-2 truncate">
                        {activeContext ? (
                            <>
                                <div
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: activeContext.color || '#6366f1' }}
                                />
                                <span className="truncate font-medium">{activeContext.name}</span>
                            </>
                        ) : (
                            <>
                                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">Global View</span>
                            </>
                        )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Switch Context
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Global Option */}
                <DropdownMenuItem
                    onClick={() => setActiveContext(null)}
                    className={!activeContextId ? 'bg-accent' : ''}
                >
                    <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>Global View</span>
                    {!activeContextId && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Context List */}
                {contexts.length === 0 ? (
                    <DropdownMenuItem disabled className="text-muted-foreground text-sm">
                        No contexts yet
                    </DropdownMenuItem>
                ) : (
                    contexts.map(ctx => {
                        const Icon = getIcon(ctx.icon)
                        const isActive = activeContextId === ctx.id
                        return (
                            <DropdownMenuItem
                                key={ctx.id}
                                onClick={() => setActiveContext(ctx.id)}
                                className={isActive ? 'bg-accent' : ''}
                            >
                                <div
                                    className="w-3 h-3 rounded-full mr-2 shrink-0"
                                    style={{ backgroundColor: ctx.color || '#6366f1' }}
                                />
                                <span className="truncate">{ctx.name}</span>
                                {isActive && <span className="ml-auto text-xs">✓</span>}
                            </DropdownMenuItem>
                        )
                    })
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
