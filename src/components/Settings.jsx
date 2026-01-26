import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchPrayerTimesByCity, fetchMonthlyPrayerTimesByCity } from '../services/prayerTimesApi'
import './Settings.css'

function Settings({ user, onClose }) {
    const [city, setCity] = useState('')
    const [pomodoroWork, setPomodoroWork] = useState(25)
    const [pomodoroBreak, setPomodoroBreak] = useState(5)
    const [spotifyPlaylistUrl, setSpotifyPlaylistUrl] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [previewTimes, setPreviewTimes] = useState(null)

    // Category Management
    const [categories, setCategories] = useState([])
    const [newCategoryName, setNewCategoryName] = useState('')

    useEffect(() => {
        loadPreferences()
        loadCategories()
    }, [user])

    const loadCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('task_categories')
                .select('*')
                .order('name', { ascending: true })
            if (error) throw error
            setCategories(data || [])
        } catch (err) {
            console.error('Error loading categories:', err)
        }
    }

    const loadPreferences = async () => {
        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Load error:', error)
            }

            if (data) {
                setCity(data.city || '')
                setPomodoroWork(data.pomodoro_work_duration || 25)
                setPomodoroBreak(data.pomodoro_break_duration || 5)
                setSpotifyPlaylistUrl(data.spotify_playlist_url || '')
            }
        } catch (err) {
            console.error('Error loading preferences:', err)
        } finally {
            setLoading(false)
        }
    }

    const handlePreview = async () => {
        if (!city.trim()) {
            setError('Please enter a city')
            return
        }

        try {
            setError(null)
            // Muslim World League = method 3
            const times = await fetchPrayerTimesByCity(city, '', 3)
            setPreviewTimes(times)
            setSuccess('Prayer times loaded successfully!')
        } catch (err) {
            console.error('Preview error:', err)
            setError('Failed to fetch prayer times. Please check city name.')
            setPreviewTimes(null)
        }
    }

    const handleSave = async () => {
        if (!city.trim()) {
            setError('Please enter a city')
            return
        }

        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            // Fetch monthly prayer times
            const now = new Date()
            const month = now.getMonth() + 1
            const year = now.getFullYear()
            const monthlyTimes = await fetchMonthlyPrayerTimesByCity(city, '', 3, month, year)

            // Save preferences
            const { error: prefError } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    city: city.trim(),
                    country: '',
                    calculation_method: 3,
                    pomodoro_work_duration: parseInt(pomodoroWork),
                    pomodoro_break_duration: parseInt(pomodoroBreak),
                    spotify_playlist_url: spotifyPlaylistUrl.trim(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                })

            if (prefError) {
                console.error('Preferences error:', prefError)
                throw new Error(`Database error: ${prefError.message}`)
            }

            // Save monthly prayer times
            const { error: scheduleError } = await supabase
                .from('prayer_schedule')
                .upsert(monthlyTimes, {
                    onConflict: 'date'
                })

            if (scheduleError) {
                console.error('Schedule error:', scheduleError)
                throw new Error(`Schedule error: ${scheduleError.message}`)
            }

            setSuccess('Settings saved successfully!')
            setTimeout(() => {
                if (onClose) onClose()
            }, 1500)
        } catch (err) {
            console.error('Save error:', err)
            setError(err.message || 'Failed to save settings. Check console for details.')
        } finally {
            setSaving(false)
        }
    }

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return
        try {
            const { error } = await supabase
                .from('task_categories')
                .insert({ user_id: user.id, name: newCategoryName.trim() })
            if (error) throw error
            setNewCategoryName('')
            loadCategories()
            setSuccess('Catégorie ajoutée !')
        } catch (err) {
            console.error('Error adding category:', err)
            setError('Échec de l\'ajout de la catégorie')
        }
    }

    const handleDeleteCategory = async (id) => {
        try {
            const { error } = await supabase
                .from('task_categories')
                .delete()
                .eq('id', id)
            if (error) throw error
            loadCategories()
            setSuccess('Catégorie supprimée')
        } catch (err) {
            console.error('Error deleting category:', err)
            setError('Échec de la suppression')
        }
    }

    if (loading) {
        return (
            <div className="settings-modal">
                <div className="settings-content">
                    <p>Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="settings-modal" onClick={onClose}>
            <div className="settings-content" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>⚙️ Settings</h2>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="settings-section">
                    <h3>🕌 Prayer Times Configuration</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.9em', marginBottom: '15px' }}>
                        Using <strong>Muslim World League</strong> calculation method
                    </p>

                    <div className="form-group">
                        <label>City *</label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g., Paris, London, Casablanca, Dubai"
                            className="form-input"
                        />
                        <small style={{ color: '#6b7280', fontSize: '0.85em', display: 'block', marginTop: '5px' }}>
                            Enter your city name to calculate prayer times
                        </small>
                    </div>

                    <div className="button-group">
                        <button onClick={handlePreview} className="btn-secondary">
                            👁️ Preview
                        </button>
                        <button onClick={handleSave} disabled={saving} className="btn-primary">
                            {saving ? 'Saving...' : '💾 Save Settings'}
                        </button>
                    </div>

                    {previewTimes && (
                        <div className="preview-times">
                            <h4>Preview Prayer Times</h4>
                            <div className="times-grid">
                                <div className="time-item">
                                    <span className="time-label">Fajr</span>
                                    <span className="time-value">{previewTimes.fajr}</span>
                                </div>
                                <div className="time-item">
                                    <span className="time-label">Dhuhr</span>
                                    <span className="time-value">{previewTimes.dhuhr}</span>
                                </div>
                                <div className="time-item">
                                    <span className="time-label">Asr</span>
                                    <span className="time-value">{previewTimes.asr}</span>
                                </div>
                                <div className="time-item">
                                    <span className="time-label">Maghrib</span>
                                    <span className="time-value">{previewTimes.maghrib}</span>
                                </div>
                                <div className="time-item">
                                    <span className="time-label">Isha</span>
                                    <span className="time-value">{previewTimes.isha}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="settings-section">
                    <h3>🍅 Pomodoro Configuration</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Work Duration (min)</label>
                            <input
                                type="number"
                                value={pomodoroWork}
                                onChange={(e) => setPomodoroWork(e.target.value)}
                                min="1"
                                max="60"
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Break Duration (min)</label>
                            <input
                                type="number"
                                value={pomodoroBreak}
                                onChange={(e) => setPomodoroBreak(e.target.value)}
                                min="1"
                                max="30"
                                className="form-input"
                            />
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>🎵 Spotify Integration</h3>
                    <div className="form-group">
                        <label>Playlist URL</label>
                        <input
                            type="text"
                            value={spotifyPlaylistUrl}
                            onChange={(e) => setSpotifyPlaylistUrl(e.target.value)}
                            placeholder="https://open.spotify.com/playlist/..."
                            className="form-input"
                        />
                        <small style={{ color: '#6b7280', fontSize: '0.85em', display: 'block', marginTop: '5px' }}>
                            Paste your favorite Spotify playlist link here.
                        </small>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>📁 Gestion des Catégories</h3>
                    <div className="category-manager">
                        <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: '15px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Nom de la catégorie</label>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="ex: Travail, Perso, Clients..."
                                    className="form-input"
                                />
                            </div>
                            <button onClick={handleAddCategory} className="btn-primary" style={{ padding: '10px 15px' }}>
                                ➕ Ajouter
                            </button>
                        </div>
                        <div className="category-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {categories.map(cat => (
                                <div key={cat.id} className="category-chip" style={{
                                    background: '#f1f5f9',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.9em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <span>{cat.name}</span>
                                    <button
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        style={{ background: 'none', border: 'none', padding: 0, color: '#ef4444', fontSize: '1.2em', cursor: 'pointer' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {categories.length === 0 && <p className="empty">Aucune catégorie configurée.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings
