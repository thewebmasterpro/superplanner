/**
 * Hook for managing Telegram notifications via @Henry_anouar_bot
 */

import { useUserStore } from '../stores/userStore'

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN

/**
 * Send a Telegram notification
 * @param {string} chatId - Telegram chat ID
 * @param {string} message - Message to send
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendTelegramMessage(chatId, message) {
    if (!TELEGRAM_BOT_TOKEN) {
        console.warn('VITE_TELEGRAM_BOT_TOKEN is not configured in .env')
        return { success: false, error: 'Bot token not configured' }
    }

    try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        })

        const data = await res.json()
        if (!data.ok) {
            return { success: false, error: data.description || 'Telegram API error' }
        }
        return { success: true }
    } catch (error) {
        console.error('Telegram send error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Format a task/meeting reminder message
 */
function formatPriority(priority) {
    const map = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }
    if (typeof priority === 'string') return map[priority] || priority
    return ['Low', 'Medium', 'High', 'High', 'Urgent'][priority - 1] || 'Medium'
}

function formatReminderMessage(task, minutesBefore) {
    if (task.type === 'meeting') {
        return `📞 Meeting dans ${minutesBefore} minutes\n📋 ${task.title}\n🕐 Heure: ${task.scheduled_time ? new Date(task.scheduled_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Non définie'}\n📝 Agenda: ${task.agenda ? task.agenda.substring(0, 100) + '...' : 'Aucun agenda'}`
    } else {
        return `⏰ Rappel: ${task.title}\n📅 Deadline: ${task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : 'Non définie'}${task.scheduled_time ? ' à ' + new Date(task.scheduled_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}\n🏷️ Priority: ${formatPriority(task.priority)}`
    }
}

/**
 * Hook for Telegram notifications
 */
export function useTelegramNotifications() {
    const { preferences } = useUserStore()

    /**
     * Send a test notification
     */
    const sendTestNotification = async () => {
        if (!preferences.telegram?.chatId) {
            return { success: false, error: 'Chat ID not configured' }
        }

        const message = `🧪 Test de notification\n✅ Votre configuration Telegram fonctionne correctement!\n👩‍💼 Lisa est prête à vous envoyer des rappels.`

        return await sendTelegramMessage(preferences.telegram.chatId, message)
    }

    /**
     * Send a reminder notification for a task
     */
    const sendTaskReminder = async (task) => {
        if (!preferences.telegram?.enabled || !preferences.telegram?.chatId) {
            return { success: false, error: 'Telegram notifications not enabled' }
        }

        const minutesBefore = preferences.telegram.advanceMinutes || 30
        const message = formatReminderMessage(task, minutesBefore)

        return await sendTelegramMessage(preferences.telegram.chatId, message)
    }

    /**
     * Schedule a client-side reminder for a task.
     * Sends a Telegram notification when (scheduled_time - advanceMinutes) is reached.
     * Only works while the browser tab is open.
     */
    const scheduleReminder = (task) => {
        if (!preferences.telegram?.enabled || !preferences.telegram?.chatId) return null

        const taskTime = task.scheduled_time ? new Date(task.scheduled_time) : task.due_date ? new Date(task.due_date) : null
        if (!taskTime) return null

        const advanceMs = (preferences.telegram.advanceMinutes || 30) * 60 * 1000
        const fireAt = taskTime.getTime() - advanceMs
        const delay = fireAt - Date.now()

        if (delay <= 0) return null // Already passed

        const timerId = setTimeout(() => {
            const message = formatReminderMessage(task, preferences.telegram.advanceMinutes || 30)
            sendTelegramMessage(preferences.telegram.chatId, message)
        }, delay)

        return timerId // Caller can use clearTimeout(timerId) to cancel
    }

    return {
        sendTestNotification,
        sendTaskReminder,
        scheduleReminder,
        isConfigured: !!(preferences.telegram?.chatId && preferences.telegram?.enabled),
    }
}
