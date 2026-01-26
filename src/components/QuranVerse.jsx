import { useState, useEffect } from 'react'
import './QuranVerse.css'

function QuranVerse() {
    const [verse, setVerse] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchVerse = async () => {
        setLoading(true)
        setError(null)
        try {
            // Fetch random ayah in French (Hamidullah translation)
            const response = await fetch('https://api.alquran.cloud/v1/ayah/random/fr.hamidullah')
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

    useEffect(() => {
        fetchVerse()
    }, [])

    return (
        <div className="quran-verse-widget">
            <div className="quran-header">
                <h3>📖 Verset du jour</h3>
                <button onClick={fetchVerse} className="refresh-btn" title="Changer de verset">
                    🔄
                </button>
            </div>

            {loading ? (
                <div className="verse-loading">Chargement du verset...</div>
            ) : error ? (
                <div className="verse-error">{error}</div>
            ) : (
                <div className="verse-content">
                    <p className="verse-text">« {verse.text} »</p>
                    <div className="verse-ref">
                        Sourate {verse.surah.name} ({verse.surah.englishName}), Verset {verse.numberInSurah}
                    </div>
                </div>
            )}
        </div>
    )
}

export default QuranVerse
