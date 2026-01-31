import { useState, useEffect } from 'react'
import { useUserStore } from '../stores/userStore'
import { BookOpen, RefreshCw, Loader2, Quote, MessageCircle, Lightbulb, Brain, Target, Rocket, Wind, Zap, Heart, Briefcase, BrainCircuit } from 'lucide-react'
import { Button } from './ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog"
import { Card, CardContent } from "./ui/card"

import { getFrenchQuote, getFrenchFact, getFrenchChallenge, getFrenchTip, getFrenchWord, getFrenchBody, getFrenchBusinessTip, getFrenchCognitiveBias, getFrenchGrowthHack } from '../lib/frenchContent'

const ITEMS = [
    {
        key: 'growth',
        icon: Rocket,
        title: 'Growth Hack',
        subtitle: 'Astuce Croissance',
        dialogTitle: 'Growth Hack du Jour',
        refreshLabel: 'Autre hack',
        loadingText: 'Recherche d\'un hack...',
        errorText: 'Erreur de chargement.',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        fetch: async () => {
            await new Promise(r => setTimeout(r, 500))
            const data = getFrenchGrowthHack()
            return { text: data.content, meta: data.title }
        }
    },
    {
        key: 'bias',
        icon: BrainCircuit,
        title: 'Biais Cognitif',
        subtitle: 'Psychologie & Vente',
        dialogTitle: 'Biais Cognitif',
        refreshLabel: 'Autre biais',
        loadingText: 'Analyse du cerveau...',
        errorText: 'Erreur de chargement.',
        color: 'text-fuchsia-600 dark:text-fuchsia-400',
        bgColor: 'bg-fuchsia-100 dark:bg-fuchsia-900/20',
        fetch: async () => {
            await new Promise(r => setTimeout(r, 500))
            const data = getFrenchCognitiveBias()
            return { text: data.content, meta: data.title }
        }
    },
    {
        key: 'business',
        icon: Briefcase,
        title: 'Business Tip',
        subtitle: 'Stratégie & Croissance',
        dialogTitle: 'Conseil Business',
        refreshLabel: 'Autre conseil',
        loadingText: 'Analyse du marché...',
        errorText: 'Erreur de chargement.',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        fetch: async () => {
            await new Promise(r => setTimeout(r, 500))
            const data = getFrenchBusinessTip()
            return { text: data.content, meta: data.title }
        }
    },
    {
        key: 'body',
        icon: Heart,
        title: 'Corps Humain',
        subtitle: 'Secrets de ton corps',
        dialogTitle: 'Le Saviez-vous ?',
        refreshLabel: 'Autre fait',
        loadingText: 'Analyse du corps...',
        errorText: 'Erreur de chargement.',
        color: 'text-pink-600 dark:text-pink-400',
        bgColor: 'bg-pink-100 dark:bg-pink-900/20',
        fetch: async () => {
            await new Promise(r => setTimeout(r, 500))
            return { text: getFrenchBody(), meta: null }
        }
    },
    {
        key: 'quran',
        icon: BookOpen,
        title: 'Verset du Jour',
        subtitle: 'Parole sacrée',
        dialogTitle: 'Verset du Coran',
        refreshLabel: 'Autre verset',
        loadingText: 'Recherche de la sagesse...',
        errorText: 'Impossible de charger un verset.',
        fetch: async () => {
            const res = await fetch(`https://api.alquran.cloud/v1/ayah/random/fr.hamidullah?t=${Date.now()}`)
            const data = await res.json()
            if (data.code !== 200) throw new Error('API error')
            return {
                text: data.data.text,
                meta: `Sourate ${data.data.surah.name} — Verset ${data.data.numberInSurah}`
            }
        }
    },
    {
        key: 'challenge',
        icon: Target,
        title: 'Défi du Jour',
        subtitle: 'Passe à l\'action',
        dialogTitle: 'Votre Défi du Jour',
        refreshLabel: 'Nouveau défi',
        loadingText: 'Génération d\'un défi...',
        errorText: 'Erreur de chargement.',
        fetch: async () => {
            await new Promise(r => setTimeout(r, 500))
            return { text: getFrenchChallenge(), meta: null }
        }
    },
    {
        key: 'tip',
        icon: Zap,
        title: 'Conseil',
        subtitle: 'Booster productivité',
        dialogTitle: 'Conseil Productivité',
        refreshLabel: 'Autre conseil',
        loadingText: 'Recherche d\'un conseil...',
        errorText: 'Erreur de chargement.',
        fetch: async () => {
            await new Promise(r => setTimeout(r, 500))
            return { text: getFrenchTip(), meta: null }
        }
    },
    {
        key: 'zen',
        icon: Wind,
        title: 'Minute Zen',
        subtitle: 'Respire un coup',
        dialogTitle: 'Cohérence Cardiaque',
        refreshLabel: 'Recommencer',
        loadingText: 'Préparation...',
        isZenMode: true, // Special flag for breathing exercise
        fetch: async () => { return { text: 'Zen', meta: null } }
    },
    {
        key: 'word',
        icon: BookOpen,
        title: 'Mot du Jour',
        subtitle: 'Enrichir vocabulaire',
        dialogTitle: 'Le Mot du Jour',
        refreshLabel: 'Autre mot',
        loadingText: 'Recherche d\'un mot...',
        errorText: 'Erreur de chargement.',
        fetch: async () => {
            await new Promise(r => setTimeout(r, 500))
            const data = getFrenchWord()
            return { text: data.definition, meta: data.word }
        }
    },
    {
        key: 'quote',
        icon: MessageCircle,
        title: 'Citation du Jour',
        subtitle: 'Sagesse & motivation',
        dialogTitle: 'Citation du Jour',
        refreshLabel: 'Autre citation',
        loadingText: 'Recherche d\'inspiration...',
        errorText: 'Impossible de charger une citation.',
        fetch: async () => {
            // Simulate network delay for UX
            await new Promise(r => setTimeout(r, 600))
            const data = getFrenchQuote()
            return {
                text: data.text,
                meta: `— ${data.author}`
            }
        }
    },
    {
        key: 'joke',
        icon: Lightbulb,
        title: 'Blague du Jour',
        subtitle: 'Un peu d\'humour',
        dialogTitle: 'Blague du Jour',
        refreshLabel: 'Autre blague',
        loadingText: 'Recherche d\'une bonne blague...',
        errorText: 'Impossible de charger une blague.',
        fetch: async () => {
            const res = await fetch(`https://blague-api.vercel.app/api?mode=global&t=${Date.now()}`)
            const data = await res.json()
            if (!data?.blague) throw new Error('API error')
            return {
                text: data.blague,
                meta: data.reponse
            }
        }
    },
    {
        key: 'fact',
        icon: Brain,
        title: 'Savoir Inutile',
        subtitle: 'Le saviez-vous ?',
        dialogTitle: 'Savoir Inutile du Jour',
        refreshLabel: 'Autre fait',
        loadingText: 'Recherche d\'un fait insolite...',
        errorText: 'Impossible de charger un fait.',
        fetch: async () => {
            // Simulate network delay for UX
            await new Promise(r => setTimeout(r, 600))
            const data = getFrenchFact()
            return {
                text: data,
                meta: null
            }
        }
    }
]

function BreathingExercise() {
    const [phase, setPhase] = useState('Inhale') // Inhale, Hold, Exhale
    const [seconds, setSeconds] = useState(4)
    const [isActive, setIsActive] = useState(true)

    useEffect(() => {
        if (!isActive) return

        const cycle = [
            { phase: 'Inspirez...', duration: 4 },
            { phase: 'Bloquez...', duration: 4 },
            { phase: 'Expirez...', duration: 4 },
            { phase: 'Bloquez...', duration: 4 },
        ]

        let currentStep = 0

        const runCycle = () => {
            const step = cycle[currentStep % cycle.length]
            setPhase(step.phase)
            setSeconds(step.duration)

            const interval = setInterval(() => {
                setSeconds(s => s - 1)
            }, 1000)

            setTimeout(() => {
                clearInterval(interval)
                currentStep++
                if (isActive) runCycle()
            }, step.duration * 1000)
        }

        runCycle()

        return () => setIsActive(false)
    }, [])

    return (
        <div className="flex flex-col items-center justify-center py-10 space-y-8">
            <div className={`relative flex items-center justify-center w-48 h-48 rounded-full border-4 transition-all duration-[4000ms] ${phase === 'Inspirez...' ? 'border-primary scale-110 bg-primary/10' : phase === 'Expirez...' ? 'border-primary/40 scale-90 bg-transparent' : 'border-primary/70 scale-100'}`}>
                <div className="text-2xl font-bold text-primary animate-pulse">
                    {phase}
                </div>
            </div>
            <p className="text-sm text-muted-foreground">Concentrez-vous sur votre respiration</p>
        </div>
    )
}

function DailyInspiration() {
    const { preferences } = useUserStore()
    const [activeItem, setActiveItem] = useState(null)
    const [content, setContent] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchContent = async (item) => {
        setLoading(true)
        setError(null)
        setContent(null)
        try {
            const result = await item.fetch()
            setContent(result)
        } catch (err) {
            console.error(`${item.key} API Error:`, err)
            setError(item.errorText)
        } finally {
            setLoading(false)
        }
    }

    const handleOpen = (item) => {
        setActiveItem(item)
        setContent(null)
        fetchContent(item)
    }

    const handleClose = () => {
        setActiveItem(null)
        setContent(null)
        setError(null)
    }

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ITEMS.filter(item => preferences?.dashboardWidgets?.[`inspiration_${item.key}`] ?? true).map((item) => {
                    const Icon = item.icon
                    return (
                        <Card
                            key={item.key}
                            className="cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 group border-border/50 hover:border-black/20 dark:hover:border-white/20"
                            onClick={() => handleOpen(item)}
                        >
                            <CardContent className="p-3 py-4 flex flex-col items-center justify-center text-center space-y-3 h-full">
                                <div className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-125 bg-white shadow-sm border border-gray-100 dark:bg-zinc-800 dark:border-zinc-700`}>
                                    <Icon className={`h-6 w-6 text-black dark:text-white`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-xs text-card-foreground leading-tight">{item.title}</h3>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{item.subtitle}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Dialog open={!!activeItem} onOpenChange={(open) => { if (!open) handleClose() }}>
                <DialogContent className="sm:max-w-md">
                    {activeItem && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-xl">
                                    <activeItem.icon className="h-5 w-5 text-primary" />
                                    {activeItem.dialogTitle}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="py-2">
                                {activeItem.isZenMode ? (
                                    <BreathingExercise />
                                ) : loading ? (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="text-sm text-muted-foreground animate-pulse">{activeItem.loadingText}</p>
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-8 text-destructive p-4 bg-destructive/10 rounded-lg">
                                        {error}
                                    </div>
                                ) : content && (
                                    <div className="space-y-6 py-4">
                                        {activeItem.key === 'word' ? (
                                            <div className="text-center space-y-4">
                                                <h2 className="text-3xl font-bold text-primary tracking-wide">{content.meta}</h2>
                                                <p className="text-lg text-foreground/90 italic">"{content.text}"</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="relative p-6 bg-muted/30 rounded-lg italic text-lg leading-relaxed text-center border-l-4 border-primary">
                                                    <Quote className="absolute top-2 left-2 h-4 w-4 text-primary/40 -scale-x-100" />
                                                    {content.text}
                                                    <Quote className="absolute bottom-2 right-2 h-4 w-4 text-primary/40" />
                                                </div>
                                                {content.meta && (
                                                    <p className="text-center text-sm font-medium text-muted-foreground">
                                                        {content.meta}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {!activeItem.isZenMode && (
                                <div className="flex justify-center">
                                    <Button
                                        onClick={() => fetchContent(activeItem)}
                                        disabled={loading}
                                        variant="outline"
                                        className="gap-2"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                        {activeItem.refreshLabel}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

export default DailyInspiration
