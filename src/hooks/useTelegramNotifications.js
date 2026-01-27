/**
 * Hook for managing Telegram notifications via @Henry_anouar_bot
 */

import { useUserStore } from '../stores/userStore'
import { supabase } from '../lib/supabase'

/**
 * Send a Telegram notification
 * @param {string} chatId - Telegram chat ID
 * @param {string} message - Message to send
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendTelegramMessage(chatId, message) {
    try {
        // Get Supabase project URL from the client
        const supabaseUrl = supabase.supabaseUrl || import.meta.env.VITE_SUPABASE_URL
        const functionUrl = `${supabaseUrl}/functions/v1/telegram-bot`

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                message: message,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to send Telegram notification')
        }

        const data = await response.json()
        return { success: data.success }
    } catch (error) {
        console.error('Error sending Telegram notification:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Format a task/meeting reminder message
 */
function formatReminderMessage(task, minutesBefore) {
    const ismeeting = task.type === 'meeting'

    if (ismeeting) {
        return `📞 Meeting dans ${minutesBefore} minutes\n📋 ${task.title}\n🕐 Heure: ${task.scheduled_time ? new Date(task.scheduled_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Non définie'}\n📝 Agenda: ${task.agenda ? task.agenda.substring(0, 100) + '...' : 'Aucun agenda'}`
    } else {
        return `⏰ Rappel: ${task.title}\n📅 Deadline: ${task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : 'Non définie'}${task.scheduled_time ? ' à ' + new Date(task.scheduled_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}\n🏷️ Priority: ${['Low', 'Medium', 'High'][task.priority - 1] || 'Medium'}`
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
     * Schedule a reminder for a task (to be called by a scheduler/cron job)
     * This is a placeholder - actual scheduling would be done server-side
     */
    const scheduleReminder = async (task) => {
        // TODO: Implement server-side scheduling logic
        // This would typically involve creating a scheduled job to send the notification
        // at the appropriate time (deadline - advanceMinutes)
        console.log('Schedule reminder for task:', task.title)
    }

    return {
        sendTestNotification,
        sendTaskReminder,
        scheduleReminder,
        isConfigured: !!(preferences.telegram?.chatId && preferences.telegram?.enabled),
    }
}
