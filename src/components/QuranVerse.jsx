import { useState } from 'react'
import { BookOpen, RefreshCw, Loader2, Quote } from 'lucide-react'
import { Button } from './ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog"
import { Card, CardContent } from "./ui/card"

function QuranVerse() {
    const [verse, setVerse] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [open, setOpen] = useState(false)

    const fetchVerse = async () => {
        setLoading(true)
        setError(null)
        setVerse(null)

        try {
            const response = await fetch(`https://api.alquran.cloud/v1/ayah/random/fr.hamidullah?t=${Date.now()}`)
            const data = await response.json()

            if (data.code === 200) {
                setVerse(data.data)
            } else {
                throw new Error('Erreur lors de la récupération du verset')
            }
        } catch (err) {
            console.error('Quran API Error:', err)
            setError('Impossible de charger un verset.')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenChange = (isOpen) => {
        setOpen(isOpen)
        if (isOpen && !verse) {
            fetchVerse()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Card className="h-full cursor-pointer hover:bg-muted/50 transition-colors group relative overflow-hidden">
                    <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center space-y-2">
                        <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                            <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-card-foreground">Verset du Jour</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            Lire une parole sacrée pour apaiser votre cœur
                        </p>
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Verset du Coran
                    </DialogTitle>
                </DialogHeader>

                <div className="py-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground animate-pulse">Recherche de la sagesse...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-destructive p-4 bg-destructive/10 rounded-lg">
                            {error}
                        </div>
                    ) : verse && (
                        <div className="space-y-6">
                            <div className="relative p-6 bg-muted/30 rounded-lg italic text-lg leading-relaxed text-center border-l-4 border-primary">
                                <Quote className="absolute top-2 left-2 h-4 w-4 text-primary/40 -scale-x-100" />
                                {verse.text}
                                <Quote className="absolute bottom-2 right-2 h-4 w-4 text-primary/40" />
                            </div>

                            <div className="flex justify-center gap-4 text-sm font-medium">
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                                    Sourate {verse.surah.name}
                                </span>
                                <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full">
                                    Verset {verse.numberInSurah}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-center">
                    <Button onClick={fetchVerse} disabled={loading} variant="outline" className="gap-2">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Lire un autre verset
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default QuranVerse
