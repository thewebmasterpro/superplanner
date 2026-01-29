import { useState, useEffect } from 'react'
import { Plus, X, GripVertical, Search, Target, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMeetingAgenda, formatAgendaItem } from '../hooks/useMeetingAgenda'
import pb from '../lib/pocketbase'

/**
 * Component to manage the agenda of a meeting (add tasks + campaigns)
 */
export function MeetingAgendaManager({ meetingId }) {
    const { agenda, isLoading, addItem, removeItem, isAddingItem } = useMeetingAgenda(meetingId)
    const [showSearch, setShowSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchType, setSearchType] = useState('task')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)

    // Search for tasks or campaigns
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

                if (searchType === 'task') {
                    // Search tasks
                    const records = await pb.collection('tasks').getList(1, 5, {
                        filter: `user_id = "${user.id}" && type = "task" && title ~ "${searchQuery}"`,
                        sort: '-created'
                    })

                    // Filter out already added items
                    const existingIds = agenda.filter(a => a.type === 'task').map(a => a.item_id)
                    setSearchResults(records.items.filter(t => !existingIds.includes(t.id)) || [])
                } else {
                    // Search campaigns
                    const records = await pb.collection('campaigns').getList(1, 5, {
                        filter: `user_id = "${user.id}" && name ~ "${searchQuery}"`,
                        sort: '-created'
                    })

                    // Filter out already added items
                    const existingIds = agenda.filter(a => a.type === 'campaign').map(a => a.item_id)
                    setSearchResults(records.items.filter(c => !existingIds.includes(c.id)) || [])
                }
            } catch (err) {
                console.error('Search error:', err)
            } finally {
                setSearching(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery, searchType, agenda])

    const handleAddItem = (item) => {
        addItem(searchType, item.id)
        setSearchQuery('')
        setSearchResults([])
        setShowSearch(false)
    }

    const handleRemoveItem = (itemId) => {
        if (window.confirm('Remove this item from the agenda?')) {
            removeItem(itemId)
        }
    }

    if (!meetingId) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>Save the meeting first to manage the agenda.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Meeting Agenda</h4>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSearch(!showSearch)}
                    disabled={isAddingItem}
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                </Button>
            </div>

            {/* Search Panel */}
            {showSearch && (
                <Card>
                    <CardContent className="p-3 space-y-3">
                        <Tabs value={searchType} onValueChange={setSearchType}>
                            <TabsList className="grid grid-cols-2 w-full">
                                <TabsTrigger value="task" className="flex items-center gap-1">
                                    <Target className="w-3 h-3" /> Task
                                </TabsTrigger>
                                <TabsTrigger value="campaign" className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Campaign
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder={`Search ${searchType}s to add...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                                autoFocus
                            />
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="border rounded-md divide-y max-h-48 overflow-auto">
                                {searchResults.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleAddItem(item)}
                                        className="w-full text-left px-3 py-2 hover:bg-accent flex items-center justify-between text-sm"
                                    >
                                        <span className="truncate">
                                            {searchType === 'task' ? item.title : item.name}
                                        </span>
                                        <Badge variant="outline" className="text-xs shrink-0 ml-2">
                                            {item.status}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        )}

                        {searching && (
                            <p className="text-sm text-muted-foreground text-center">Searching...</p>
                        )}

                        {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center">
                                No {searchType}s found
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Agenda Items List */}
            {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading agenda...</p>
            ) : agenda.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground">No items in agenda yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Add tasks or campaigns to discuss in this meeting.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {agenda.map((item, index) => {
                        const formatted = formatAgendaItem(item)

                        return (
                            <div
                                key={item.id}
                                className={`flex items-center gap-3 p-3 border rounded-lg ${formatted.urgent ? 'border-red-300 bg-red-50 dark:bg-red-950' : ''
                                    }`}
                            >
                                <div className="text-muted-foreground cursor-grab">
                                    <GripVertical className="w-4 h-4" />
                                </div>
                                <span className="text-lg">{index + 1}.</span>
                                <span className="text-lg">{formatted.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{formatted.label}</p>
                                    {formatted.sublabel && (
                                        <p className="text-xs text-muted-foreground">{formatted.sublabel}</p>
                                    )}
                                </div>
                                <Badge variant="secondary" className="text-xs shrink-0">
                                    {item.type}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0"
                                    onClick={() => handleRemoveItem(item.item_id)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
