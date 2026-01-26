import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchPrayerTimesByCity, CALCULATION_METHODS } from '../services/prayerTimesApi'
import './Settings.css'

function Settings({ user, onClose }) {
    const [preferences, setPreferences] = useState({
        city: '',
        country: '',
        calculation_method: 2
    })
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
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
                throw error
            }

            if (data) {
                setPreferences({
                    city: data.city || '',
                    country: data.country || '',
                    calculation_method: data.calculation_method || 2
                })
            }
        } catch (err) {
            console.error('Error loading preferences:', err)
            setError('Failed to load preferences')
        } finally {
            setLoading(false)
        }
    }

    const handlePreview = async () => {
        if (!preferences.city) {
            setError('Please enter a city')
            return
        }

        try {
            setError(null)
            const times = await fetchPrayerTimesByCity(
                preferences.city,
                preferences.country,
                preferences.calculation_method
            )
            setPreviewTimes(times)
            setSuccess('Prayer times loaded successfully!')
        } catch (err) {
            setError('Failed to fetch prayer times. Please check city name.')
            setPreviewTimes(null)
        }
    }

    const handleSave = async () => {
        if (!preferences.city) {
            setError('Please enter a city')
            return
        }

        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            // Fetch prayer times first
            const times = await fetchPrayerTimesByCity(
                preferences.city,
                preferences.country,
                preferences.calculation_method
            )

            // Save preferences
            const { error: prefError } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    city: preferences.city,
                    country: preferences.country,
                    calculation_method: preferences.calculation_method,
                    updated_at: new Date().toISOString()
                })

            if (prefError) throw prefError

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
                })

            if (scheduleError) throw scheduleError

            setSuccess('Settings saved successfully!')
            setTimeout(() => {
                if (onClose) onClose()
            }, 1500)
        } catch (err) {
            console.error('Error saving preferences:', err)
            setError('Failed to save settings')
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

                    <div className="form-group">
                        <label>City *</label>
                        <input
                            type="text"
                            value={preferences.city}
                            onChange={(e) => setPreferences({ ...preferences, city: e.target.value })}
                            placeholder="e.g., Paris, London, New York"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Country (optional)</label>
                        <input
                            type="text"
                            value={preferences.country}
                            onChange={(e) => setPreferences({ ...preferences, country: e.target.value })}
                            placeholder="e.g., France, UK, USA"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Calculation Method</label>
                        <select
                            value={preferences.calculation_method}
                            onChange={(e) => setPreferences({ ...preferences, calculation_method: parseInt(e.target.value) })}
                            className="form-select"
                        >
                            {Object.entries(CALCULATION_METHODS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
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
