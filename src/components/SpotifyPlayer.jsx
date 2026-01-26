import './SpotifyPlayer.css'

function SpotifyPlayer({ playlistUrl }) {
    if (!playlistUrl) {
        return (
            <div className="spotify-player-widget empty">
                <div className="spotify-placeholder">
                    <span className="spotify-icon">🎵</span>
                    <p>Configurez votre playlist Spotify dans les paramètres</p>
                </div>
            </div>
        )
    }

    // Transform regular Spotify URL to embed URL
    // Example: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM3M
    // To: https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM3M
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
            // Regex to find the type (playlist|album|track) and the ID
            // Handles formats like /playlist/ID, /intl-xx/playlist/ID, etc.
            const match = url.match(/\/(playlist|album|track)\/([a-zA-Z0-9]+)/)
            if (match) {
                const type = match[1]
                const id = match[2]
                return `https://open.spotify.com/embed/${type}/${id}`
            }

            // Fallback: if it's already an embed URL
            if (url.includes('/embed/')) return url

            // Last resort fallback
            return url.replace('spotify.com/', 'spotify.com/embed/')
        } catch (e) {
            console.error('Spotify URL parsing error:', e)
            return url
        }
    }

    return (
        <div className="spotify-player-widget">
            <iframe
                src={getEmbedUrl(playlistUrl)}
                width="100%"
                height="152"
                frameBorder="0"
                allowfullscreen=""
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title="Spotify Player"
            ></iframe>
        </div>
    )
}

export default SpotifyPlayer
