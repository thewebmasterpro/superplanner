// Prayer Times API Service using Aladhan API

const ALADHAN_API_BASE = 'http://api.aladhan.com/v1'

/**
 * Fetch prayer times for a specific city and country
 * @param {string} city - City name
 * @param {string} country - Country name (optional)
 * @param {number} method - Calculation method (default: 2 = ISNA)
 * @returns {Promise<Object>} Prayer times object
 */
export async function fetchPrayerTimesByCity(city, country = '', method = 2) {
    try {
        const params = new URLSearchParams({
            city,
            country,
            method: method.toString()
        })

        const response = await fetch(`${ALADHAN_API_BASE}/timingsByCity?${params}`)

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        if (data.code !== 200 || !data.data) {
            throw new Error('Invalid API response')
        }

        const timings = data.data.timings

        return {
            fajr: timings.Fajr,
            dhuhr: timings.Dhuhr,
            asr: timings.Asr,
            maghrib: timings.Maghrib,
            isha: timings.Isha,
            date: data.data.date.gregorian.date
        }
    } catch (error) {
        console.error('Error fetching prayer times:', error)
        throw error
    }
}

/**
 * Fetch prayer times by coordinates
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {number} method - Calculation method
 * @returns {Promise<Object>} Prayer times object
 */
export async function fetchPrayerTimesByCoordinates(latitude, longitude, method = 2) {
    try {
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            method: method.toString()
        })

        const response = await fetch(`${ALADHAN_API_BASE}/timings?${params}`)

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        if (data.code !== 200 || !data.data) {
            throw new Error('Invalid API response')
        }

        const timings = data.data.timings

        return {
            fajr: timings.Fajr,
            dhuhr: timings.Dhuhr,
            asr: timings.Asr,
            maghrib: timings.Maghrib,
            isha: timings.Isha,
            date: data.data.date.gregorian.date
        }
    } catch (error) {
        console.error('Error fetching prayer times:', error)
        throw error
    }
}

/**
 * Get calculation methods
 */
export const CALCULATION_METHODS = {
    1: 'University of Islamic Sciences, Karachi',
    2: 'Islamic Society of North America (ISNA)',
    3: 'Muslim World League',
    4: 'Umm Al-Qura University, Makkah',
    5: 'Egyptian General Authority of Survey',
    7: 'Institute of Geophysics, University of Tehran',
    8: 'Gulf Region',
    9: 'Kuwait',
    10: 'Qatar',
    11: 'Majlis Ugama Islam Singapura, Singapore',
    12: 'Union Organization islamic de France',
    13: 'Diyanet İşleri Başkanlığı, Turkey',
    14: 'Spiritual Administration of Muslims of Russia'
}
