import { Music } from 'lucide-react'
import { Card, CardContent } from './ui/card'

function SpotifyPlayer({ playlistUrl }) {
    if (!playlistUrl) {
        return (
            <Card className="h-full flex items-center justify-center p-6 text-center text-muted-foreground bg-muted/20">
                <div className="flex flex-col items-center gap-2">
                    <Music className="h-8 w-8 opacity-50" />
                    <p className="text-sm">Configurez votre playlist Spotify dans les paramètres</p>
                </div>
            </Card>
        )
    }

    // Transform regular Spotify URL to embed URL
    const getEmbedUrl = (url) => {
        if (!url) return ''

        // Handle Spotify URIs (spotify:playlist:ID)
        if (url.startsWith('spotify:')) {
            const parts = url.split(':')
            if (parts.length >= 3) {
                return `https://open.spotify.com/embed/${parts[1]}/${parts[2]}`
            }
        }

        // Handle web URLs
        try {
            const match = url.match(/\/(playlist|album|track)\/([a-zA-Z0-9]+)/)
            if (match) {
                const type = match[1]
                const id = match[2]
                return `https://open.spotify.com/embed/${type}/${id}`
            }

            if (url.includes('/embed/')) return url
            return url.replace('spotify.com/', 'spotify.com/embed/')
        } catch (e) {
            console.error('Spotify URL parsing error:', e)
            return url
        }
    }

    return (
        <Card className="h-full overflow-hidden p-0 border-0 shadow-lg">
            <iframe
                src={getEmbedUrl(playlistUrl)}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen=""
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title="Spotify Player"
                className="min-h-[152px]"
            ></iframe>
        </Card>
    )
}

export default SpotifyPlayer
