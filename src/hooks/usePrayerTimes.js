import { useQuery } from '@tanstack/react-query'

/**
 * Fetch prayer times for a given location
 * @param {string} city - City name
 * @param {string} country - Country name
 * @param {number} method - Calculation method (default: 3 = Muslim World League)
 */
async function fetchPrayerTimes(city, country, method = 3) {
    if (!city || !country) {
        return null
    }

    try {
        const response = await fetch(
            `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`
        )

        if (!response.ok) {
            throw new Error('Failed to fetch prayer times')
        }

        const data = await response.json()

        if (data.code !== 200 || !data.data) {
            throw new Error('Invalid response from prayer times API')
        }

        return data.data
    } catch (error) {
        console.error('Error fetching prayer times:', error)
        throw error
    }
}

/**
 * Hook to fetch and cache prayer times
 * @param {string} city - City name
 * @param {string} country - Country name  
 * @param {number} method - Calculation method (default: 3 = Muslim World League)
 */
export function usePrayerTimes(city, country, method = 3) {
    return useQuery({
        queryKey: ['prayerTimes', city, country, method],
        queryFn: () => fetchPrayerTimes(city, country, method),
        enabled: !!(city && country), // Only fetch if city and country are provided
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
        retry: 2,
    })
}

/**
 * Get today's prayer times as calendar events
 * @param {Object} prayerData - Prayer data from Aladhan API
 * @param {Date} date - Date for which to get prayer times
 * @returns {Array} Array of prayer time events
 */
export function getPrayerEvents(prayerData, date = new Date()) {
    if (!prayerData || !prayerData.timings) {
        return []
    }

    const timings = prayerData.timings
    const prayers = [
        { name: 'Fajr', time: timings.Fajr, emoji: '🌅' },
        { name: 'Dhuhr', time: timings.Dhuhr, emoji: '☀️' },
        { name: 'Asr', time: timings.Asr, emoji: '🌤️' },
        { name: 'Maghrib', time: timings.Maghrib, emoji: '🌆' },
        { name: 'Isha', time: timings.Isha, emoji: '🌙' },
    ]

    return prayers.map(prayer => {
        // Parse time (format: "HH:MM (TIMEZONE)" or "HH:MM")
        const timeStr = prayer.time.split(' ')[0] // Remove timezone info
        const [hours, minutes] = timeStr.split(':').map(Number)

        // Create date object for this prayer
        const prayerDate = new Date(date)
        prayerDate.setHours(hours, minutes, 0, 0)

        return {
            id: `prayer_${prayer.name}${date.toISOString().split('T')[0]}`,
            title: `🤲 Prayer: ${prayer.name} ${prayer.emoji}`,
            start: prayerDate,
            end: new Date(prayerDate.getTime() + 30 * 60000), // 30 minutes duration
            isPrayer: true,
            prayerName: prayer.name,
        }
    })
}
