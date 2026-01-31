import * as React from "react"
import { Search, CheckSquare, User, FolderKanban, Command as CommandIcon, Calendar, Loader2 } from "lucide-react"
import { useUIStore } from "../../stores/uiStore"
import pb from "../../lib/pocketbase"
import { tasksService } from '@/services/tasks.service'
import { contactsService } from '@/services/contacts.service'
import { projectsService } from '@/services/projects.service'
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function GlobalSearch() {
    const { searchQuery, setSearchQuery } = useUIStore()
    const [isOpen, setIsOpen] = React.useState(false)
    const [results, setResults] = React.useState({ tasks: [], contacts: [], projects: [] })
    const [loading, setLoading] = React.useState(false)
    const searchInputRef = React.useRef(null)

    // Keyboard shortcut CMD+K
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                searchInputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Real-time search for preview
    React.useEffect(() => {
        const fetchResults = async () => {
            // Only search if user authenticated
            if (!pb.authStore.isValid) return;

            if (searchQuery.length < 2) {
                setResults({ tasks: [], contacts: [], projects: [] })
                setIsOpen(false)
                return
            }

            setLoading(true)
            setIsOpen(true)

            try {
                // Use services for search
                // Note: Services typically fetch all by default using getFullList. 
                // For MVP global search, fetching all matching and slicing is acceptable if datasets < 1000.
                // If services support 'limit' or 'page' options passing to getList, that's better.
                // Assuming services expose getAll({ search: ... }).

                const [tasks, contacts, projects] = await Promise.all([
                    tasksService.getAll({ search: searchQuery }),
                    contactsService.getAll({ search: searchQuery }),
                    projectsService.getAll({ search: searchQuery })
                ])

                setResults({
                    tasks: tasks.slice(0, 5) || [],
                    contacts: contacts.slice(0, 5) || [],
                    projects: projects.slice(0, 3) || []
                })
            } catch (error) {
                console.error('Search error:', error)
            } finally {
                setLoading(false)
            }
        }

        const timer = setTimeout(fetchResults, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const handleSelect = (type, id) => {
        setIsOpen(false)
        setSearchQuery('')

        switch (type) {
            case 'task':
                window.location.href = `/tasks?id=${id}`
                break
            case 'contact':
                window.location.href = `/contacts` // Focus logic could be added
                break
            case 'project':
                window.location.href = `/workspace`
                break
        }
    }

    return (
        <div className="relative w-full max-w-md mx-4 group">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search across Superplanner..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setIsOpen(true)}
                    className="w-full pl-10 pr-12 bg-muted/50 border-transparent focus:bg-background focus:border-primary/20 transition-all rounded-full h-10 shadow-none focus:ring-0"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-medium text-muted-foreground pointer-events-none opacity-50 group-focus-within:opacity-0 transition-opacity">
                    ⌘K
                </div>
            </div>

            {/* Results Preview Dropdown */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full mt-2 w-full bg-popover border border-border/50 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin">
                            {loading && results.tasks.length === 0 && results.contacts.length === 0 && (
                                <div className="flex items-center justify-center py-6 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    <span className="text-xs font-medium">Searching...</span>
                                </div>
                            )}

                            {!loading && results.tasks.length === 0 && results.contacts.length === 0 && results.projects.length === 0 && (
                                <div className="py-6 text-center text-muted-foreground text-xs italic">
                                    No results found for "{searchQuery}"
                                </div>
                            )}

                            {results.tasks.length > 0 && (
                                <div className="mb-2">
                                    <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center">
                                        <CheckSquare className="w-3 h-3 mr-2" />
                                        Tasks
                                    </div>
                                    {results.tasks.map(task => (
                                        <button
                                            key={task.id}
                                            onClick={() => handleSelect('task', task.id)}
                                            className="w-full text-left px-2 py-2 hover:bg-accent rounded-lg flex items-center justify-between group transition-colors"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium group-hover:text-primary truncate max-w-[200px]">{task.title}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{task.status.replace('_', ' ')}</span>
                                            </div>
                                            {task.due_date && (
                                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                    {new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.projects.length > 0 && (
                                <div className="mb-2">
                                    <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center border-t border-border/30 mt-1 pt-2">
                                        <FolderKanban className="w-3 h-3 mr-2" />
                                        Projects
                                    </div>
                                    {results.projects.map(project => (
                                        <button
                                            key={project.id}
                                            onClick={() => handleSelect('project', project.id)}
                                            className="w-full text-left px-2 py-2 hover:bg-accent rounded-lg flex items-center group transition-colors"
                                        >
                                            <span className="text-sm font-medium group-hover:text-primary">{project.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.contacts.length > 0 && (
                                <div>
                                    <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center border-t border-border/30 mt-1 pt-2">
                                        <User className="w-3 h-3 mr-2" />
                                        Contacts
                                    </div>
                                    {results.contacts.map(contact => (
                                        <button
                                            key={contact.id}
                                            onClick={() => handleSelect('contact', contact.id)}
                                            className="w-full text-left px-2 py-2 hover:bg-accent rounded-lg flex flex-col group transition-colors"
                                        >
                                            <span className="text-sm font-medium group-hover:text-primary">{contact.name}</span>
                                            {contact.company && <span className="text-[10px] text-muted-foreground">{contact.company}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="bg-muted/50 px-3 py-2 border-t border-border/30 flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <CommandIcon className="w-3 h-3" />
                                Press enter to see all results
                            </span>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
