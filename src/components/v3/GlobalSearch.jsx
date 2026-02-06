import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Command } from 'lucide-react'
import { aiService } from '../../services/ai.service'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../stores/uiStore'

export function GlobalSearch() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { setModalTask, setTaskModalOpen } = useUIStore()

    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    useEffect(() => {
        const search = async () => {
            if (!query) {
                setResults([])
                return
            }
            setLoading(true)
            try {
                const data = await aiService.search(query)
                setResults(data)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }

        const debounce = setTimeout(search, 300)
        return () => clearTimeout(debounce)
    }, [query])

    const handleSelect = (task) => {
        setOpen(false)
        setQuery('')
        setModalTask(task)
        setTaskModalOpen(true)
        navigate('/tasks')
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="btn btn-ghost gap-2 font-normal text-muted-foreground hidden md:flex bg-base-200/30 dark:backdrop-blur-xl dark:bg-white/10 border border-transparent dark:border-white/10 hover:bg-base-200/50 dark:hover:bg-white/15"
            >
                <span className="text-sm">Rechercher...</span>
                <kbd className="kbd kbd-sm font-mono text-[10px] bg-muted">⌘K</kbd>
            </button>

            {/* Mobile Icon */}
            <button onClick={() => setOpen(true)} className="md:hidden btn btn-ghost btn-circle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 overflow-hidden max-w-lg bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border-base-300 dark:border-white/20">
                    <div className="flex items-center border-b border-base-300 dark:border-white/20 p-4 gap-3 bg-base-200/30 dark:bg-white/5">
                        <Command className="w-5 h-5 opacity-50" />
                        <input
                            className="flex-1 bg-transparent outline-none text-lg"
                            placeholder="Rechercher une tâche (ex: 'Rapport financier')..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        {loading && <span className="loading loading-spinner loading-sm"></span>}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                        {results.length > 0 ? (
                            <ul className="menu w-full p-2">
                                <li className="menu-title text-xs uppercase opacity-50">Résultats</li>
                                {results.map(task => (
                                    <li key={task.id}>
                                        <a onClick={() => handleSelect(task)} className="flex flex-col items-start gap-1 py-3 group">
                                            <div className="flex justify-between w-full">
                                                <span className="font-semibold group-hover:text-primary transition-colors">{task.title}</span>
                                            </div>
                                            {task.description && <span className="text-xs opacity-60 line-clamp-1">{task.description}</span>}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            query && !loading && (
                                <div className="p-8 text-center text-muted-foreground">
                                    <p>Aucun résultat trouvé pour "{query}"</p>
                                </div>
                            )
                        )}

                        {!query && (
                            <div className="p-8 text-center text-xs text-muted-foreground">
                                <p>Recherchez vos tâches par titre ou description.</p>
                                <p className="mt-2">Essayez "Rapport", "Design", "Marketing"...</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
