import { useState } from 'react'
import './QuranVerse.css'

function QuranVerse() {
    const [verse, setVerse] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)

    const fetchVerse = async () => {
        setLoading(true)
        setError(null)
        setShowModal(true)
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

    const closeModal = () => {
        setShowModal(false)
        // Clear verse after close to get a fresh one next time? 
        // Or keep it. Let's keep it until next fetch.
    }

    return (
        <div className="quran-verse-widget-mini">
            <button onClick={fetchVerse} className="btn-read-verse">
                📖 Lire un verset
            </button>

            {showModal && (
                <div className="verse-modal-overlay" onClick={closeModal}>
                    <div className="verse-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="verse-close-btn" onClick={closeModal}>✕</button>

                        <div className="verse-modal-header">
                            <h3>✨ Verset du Coran</h3>
                        </div>

                        {loading ? (
                            <div className="verse-loading-container">
                                <div className="loader"></div>
                                <p>Récupération d'un verset sacré...</p>
                            </div>
                        ) : error ? (
                            <div className="verse-error">{error}</div>
                        ) : verse && (
                            <div className="verse-body">
                                <p className="verse-text-large">« {verse.text} »</p>
                                <div className="verse-metadata">
                                    <span className="surah-name">Sourate {verse.surah.name}</span>
                                    <span className="surah-eng">{verse.surah.englishName}</span>
                                    <span className="ayah-num">Verset {verse.numberInSurah}</span>
                                </div>
                                <button onClick={fetchVerse} className="btn-refresh-modal">
                                    🔄 Lire un autre verset
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default QuranVerse
