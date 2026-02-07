import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useTasks } from '@/hooks/useTasks'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import pb from '@/lib/pocketbase'
import { generateCSV, generateJSON, downloadFile } from '@/lib/exportUtils'
import { parseCSV, validateTasksImport } from '@/lib/importUtils'
import { Loader2, Download, Upload, FileJson, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { backupService } from '@/services/backup.service'

export function DataBackupSettings() {
    const { data: tasks = [] } = useTasks()
    const { workspaces } = useWorkspaceStore()
    const [loading, setLoading] = useState(false)

    // Export State
    const [exportFormat, setExportFormat] = useState('csv')
    const [selectedColumns, setSelectedColumns] = useState({
        title: true,
        status: true,
        priority: true,
        description: true,
        due_date: true,
        created: true,
        context: true,
        campaign: true,
        project: true
    })

    // Import State
    const [importData, setImportData] = useState(null)
    const [importErrors, setImportErrors] = useState([])
    const [importSummary, setImportSummary] = useState(null)

    const handleExport = async () => {
        setLoading(true)
        try {
            // 1. Prepare Data
            const flattenedTasks = tasks.map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                due_date: t.due_date,
                created: t.created,
                // Flatten relations via store lookups
                context: workspaces.find(w => w.id === t.context_id)?.name || '',
                campaign: t.campaign_id || '',
                project: t.project_id || '',
                client: t.contact_id // MVP: just ID
            }))

            // 2. Filter Columns
            const activeColumns = Object.keys(selectedColumns).filter(k => selectedColumns[k])

            let content = ''
            let filename = `superplanner_tasks_${new Date().toISOString().split('T')[0]}`
            let type = ''

            if (exportFormat === 'csv') {
                content = generateCSV(flattenedTasks, ['id', ...activeColumns]) // Always include ID
                filename += '.csv'
                type = 'text/csv'
            } else {
                content = generateJSON(flattenedTasks)
                filename += '.json'
                type = 'application/json'
            }

            // 3. Download
            downloadFile(content, filename, type)
            toast.success('Export started!')
        } catch (error) {
            console.error(error)
            toast.error('Export failed')
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (event) => {
            try {
                const text = event.target.result
                let parsedData = []

                if (file.name.endsWith('.json')) {
                    const json = JSON.parse(text)
                    parsedData = json.data || json // Support {data: [...]} or just [...]
                    if (!Array.isArray(parsedData)) throw new Error('Invalid JSON format. Expected array of tasks.')
                } else {
                    parsedData = parseCSV(text)
                }

                // Validate
                const { validTasks, errors } = validateTasksImport(parsedData)

                setImportData(validTasks)
                setImportErrors(errors)
                setImportSummary({
                    total: parsedData.length,
                    valid: validTasks.length,
                    errors: errors.length
                })

            } catch (error) {
                toast.error('Failed to parse file: ' + error.message)
                console.error(error)
            }
        }
        reader.readAsText(file)
    }

    const executeImport = async () => {
        if (!importData || importData.length === 0) return
        if (!confirm(`Import ${importData.length} tasks? This cannot be undone.`)) return

        setLoading(true)

        try {
            const user = pb.authStore.model

            // Fetch metadata for mapping
            const { contexts, campaigns, projects } = await backupService.getImportMetadata()

            const contextMap = new Map(contexts.map(c => [c.name.toLowerCase(), c.id]))
            const campaignMap = new Map(campaigns.map(c => [c.name.toLowerCase(), c.id]))
            const projectMap = new Map(projects.map(p => [p.name.toLowerCase(), p.id]))

            const tasksToInsert = importData.map(t => {
                const contextId = t.context_name ? contextMap.get(t.context_name.toLowerCase()) : null
                const campaignId = t.campaign_name ? campaignMap.get(t.campaign_name.toLowerCase()) : null
                const projectId = t.project_name ? projectMap.get(t.project_name.toLowerCase()) : null

                return {
                    user_id: user.id,
                    title: t.title,
                    description: t.description,
                    status: t.status,
                    priority: t.priority,
                    due_date: t.due_date ? new Date(t.due_date).toISOString() : '', // PB format
                    context_id: contextId,
                    campaign_id: campaignId,
                    project_id: projectId,
                    contact_id: t.client || null
                }
            })

            // Execute Import via Service
            await backupService.importTasks(tasksToInsert)

            toast.success(`Successfully imported ${tasksToInsert.length} tasks!`)
            setImportData(null)
            setImportSummary(null)
            // Ideally trigger refresh
            setTimeout(() => window.location.reload(), 1500)

        } catch (error) {
            toast.error('Import failed: ' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Data Management</h3>
                <p className="text-sm text-muted-foreground">Export your tasks for backup or import from other tools.</p>
            </div>

            <Tabs defaultValue="export" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="export">Export Data</TabsTrigger>
                    <TabsTrigger value="import">Import Data</TabsTrigger>
                </TabsList>

                {/* EXPORT TAB */}
                <TabsContent value="export">
                    <Card>
                        <CardHeader>
                            <CardTitle>Export Tasks</CardTitle>
                            <CardDescription>Select the format and columns you wish to export.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <Label>Format</Label>
                                <div className="flex gap-4">
                                    <div
                                        className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted ${exportFormat === 'csv' ? 'border-primary ring-1 ring-primary' : ''}`}
                                        onClick={() => setExportFormat('csv')}
                                    >
                                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                                        <div className="flex-1">
                                            <div className="font-medium">CSV</div>
                                            <div className="text-xs text-muted-foreground">For Excel, Numbers, Sheets</div>
                                        </div>
                                    </div>
                                    <div
                                        className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted ${exportFormat === 'json' ? 'border-primary ring-1 ring-primary' : ''}`}
                                        onClick={() => setExportFormat('json')}
                                    >
                                        <FileJson className="w-5 h-5 text-orange-600" />
                                        <div className="flex-1">
                                            <div className="font-medium">JSON</div>
                                            <div className="text-xs text-muted-foreground">Raw data backup</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>Columns (CSV only)</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.keys(selectedColumns).map(col => (
                                        <div key={col} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={col}
                                                checked={selectedColumns[col]}
                                                onCheckedChange={(c) => setSelectedColumns(prev => ({ ...prev, [col]: c }))}
                                                disabled={exportFormat === 'json'}
                                            />
                                            <Label htmlFor={col} className="capitalize cursor-pointer">{{ campaign: 'Projet', project: 'Département', title: 'Titre', status: 'Statut', priority: 'Priorité', description: 'Description', due_date: 'Échéance', created: 'Créé le', context: 'Workspace' }[col] || col.replace('_', ' ')}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button onClick={handleExport} disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    Download Export
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* IMPORT TAB */}
                <TabsContent value="import">
                    <Card>
                        <CardHeader>
                            <CardTitle>Import Tasks</CardTitle>
                            <CardDescription>Upload a CSV or JSON file to import tasks.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4 hover:bg-muted/30 transition-colors">
                                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium">Drag & drop or Click to upload</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Supports .csv and .json</p>
                                </div>
                                <Input
                                    type="file"
                                    accept=".csv,.json"
                                    className="max-w-xs mx-auto"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            {importSummary && (
                                <div className="bg-muted p-4 rounded-lg space-y-4 animate-in fade-in">
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center text-green-600">
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {importSummary.valid} valid tasks
                                        </div>
                                        {importSummary.errors > 0 && (
                                            <div className="flex items-center text-destructive">
                                                <AlertTriangle className="w-4 h-4 mr-2" />
                                                {importSummary.errors} errors (will be skipped)
                                            </div>
                                        )}
                                    </div>

                                    {importErrors.length > 0 && (
                                        <div className="text-xs text-destructive max-h-32 overflow-y-auto border rounded p-2 bg-background">
                                            {importErrors.map((err, i) => (
                                                <div key={i}>Row {err.row}: {err.message}</div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-2">
                                        <Button onClick={executeImport} disabled={loading || importSummary.valid === 0}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Import {importSummary.valid} Tasks
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
