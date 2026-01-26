import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchPrayerTimesByCity } from '../services/prayerTimesApi'
import './Settings.css'

function Settings({ user, onClose }) {
    const [city, setCity] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [previewTimes, setPreviewTimes] = useState(null)

    useEffect(() => {
        loadPreferences()
    }, [user])

    const loadPreferences = async () => {
        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('city')
                .eq('user_id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Load error:', error)
            }

            if (data) {
                setCity(data.city || '')
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
            // Fetch prayer times (Muslim World League = method 3)
            const times = await fetchPrayerTimesByCity(city, '', 3)

            // Save preferences
            const { error: prefError } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    city: city.trim(),
                    country: '',
                    calculation_method: 3,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                })

            if (prefError) {
                console.error('Preferences error:', prefError)
                throw new Error(`Database error: ${prefError.message}`)
            }

            // Save today's prayer times
            const today = new Date().toISOString().split('T')[0]
            const { error: scheduleError } = await supabase
                .from('prayer_schedule')
                .upsert({
                    date: today,
                    fajr: times.fajr,
                    dhuhr: times.dhuhr,
                    asr: times.asr,
                    maghrib: times.maghrib,
                    isha: times.isha
                }, {
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
            </div>
        </div>
    )
}

export default Settings
