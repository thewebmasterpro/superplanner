import { useState, useEffect } from 'react'
import { ArrowLeft, Clock, Calendar, CheckSquare, BarChart3, MoreVertical, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { campaignsService } from '../services/campaigns.service'
import { tasksService } from '../services/tasks.service'
import { format } from 'date-fns'
import { useUIStore } from '../stores/uiStore'

export function CampaignDetails({ campaignId, onBack, onEdit, lastUpdated }) {
    const [campaign, setCampaign] = useState(null)
    const [loading, setLoading] = useState(true)
    const [tasks, setTasks] = useState([])
    const [meetings, setMeetings] = useState([])
    const [stats, setStats] = useState({ total: 0, completed: 0, progress: 0 })
    // stats declared dynamically above or below
    const { isTaskModalOpen, setTaskModalOpen, setModalTask } = useUIStore()

    // Refresh when modal closes
    useEffect(() => {
        if (!isTaskModalOpen) {
            loadCampaignDetails()
        }
    }, [isTaskModalOpen])

    useEffect(() => {
        loadCampaignDetails()
    }, [campaignId, lastUpdated]) // Reload when ID OR lastUpdated changes

    const loadCampaignDetails = async () => {
        setLoading(true)
        try {
            // 1. Fetch Campaign Info
            const camp = await campaignsService.getOne(campaignId)

            // 2. Fetch Tasks & Meetings for this campaign
            const items = await tasksService.getByCampaign(campaignId)

            const tasksList = items.filter(i => i.type !== 'meeting')
            const meetingsList = items.filter(i => i.type === 'meeting')

            // 3. Calc Stats
            const total = tasksList.length
            const completed = tasksList.filter(t => t.status === 'done').length
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0
            setStats({ total, completed, progress })

            setCampaign(camp)
            setTasks(tasksList)
            setMeetings(meetingsList)

        } catch (error) {
            console.error('Error loading campaign details:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="text-center py-12">Loading details...</div>
    if (!campaign) return <div className="text-center py-12">Campaign not found</div>

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2 text-muted-foreground">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Retour aux Projets
                    </Button>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        {campaign.name}
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                        </Badge>
                    </h1>
                    {campaign.description && (
                        <p className="text-muted-foreground mt-1 max-w-2xl">{campaign.description}</p>
                    )}
                </div>
                <div className="flex gap-2 items-start shrink-0">
                    <Button variant="outline" onClick={() => onEdit(campaign)}>
                        <Edit2 className="w-4 h-4 mr-2" /> Modifier le Projet
                    </Button>
                    <Button variant="outline" onClick={() => { setModalTask({ campaign_id: campaign.id, type: 'task' }); setTaskModalOpen(true) }}>
                        + New Task
                    </Button>
                    <Button onClick={() => { setModalTask({ campaign_id: campaign.id, type: 'meeting' }); setTaskModalOpen(true) }}>
                        + New Meeting
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.progress}%</div>
                        <Progress value={stats.progress} className="h-2 mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completed} / {stats.total}</div>
                        <p className="text-xs text-muted-foreground">completed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Meetings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{meetings.length}</div>
                        <p className="text-xs text-muted-foreground">scheduled</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium">{format(new Date(campaign.start_date || Date.now()), 'MMM d')} - {format(new Date(campaign.end_date || Date.now()), 'MMM d, yyyy')}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {Math.ceil((new Date(campaign.end_date || Date.now()) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Meetings Column */}
                <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" /> Meetings
                    </h3>
                    {meetings.length === 0 ? (
                        <div className="border border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground">
                            No meetings scheduled.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {meetings.map(meeting => (
                                <Card key={meeting.id} className="cursor-pointer hover:shadow-sm transition-all" onClick={() => { setModalTask(meeting); setTaskModalOpen(true) }}>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium line-clamp-1">{meeting.title}</h4>
                                            <Badge variant="outline" className="text-[10px]">{format(new Date(meeting.due_date || meeting.created || Date.now()), 'MMM d')}</Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3" />
                                            {meeting.scheduled_time ? format(new Date(meeting.scheduled_time), 'h:mm a') : 'Unscheduled'}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tasks Column */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-primary" /> Tasks
                    </h3>
                    {tasks.length === 0 ? (
                        <div className="border border-dashed rounded-lg p-12 text-center text-muted-foreground">
                            Aucune tâche liée à ce projet.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tasks.map(task => (
                                <div key={task.id}
                                    className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                                    onClick={() => { setModalTask(task); setTaskModalOpen(true) }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full border ${task.status === 'done' ? 'bg-green-500 border-green-600' : 'border-muted-foreground'}`}></div>
                                        <div>
                                            <p className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                                            <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                                                {task.due_date && <span>Due {format(new Date(task.due_date), 'MMM d')}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {task.priority === 'high' && <Badge variant="destructive" className="text-[10px] h-5">High</Badge>}
                                        <Badge variant="secondary" className="capitalize text-[10px] h-5">{task.status.replace('_', ' ')}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Task Modal is global */}
        </div>
    )
}
