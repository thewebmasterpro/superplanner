import { useEffect } from 'react'
import { ChevronDown, Globe, Building, Briefcase, Code, Rocket, Boxes, LayoutGrid, Palette, Target } from 'lucide-react'
import { useWorkspaceStore } from '../stores/workspaceStore'
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

export function WorkspaceSelector() {
    const { workspaces, activeWorkspaceId, loading, loadWorkspaces, setActiveWorkspace, getActiveWorkspace } = useWorkspaceStore()

    useEffect(() => {
        loadWorkspaces()
    }, [])

    const activeWorkspace = getActiveWorkspace()

    const getIcon = (iconName) => {
        const Icon = iconMap[iconName] || iconMap.default
        return Icon
    }

    // Dynamic style based on active workspace
    const triggerStyle = activeWorkspace
        ? {
            borderColor: activeWorkspace.color,
            backgroundColor: `${activeWorkspace.color}10`, // 10% opacity
            color: activeWorkspace.color
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
                    {activeWorkspace && (
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                            style={{ background: `linear-gradient(135deg, ${activeWorkspace.color} 0%, transparent 100%)` }}
                        />
                    )}

                    <div className="flex items-center gap-2 truncate z-10">
                        {activeWorkspace ? (
                            <>
                                <div className="relative flex items-center justify-center">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                        style={{ backgroundColor: activeWorkspace.color }}
                                    />
                                    {/* Pulse effect */}
                                    <div
                                        className="absolute w-2.5 h-2.5 rounded-full animate-ping opacity-20"
                                        style={{ backgroundColor: activeWorkspace.color }}
                                    />
                                </div>
                                <span className="truncate font-medium">{activeWorkspace.name}</span>
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
                    Switch Workspace
                </DropdownMenuLabel>

                {/* Global Option */}
                <DropdownMenuItem
                    onClick={() => setActiveWorkspace(null)}
                    className={`rounded-md mb-1 cursor-pointer transition-colors duration-200 ${!activeWorkspaceId ? 'bg-accent font-medium' : 'text-muted-foreground'}`}
                >
                    <Globe className="w-4 h-4 mr-2" />
                    <span>Global View</span>
                    {!activeWorkspaceId && <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Active</span>}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                {/* Workspace List */}
                {workspaces.length === 0 ? (
                    <DropdownMenuItem disabled className="text-muted-foreground text-sm italic opacity-70">
                        No workspaces configured
                    </DropdownMenuItem>
                ) : (
                    workspaces.map(w => {
                        const Icon = getIcon(w.icon)
                        const isActive = activeWorkspaceId === w.id
                        return (
                            <DropdownMenuItem
                                key={w.id}
                                onClick={() => setActiveWorkspace(w.id)}
                                className={`rounded-md mb-1 cursor-pointer group transition-all duration-200 ${isActive ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
                            >
                                <div
                                    className="w-3 h-3 rounded-full mr-3 shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110"
                                    style={{ backgroundColor: w.color || '#6366f1' }}
                                />
                                <span className={`truncate ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                    {w.name}
                                </span>
                                {isActive && (
                                    <span
                                        className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono"
                                        style={{ backgroundColor: `${w.color}15`, color: w.color }}
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
