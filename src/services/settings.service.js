/**
 * Settings Service
 *
 * Centralized service for user settings and preferences.
 *
 * @module services/settings.service
 */

import pb from '../lib/pocketbase'

class SettingsService {
    /**
     * Get user preferences
     * @returns {Promise<Object>} Preferences object or null
     */
    async getPreferences() {
        const user = pb.authStore.model
        if (!user) return {}

        try {
            const records = await pb.collection('user_preferences').getFullList({
                filter: `user_id = "${user.id}"`,
                requestKey: null
            })
            return records.length > 0 ? records[0] : {}
        } catch (error) {
            if (error.name === 'AbortError' || error.status === 0) return {}
            console.error('Error fetching settings:', error)
            return {}
        }
    }

    /**
     * Update or Create user preferences
     * @param {Object} preferences - The preferences object
     * @returns {Promise<Object>} The updated/created record
     */
    async updatePreferences(preferences) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const safePayload = {
            user_id: user.id,
            ...preferences
        }

        // Check availability
        const existing = await pb.collection('user_preferences').getFullList({
            filter: `user_id = "${user.id}"`
        })

        if (existing.length > 0) {
            return await pb.collection('user_preferences').update(existing[0].id, safePayload)
        } else {
            return await pb.collection('user_preferences').create(safePayload)
        }
    }
    /**
     * Save/Update prayer times for a list of items
     * @param {Array} items
     */
    async savePrayerTimes(items) {
        // Since batch is not available trivially, we iterate
        const promises = items.map(async (item) => {
            try {
                const existing = await pb.collection('prayer_schedule').getList(1, 1, {
                    filter: `date = "${item.date}"`
                })
                if (existing.items.length > 0) {
                    return await pb.collection('prayer_schedule').update(existing.items[0].id, item)
                } else {
                    return await pb.collection('prayer_schedule').create(item)
                }
            } catch (e) {
                console.error('Error saving prayer time for date:', item.date, e)
                return null
            }
        })
        await Promise.all(promises)
    }

    /**
     * Get prayer times for a specific date
     * @param {string} dateString YYYY-MM-DD
     * @returns {Promise<Object|null>}
     */
    async getPrayerTimes(dateString) {
        try {
            const result = await pb.collection('prayer_schedule').getList(1, 1, {
                filter: `date = "${dateString}"`,
                requestKey: null
            })
            return result.items.length > 0 ? result.items[0] : null
        } catch (e) {
            // Ignore auto-cancellation errors
            if (e.name === 'AbortError' || e.isAbort) return null
            if (e.status !== 0) {
                console.error('Error fetching prayer times', e)
            }
            return null
        }
    }
}

export const settingsService = new SettingsService()
