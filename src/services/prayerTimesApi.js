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
            msg: 'Success',
            date: data.data.date.gregorian.date,
            hijri: {
                date: data.data.date.hijri.date,
                day: data.data.date.hijri.day,
                month: data.data.date.hijri.month.en,
                year: data.data.date.hijri.year,
                weekday: data.data.date.hijri.weekday.en
            }
        }
    } catch (error) {
        if (error.name === 'AbortError') return null
        console.error('Error fetching prayer times:', error)
        throw error
    }
}

/**
 * Fetch monthly prayer times for a specific city and country
 */
export async function fetchMonthlyPrayerTimesByCity(city, country = '', method = 2, month, year) {
    try {
        const params = new URLSearchParams({
            city,
            country,
            method: method.toString(),
            month: month.toString(),
            year: year.toString()
        })

        const response = await fetch(`${ALADHAN_API_BASE}/calendarByCity?${params}`)
        if (!response.ok) throw new Error(`API error: ${response.status}`)
        const data = await response.json()
        if (data.code !== 200 || !data.data) throw new Error('Invalid API response')

        return data.data.map(day => ({
            date: day.date.gregorian.date.split('-').reverse().join('-'), // format YYYY-MM-DD
            fajr: day.timings.Fajr.split(' ')[0],
            dhuhr: day.timings.Dhuhr.split(' ')[0],
            asr: day.timings.Asr.split(' ')[0],
            maghrib: day.timings.Maghrib.split(' ')[0],
            isha: day.timings.Isha.split(' ')[0]
        }))
    } catch (error) {
        if (error.name === 'AbortError') return []
        console.error('Error fetching monthly prayer times:', error)
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
            date: data.data.date.gregorian.date,
            hijri: {
                date: data.data.date.hijri.date,
                day: data.data.date.hijri.day,
                month: data.data.date.hijri.month.en,
                year: data.data.date.hijri.year,
                weekday: data.data.date.hijri.weekday.en
            }
        }
    } catch (error) {
        if (error.name === 'AbortError') return null
        console.error('Error fetching prayer times:', error)
        throw error
    }
}

/**
 * Search city to get its timezone and validation
 * @param {string} city 
 * @param {string} country 
 * @returns {Promise<{city: string, timezone: string, country: string}>}
 */
export async function searchCityTimezone(city, country = '') {
    try {
        const params = new URLSearchParams({ city, country, method: '2' })
        const response = await fetch(`${ALADHAN_API_BASE}/timingsByCity?${params}`)

        if (!response.ok) throw new Error('City not found')
        const data = await response.json()

        if (data.code !== 200 || !data.data) throw new Error('City not found')

        return {
            city: city.charAt(0).toUpperCase() + city.slice(1), // Simple capitalization
            timezone: data.data.meta.timezone,
            country: country
        }
    } catch (error) {
        if (error.name === 'AbortError') return null
        console.error('Error searching city:', error)
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
