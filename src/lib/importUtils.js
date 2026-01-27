// Robust CSV Parser that handles quotes
export const parseCSV = (text) => {
    const result = []
    const lines = text.split('\n')

    // Helper to split line by comma respecting quotes
    const splitLine = (line) => {
        const values = []
        let currentVal = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    currentVal += '"'
                    i++
                } else {
                    // Toggle quote
                    inQuotes = !inQuotes
                }
            } else if (char === ',' && !inQuotes) {
                values.push(currentVal)
                currentVal = ''
            } else {
                currentVal += char
            }
        }
        values.push(currentVal) // Push last value
        return values
    }

    if (lines.length < 1) return []

    // Headers
    const headers = splitLine(lines[0].trim()).map(h => h.trim())

    // Rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const values = splitLine(line)

        // Create object
        const rowObj = {}
        headers.forEach((header, index) => {
            // Simple mapping
            rowObj[header] = values[index] !== undefined ? values[index] : null
        })

        result.push(rowObj)
    }

    return result
}

export const validateTasksImport = (tasks) => {
    const errors = []
    const validTasks = []

    tasks.forEach((task, index) => {
        const rowNum = index + 2 // +1 for header, +1 for 0-index

        // Check required fields
        if (!task.title) {
            errors.push({ row: rowNum, message: 'Missing Title' })
            return
        }

        // Normalize status
        const validStatuses = ['todo', 'in_progress', 'blocked', 'done', 'cancelled']
        let status = task.status ? task.status.toLowerCase().replace(' ', '_') : 'todo'
        if (!validStatuses.includes(status)) status = 'todo' // Default or error? Let's default for safety

        // Normalize priority
        let priority = parseInt(task.priority)
        if (isNaN(priority) || priority < 1 || priority > 5) priority = 3

        // Construct valid object
        validTasks.push({
            title: task.title,
            description: task.description || '',
            status: status,
            priority: priority,
            due_date: task.due_date || null,
            // We skip complex relations for MVP auto-create except basic context matching if needed
            // For MVP, import raw values or ignore unknown columns
            campaign_name: task.campaign || null,
            context_name: task.context || null
        })
    })

    return { validTasks, errors }
}
