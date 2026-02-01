import { useEffect } from 'react'
import DashboardLayoutV3 from '../components/layout/DashboardLayoutV3'
import TaskListV3 from '../components/v3/TaskListV3'
import { useTasks } from '../hooks/useTasks'
import { LayoutDashboard, CheckCircle2, TrendingUp, AlertCircle, MoreHorizontal } from 'lucide-react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export default function DashboardV3() {
    const { data: tasks, isLoading } = useTasks()

    useEffect(() => {
        // Check if user has seen tour
        const hasSeenTour = localStorage.getItem('has_seen_v3_tour')
        if (!hasSeenTour) {
            const driverObj = driver({
                showProgress: true,
                animate: true,
                steps: [
                    { element: 'aside', popover: { title: 'Navigation', description: 'Accédez à vos outils, tâches et paramètres ici.' } },
                    { element: '#stats-section', popover: { title: 'Vue d\'ensemble', description: 'Suivez vos métriques clés en temps réel.' } },
                    { element: '#task-section', popover: { title: 'Gestion des Tâches', description: 'Gérez vos tâches efficacement avec une interface modernisée.' } }
                ],
                onDestroyed: () => {
                    localStorage.setItem('has_seen_v3_tour', 'true')
                }
            });

            // Small delay to ensure render
            setTimeout(() => driverObj.drive(), 1000)
        }
    }, [])

    // Calculate Real Stats
    const totalTasks = tasks?.length || 0
    const completedTasks = tasks?.filter(t => t.status === 'done').length || 0
    const completedToday = tasks?.filter(t => t.status === 'done' && new Date(t.completed_at).toDateString() === new Date().toDateString()).length || 0

    // Calculate productivity (percentage of completed vs total active+completed)
    // Or maybe "velocity"
    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const criticalTasks = tasks?.filter(t => (t.priority === 'high' || t.priority === 'urgent' || t.priority === '5') && t.status !== 'done').length || 0

    return (
        <DashboardLayoutV3>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display">Bonjour, Anouar 👋</h1>
                    <p className="text-muted-foreground">Voici ce qui se passe aujourd'hui.</p>
                </div>
                <button className="btn btn-primary gap-2 shadow-lg hover:shadow-primary/20 transition-all">
                    <CheckCircle2 className="w-4 h-4" />
                    Nouvelle Tâche
                </button>
            </div>

            {/* Stats Section */}
            <section id="stats-section" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stats shadow bg-base-100 hover:scale-[1.02] transition-transform duration-200">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <LayoutDashboard className="w-8 h-8 opacity-20" />
                        </div>
                        <div className="stat-title">Total Tâches</div>
                        <div className="stat-value text-primary font-display">{isLoading ? '...' : totalTasks}</div>
                        <div className="stat-desc">Actives et terminées</div>
                    </div>
                </div>

                <div className="stats shadow bg-base-100 hover:scale-[1.02] transition-transform duration-200">
                    <div className="stat">
                        <div className="stat-figure text-secondary">
                            <CheckCircle2 className="w-8 h-8 opacity-20" />
                        </div>
                        <div className="stat-title">Complétées</div>
                        <div className="stat-value text-secondary font-display">{isLoading ? '...' : completedTasks}</div>
                        <div className="stat-desc text-success">↗︎ {completedToday} (aujourd'hui)</div>
                    </div>
                </div>

                <div className="stats shadow bg-base-100 hover:scale-[1.02] transition-transform duration-200">
                    <div className="stat">
                        <div className="stat-figure text-accent">
                            <TrendingUp className="w-8 h-8 opacity-20" />
                        </div>
                        <div className="stat-title">Productivité</div>
                        <div className="stat-value text-accent font-display">{isLoading ? '...' : `${productivity}%`}</div>
                        <div className="stat-desc">Taux de complétion global</div>
                    </div>
                </div>

                <div className="stats shadow bg-base-100 hover:scale-[1.02] transition-transform duration-200">
                    <div className="stat">
                        <div className="stat-figure text-error">
                            <AlertCircle className="w-8 h-8 opacity-20" />
                        </div>
                        <div className="stat-title">Critiques</div>
                        <div className="stat-value text-error font-display">{isLoading ? '...' : criticalTasks}</div>
                        <div className="stat-desc text-error font-bold">À traiter d'urgence</div>
                    </div>
                </div>
            </section>

            {/* Tasks Section */}
            <section id="task-section" className="card bg-base-100 shadow-xl overflow-visible">
                <div className="card-body p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="card-title text-lg font-display">Tâches en cours</h2>
                        <div className="flex gap-2">
                            <button className="btn btn-sm btn-ghost">Voir tout</button>
                            <button className="btn btn-sm btn-ghost btn-square">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Task List Component */}
                    <TaskListV3 />
                </div>
            </section>
        </DashboardLayoutV3>
    )
}
