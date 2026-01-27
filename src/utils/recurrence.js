/**
 * Generate virtual occurrences for recurring tasks
 * @param {Object} task - The recurring task
 * @param {number} maxOccurrences - Maximum number of future occurrences to generate (default: 50)
 * @returns {Array} Array of virtual task occurrences
 */
export function generateVirtualOccurrences(task, maxOccurrences = 50) {
    if (!task.recurrence) return []

    // Don't generate occurrences for completed tasks
    if (task.status === 'done' || task.status === 'cancelled') return []

    // Get the reference date (due_date or scheduled_time)
    const referenceDate = task.due_date || (task.scheduled_time ? task.scheduled_time.split('T')[0] : null)
    if (!referenceDate) return []

    const virtualOccurrences = []

    // Parse date in local timezone to avoid shifts
    // Manual parsing: YYYY-MM-DD -> [year, month-1, day]
    const [year, month, day] = referenceDate.split('-').map(Number)
    let currentDate = new Date(year, month - 1, day, 12, 0, 0) // Noon to avoid DST issues

    // Get end date if specified
    const endDate = task.recurrence_end ? (() => {
        const [y, m, d] = task.recurrence_end.split('-').map(Number)
        return new Date(y, m - 1, d, 12, 0, 0)
    })() : null

    // Generate future occurrences
    for (let i = 0; i < maxOccurrences; i++) {
        // Calculate next date
        let nextDate = new Date(currentDate)

        switch (task.recurrence) {
            case 'daily':
                nextDate.setDate(currentDate.getDate() + 1)
                break
            case 'weekly':
                nextDate.setDate(currentDate.getDate() + 7)
                break
            case 'biweekly':
                nextDate.setDate(currentDate.getDate() + 14)
                break
            case 'monthly':
                nextDate.setMonth(currentDate.getMonth() + 1)
                break
            default:
                return virtualOccurrences // Unknown recurrence pattern
        }

        // Check if we've exceeded the end date
        if (endDate && nextDate > endDate) {
            break
        }

        // Create virtual occurrence with proper date formatting
        const newDueDate = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`
        let newScheduledTime = null

        if (task.scheduled_time) {
            const originalTime = task.scheduled_time.split('T')[1] || '12:00:00'
            newScheduledTime = `${newDueDate}T${originalTime}`
        }

        const virtualTask = {
            ...task,
            id: `${task.id}_virtual_${i}`, // Unique ID for virtual occurrence
            due_date: newDueDate,
            scheduled_time: newScheduledTime,
            status: 'todo', // Virtual occurrences are always todo
            isVirtual: true, // Flag to identify virtual occurrences
            originalTaskId: task.id // Reference to the original task
        }

        virtualOccurrences.push(virtualTask)
        currentDate = nextDate
    }

    return virtualOccurrences
}

/**
 * Expand tasks with virtual occurrences
 * @param {Array} tasks - Array of tasks
 * @returns {Array} Array of tasks including virtual occurrences
 */
export function expandTasksWithVirtualOccurrences(tasks) {
    const expandedTasks = []

    tasks.forEach(task => {
        // Add the original task
        expandedTasks.push(task)

        // Add virtual occurrences if the task is recurring
        if (task.recurrence) {
            const virtualOccurrences = generateVirtualOccurrences(task)
            expandedTasks.push(...virtualOccurrences)
        }
    })

    return expandedTasks
}
