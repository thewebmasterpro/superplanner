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
        try {
            if (url.includes('/embed/')) return url
            return url.replace('spotify.com/', 'spotify.com/embed/')
        } catch (e) {
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
