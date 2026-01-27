export const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export const generateCSV = (data, columns) => {
    if (!data || !data.length) return ''

    // Headers
    const headers = columns.join(',')

    // Rows
    const rows = data.map(item => {
        return columns.map(col => {
            let val = item[col]

            // Handle null/undefined
            if (val === null || val === undefined) return ''

            // Handle objects (like relations) - simplify to name or ID
            if (typeof val === 'object') {
                if (val.name) return `"${val.name.replace(/"/g, '""')}"`
                if (val.title) return `"${val.title.replace(/"/g, '""')}"`
                return JSON.stringify(val).replace(/"/g, '""') // Fallback
            }

            // Handle strings with commas/quotes -> wrap in quotes and escape quotes
            const stringVal = String(val)
            if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                return `"${stringVal.replace(/"/g, '""')}"`
            }

            return stringVal
        }).join(',')
    })

    return [headers, ...rows].join('\n')
}

export const generateJSON = (data, meta = {}) => {
    const exportObject = {
        metadata: {
            version: "1.0",
            exported_at: new Date().toISOString(),
            count: data.length,
            ...meta
        },
        data: data
    }
    return JSON.stringify(exportObject, null, 2)
}
