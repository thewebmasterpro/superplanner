import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayoutV3 from '@/components/layout/DashboardLayoutV3'
import TaskListV3 from '@/components/v3/TaskListV3'
import WeeklyChart from '@/components/v3/WeeklyChart'
import { useTasks } from '@/hooks/useTasks'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useUserStore } from '@/stores/userStore'
import { useUIStore } from '@/stores/uiStore'
import { CampaignProgressBar } from '@/components/CampaignProgressBar'
import {
    LayoutDashboard,
    CheckCircle2,
    TrendingUp,
    AlertCircle,
    MoreHorizontal,
    BarChart3,
    Clock,
    Zap,
    BookOpen,
    Globe,
    Edit3,
    Target,
    Pencil,
    Save,
    X,
    RotateCcw,
    Settings,
    Settings2
} from 'lucide-react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { SortableWidget } from '@/components/SortableWidget';
import { toast } from 'react-hot-toast'
import { settingsService } from '@/services/settings.service'

// Legacy Widgets
import PrayerTimes from '@/components/PrayerTimes'
import DailyInspiration from '@/components/DailyInspiration'
import Pomodoro from '@/components/Pomodoro'
import TaskTimer from '@/components/TaskTimer'
import { ScratchpadWidget } from '@/components/ScratchpadWidget'
import { WorldClockWidget } from '@/components/WorldClockWidget'
import { EisenhowerWidget } from '@/components/EisenhowerWidget'

export default function DashboardV3() {
    const navigate = useNavigate()
    const { data: tasks = [], isLoading } = useTasks()
    const { data: campaigns = [] } = useCampaigns()
    const { user, preferences, setPreferences } = useUserStore()
    const { setTaskModalOpen, setModalTask } = useUIStore()

    // Layout State
    const [isEditing, setIsEditing] = useState(false)
    const [layout, setLayout] = useState({
        mainGrid: ['prayerTimes', 'quranVerse', 'focusTools', 'worldClock', 'scratchpad', 'eisenhower', 'activeCampaigns']
    })
    const [activeDragId, setActiveDragId] = useState(null)

    // Sensors for DnD
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    // Sync layout from preferences on mount/change
    useEffect(() => {
        if (preferences?.dashboardLayoutV3) {
            setLayout(preferences.dashboardLayoutV3)
        }
    }, [preferences?.dashboardLayoutV3])

    const totalTasks = tasks?.length || 0
    const completedTasks = tasks?.filter(t => t.status === 'done').length || 0
    const completedToday = tasks?.filter(t => t.status === 'done' && t.completed_at && new Date(t.completed_at).toDateString() === new Date().toDateString()).length || 0
    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const isCritical = (t) => {
        const p = String(t.priority).toLowerCase()
        return (p === 'high' || p === 'urgent' || p === '5' || p === '4') && t.status !== 'done'
    }
    const criticalTasks = tasks?.filter(isCritical).length || 0

    const activeCampaignsData = useMemo(() => {
        const active = campaigns.filter(c => c.status === 'active').slice(0, 3)
        return active.map(c => {
            const campaignTasks = tasks.filter(t => t.campaign_id === c.id || (t.campaign && t.campaign.id === c.id))
            return {
                ...c,
                totalItems: campaignTasks.length,
                completedItems: campaignTasks.filter(t => t.status === 'done').length
            }
        })
    }, [campaigns, tasks])

    const handleDragStart = (event) => {
        setActiveDragId(event.active.id)
    }

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            setLayout((prev) => {
                const oldIndex = prev.mainGrid.indexOf(active.id);
                const newIndex = prev.mainGrid.indexOf(over.id);
                const newMainGrid = arrayMove(prev.mainGrid, oldIndex, newIndex);
                return { ...prev, mainGrid: newMainGrid };
            });
        }
        setActiveDragId(null);
    }

    const saveLayout = async () => {
        try {
            await settingsService.updatePreferences({ dashboardLayoutV3: layout })
            setPreferences({ dashboardLayoutV3: layout })
            setIsEditing(false)
            toast.success('Configuration sauvegardée')
        } catch (e) {
            console.error('Failed to save layout', e)
            toast.error('Erreur lors de la sauvegarde')
        }
    }

    // Widget Definition Wrapper
    const renderWidget = (id, title, icon, component) => {
        const isEnabled = preferences?.dashboardWidgets?.[id] ?? true
        if (!isEnabled && !isEditing) return null

        const isConfigurable = ['worldClock', 'prayerTimes'].includes(id)

        return (
            <SortableWidget key={id} id={id} isEditing={isEditing}>
                <div className={`group/widget card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border transition-all duration-300 h-full ${!isEnabled ? 'opacity-40 grayscale border-dashed border-base-300 dark:border-white/20' : 'border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 hover:shadow-2xl dark:hover:shadow-purple-500/30 dark:hover:bg-black/50'
                    }`}>
                    <div className="card-body p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="card-title text-[11px] font-black opacity-40 uppercase tracking-widest gap-2">
                                <span className="p-1.5 bg-base-200 rounded-lg group-hover/widget:bg-primary group-hover/widget:text-primary-foreground transition-colors leading-none">
                                    {icon}
                                </span>
                                {title}
                            </h2>
                            {isConfigurable && !isEditing && isEnabled && (
                                <button
                                    onClick={() => navigate('/settings')}
                                    className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover/widget:opacity-100 transition-opacity"
                                    title="Configurer dans les paramètres"
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="w-full">
                            {component}
                        </div>
                    </div>
                </div>
            </SortableWidget>
        )
    }

    // Widget Mapper
    const WIDGET_MAP = {
        prayerTimes: {
            title: 'Prières',
            icon: <Clock className="w-4 h-4" />,
            component: <PrayerTimes />
        },
        quranVerse: {
            title: 'Inspiration',
            icon: <BookOpen className="w-4 h-4" />,
            component: <DailyInspiration />
        },
        focusTools: {
            title: 'Focus & Temps',
            icon: <Zap className="w-4 h-4" />,
            component: (
                <div className="space-y-4">
                    <Pomodoro />
                    <TaskTimer tasks={tasks} />
                </div>
            )
        },
        worldClock: {
            title: 'Horloge Mondiale',
            icon: <Globe className="w-4 h-4" />,
            component: <WorldClockWidget />
        },
        scratchpad: {
            title: 'Bloc-notes',
            icon: <Edit3 className="w-4 h-4" />,
            component: <ScratchpadWidget />
        },
        eisenhower: {
            title: 'Matrice Eisenhower',
            icon: <Target className="w-4 h-4" />,
            component: <EisenhowerWidget tasks={tasks} />
        },
        activeCampaigns: {
            title: 'Projets Actifs',
            icon: <Target className="w-4 h-4" />,
            component: (
                <div className="space-y-5">
                    {activeCampaignsData.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Aucun projet actif</p>
                    ) : (
                        activeCampaignsData.map(campaign => (
                            <CampaignProgressBar
                                key={campaign.id}
                                label={campaign.name}
                                total={campaign.totalItems}
                                completed={campaign.completedItems}
                                color={campaign.color}
                            />
                        ))
                    )}
                </div>
            )
        }
    }

    return (
        <DashboardLayoutV3>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display">Bonjour, {user?.name || 'Utilisateur'} 👋</h1>
                    <p className="text-muted-foreground">Voici l'état actuel de votre productivité.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} className="btn btn-ghost shadow-none transition-transform hover:scale-105 active:scale-95">
                                Annuler
                            </button>
                            <button onClick={saveLayout} className="btn btn-primary gap-2 shadow-none transition-transform hover:scale-105 active:scale-95">
                                <Save className="w-5 h-5" />
                                Enregistrer
                            </button>
                        </>
                    ) : (
                        <button data-tour="dashboard-edit-widgets" onClick={() => setIsEditing(true)} className="btn gap-2 shadow-none transition-transform hover:scale-105 active:scale-95">
                            <Pencil className="w-5 h-5" />
                            Éditer Widgets
                        </button>
                    )}
                    <button
                        onClick={() => { setModalTask({ type: 'task' }); setTaskModalOpen(true); }}
                        className="btn gap-2 shadow-none transition-transform hover:scale-105 active:scale-95"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        Nouvelle Tâche
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <section id="stats-section" data-tour="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger-fast">
                <div className="stats shadow-lg bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 dark:hover:shadow-purple-500/30 transition-all">
                    <div className="stat">
                        <div className="stat-title">Total Tâches</div>
                        <div className="stat-value text-primary font-display">{isLoading ? '...' : totalTasks}</div>
                    </div>
                </div>
                <div className="stats shadow-lg bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 dark:hover:shadow-purple-500/30 transition-all">
                    <div className="stat">
                        <div className="stat-title">Complétées</div>
                        <div className="stat-value text-secondary font-display">{isLoading ? '...' : completedTasks}</div>
                        <div className="stat-desc text-success">↗︎ {completedToday} aujourd'hui</div>
                    </div>
                </div>
                <div className="stats shadow-lg bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 dark:hover:shadow-purple-500/30 transition-all">
                    <div className="stat">
                        <div className="stat-title">Productivité</div>
                        <div className="stat-value text-accent font-display">{isLoading ? '...' : `${productivity}%`}</div>
                    </div>
                </div>
                <div className="stats shadow-lg bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 dark:hover:shadow-purple-500/30 transition-all">
                    <div className="stat">
                        <div className="stat-title">Critiques</div>
                        <div className="stat-value text-error font-display">{isLoading ? '...' : criticalTasks}</div>
                        <div className="stat-desc text-error font-bold italic">Actions requises</div>
                    </div>
                </div>
            </section>

            {/* Main Content: Chart + Tasks */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-slide-up delay-200">
                <section data-tour="dashboard-chart" className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 dark:hover:shadow-purple-500/30 transition-all">
                    <div className="card-body p-6">
                        <h2 className="card-title text-lg font-display mb-4">
                            <BarChart3 className="w-5 h-5 text-accent" /> Productivité Hebdo
                        </h2>
                        {tasks ? <WeeklyChart tasks={tasks} /> : <div className="skeleton h-[250px] w-full"></div>}
                    </div>
                </section>

                <section id="task-section" data-tour="dashboard-tasks" className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 dark:hover:shadow-purple-500/30 transition-all xl:col-span-2 overflow-visible">
                    <div className="card-body p-6">
                        <h2 className="card-title text-lg font-display mb-4">Suivi des Tâches</h2>
                        <TaskListV3 />
                    </div>
                </section>
            </div>

            {/* Dynamic Widgets Section */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div data-tour="dashboard-widgets" className="mt-8 animate-slide-up delay-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold font-display px-1 flex items-center gap-2">
                            <Zap className="w-6 h-6 text-warning" /> Vos Outils & Widgets
                        </h3>
                    </div>

                    <SortableContext items={layout.mainGrid} strategy={rectSortingStrategy}>
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2 rounded-xl border border-dashed transition-all animate-stagger ${isEditing ? 'border-primary/20 bg-base-200/50' : 'border-transparent'}`}>
                            {layout.mainGrid.map((id) => {
                                const widget = WIDGET_MAP[id]
                                if (!widget) return null
                                return renderWidget(id, widget.title, widget.icon, widget.component)
                            })}
                        </div>
                    </SortableContext>
                </div>

                <DragOverlay adjustScale={true}>
                    {activeDragId ? (
                        <div className="opacity-80 scale-105 shadow-2xl rounded-2xl overflow-hidden pointer-events-none">
                            {(() => {
                                const widget = WIDGET_MAP[activeDragId]
                                if (!widget) return null
                                return (
                                    <div className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border border-primary/20 dark:border-white/20 shadow-xl">
                                        <div className="card-body p-5">
                                            <h2 className="card-title text-sm font-bold opacity-70 mb-2 gap-2 uppercase tracking-tight">
                                                {widget.icon} {widget.title}
                                            </h2>
                                            <div className="w-full">
                                                {widget.component}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

        </DashboardLayoutV3>
    )
}
