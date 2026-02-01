import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Command } from 'lucide-react'
import { aiService } from '../../services/ai.service'
import { useMoveToTrash } from '../../hooks/useTasks'
import { useNavigate } from 'react-router-dom'

export function GlobalSearch() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

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

    const handleSelect = (taskId) => {
        setOpen(false)
        // Navigate or open modal?
        // For now, maybe just console log or simple alert, or navigate if we had a detailed view
        // Ideally we'd open TaskModal in edit mode via URL param or context
        console.log("Selected task", taskId)
        // navigate(`/tasks/${taskId}`) // If we had routing
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="btn btn-ghost gap-2 font-normal text-muted-foreground hidden md:flex"
            >
                <span className="text-sm">Recherche IA...</span>
                <kbd className="kbd kbd-sm font-mono text-[10px] bg-muted">⌘K</kbd>
            </button>

            {/* Mobile Icon */}
            <button onClick={() => setOpen(true)} className="md:hidden btn btn-ghost btn-circle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 overflow-hidden max-w-lg bg-base-100 border-base-300">
                    <div className="flex items-center border-b p-4 gap-3 bg-base-200/50">
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
                                <li className="menu-title text-xs uppercase opacity-50">Résultats Semantic AI</li>
                                {results.map(task => (
                                    <li key={task.id}>
                                        <a onClick={() => handleSelect(task.id)} className="flex flex-col items-start gap-1 py-3 group">
                                            <div className="flex justify-between w-full">
                                                <span className="font-semibold group-hover:text-primary transition-colors">{task.title}</span>
                                                {task.score && <span className="badge badge-xs badge-ghost">{(task.score * 100).toFixed(0)}%</span>}
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
                                <p>Utilisez l'IA pour retrouver vos tâches par le sens.</p>
                                <p className="mt-2">Essayez "Urgent", "Design", "Marketing"...</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
