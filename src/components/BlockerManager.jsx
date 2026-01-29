import { useState, useEffect } from 'react'
import { X, Plus, Lock, Unlock, ArrowRight, Search, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useBlockers, isTaskBlocked, areAllBlockersDone } from '../hooks/useBlockers'
import pb from '../lib/pocketbase'

/**
 * Component to display and manage blockers for a task
 */
export function BlockerManager({ taskId, readOnly = false }) {
    const { blockers, blocks, isLoadingBlockers, addBlocker, removeBlocker, isAddingBlocker } = useBlockers(taskId)
    const [showSearch, setShowSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)

    // Search for tasks to add as blockers
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSearchResults([])
            return
        }

        const timer = setTimeout(async () => {
            setSearching(true)
            try {
                const user = pb.authStore.model
                if (!user) return

                const result = await pb.collection('tasks').getList(1, 5, {
                    filter: `user_id = "${user.id}" && id != "${taskId}" && title ~ "${searchQuery}"`,
                    fields: 'id,title,status', // optimize fetch if needed, but PB returns full object by default usually
                })

                // Filter out already added blockers
                const blockerIds = blockers.map(b => b.id)
                setSearchResults(result.items.filter(t => !blockerIds.includes(t.id)) || [])

            } catch (err) {
                console.error('Search error:', err)
            } finally {
                setSearching(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery, taskId, blockers])

    const handleAddBlocker = (blockerId) => {
        addBlocker(blockerId)
        setSearchQuery('')
        setSearchResults([])
        setShowSearch(false)
    }

    const handleRemoveBlocker = (dependencyId) => {
        if (window.confirm('Remove this blocker?')) {
            removeBlocker(dependencyId)
        }
    }

    const allBlockersDone = areAllBlockersDone(blockers)
    const hasBlockers = blockers.length > 0
    const hasBlocks = blocks.length > 0

    return (
        <div className="space-y-4">
            {/* Blocked By Section */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Blocked By
                        {hasBlockers && (
                            <Badge variant={allBlockersDone ? 'default' : 'destructive'} className="text-xs">
                                {blockers.length}
                            </Badge>
                        )}
                    </h4>
                    {!readOnly && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSearch(!showSearch)}
                            disabled={isAddingBlocker}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Blocker
                        </Button>
                    )}
                </div>

                {/* Search Input */}
                {showSearch && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks to add as blocker..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                            autoFocus
                        />
                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-10 max-h-48 overflow-auto">
                                {searchResults.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => handleAddBlocker(task.id)}
                                        className="w-full text-left px-3 py-2 hover:bg-accent flex items-center justify-between text-sm"
                                    >
                                        <span className="truncate">{task.title}</span>
                                        <Badge variant="outline" className="text-xs shrink-0 ml-2">
                                            {task.status}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        )}
                        {searching && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md p-3 text-sm text-muted-foreground">
                                Searching...
                            </div>
                        )}
                    </div>
                )}

                {/* Blockers List */}
                {isLoadingBlockers ? (
                    <p className="text-sm text-muted-foreground">Loading blockers...</p>
                ) : hasBlockers ? (
                    <div className="space-y-2">
                        {allBlockersDone && (
                            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950 px-3 py-2 rounded-lg">
                                <Unlock className="w-4 h-4" />
                                All blockers resolved — Ready to start!
                            </div>
                        )}
                        {blockers.map(blocker => (
                            <div
                                key={blocker.id}
                                className={`flex items-center justify-between p-2 border rounded-lg ${blocker.status === 'done' ? 'bg-green-50 dark:bg-green-950 border-green-200' : 'bg-amber-50 dark:bg-amber-950 border-amber-200'
                                    }`}
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {blocker.status === 'done' ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                    )}
                                    <span className={`text-sm truncate ${blocker.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                        {blocker.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant={blocker.status === 'done' ? 'default' : 'secondary'} className="text-xs">
                                        {blocker.status}
                                    </Badge>
                                    {!readOnly && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => handleRemoveBlocker(blocker.dependency_id)}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No blockers — this task is free to start.</p>
                )}
            </div>

            {/* Blocks Section (Read-only) */}
            {hasBlocks && (
                <div className="space-y-2 pt-4 border-t">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                        This Task Blocks
                        <Badge variant="secondary" className="text-xs">{blocks.length}</Badge>
                    </h4>
                    <div className="space-y-1">
                        {blocks.map(blocked => (
                            <div key={blocked.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                <span className="truncate">{blocked.title}</span>
                                <Badge variant="outline" className="text-xs">{blocked.status}</Badge>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Completing this task will unblock {blocks.length} task{blocks.length > 1 ? 's' : ''}.
                    </p>
                </div>
            )}
        </div>
    )
}
