/**
 * Automation Service
 * 
 * Handles triggering external webhooks (n8n).
 * Base URL: https://auto.hagendigital.com
 */

class AutomationService {
    constructor() {
        this.baseUrl = 'https://auto.hagendigital.com'
        this.webhookId = import.meta.env.VITE_N8N_WEBHOOK_ID || 'critical-task-hook'
    }

    /**
     * Trigger webhook for critical task creation
     * @param {Object} task - The task object
     */
    async notifyCriticalTask(task) {
        // defined critical: high priority or urgent
        const isCritical = task.priority === 'high' || task.priority === 'urgent' || task.priority === '5'

        if (!isCritical) return

        try {
            console.log('⚡️ Triggering Automation for Critical Task:', task.title)

            // Fire and forget - don't block the UI
            fetch(`${this.baseUrl}/webhook/${this.webhookId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event: 'task_created',
                    priority: 'critical',
                    task_id: task.id,
                    title: task.title,
                    description: task.description,
                    created_at: new Date().toISOString(),
                    user: 'current_user' // You might want real user info here
                })
            }).catch(err => console.error('Automation Webhook Failed (background):', err))

        } catch (error) {
            console.error('Error in automation service:', error)
        }
    }
}

export const automationService = new AutomationService()
