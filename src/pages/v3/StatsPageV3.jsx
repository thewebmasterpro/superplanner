import { useState, useMemo } from 'react'
import DashboardLayoutV3 from '../../components/layout/DashboardLayoutV3'
import { CheckCircle2, TrendingUp, AlertCircle, LayoutDashboard } from 'lucide-react'
import WeeklyChart from '../../components/v3/WeeklyChart'
import { useTasks } from '../../hooks/useTasks'

export default function StatsPageV3() {
    const { data: tasks = [], isLoading } = useTasks()

    // Calculate Extended Stats
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'done').length
    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Priority Breakdown
    const high = tasks.filter(t => t.priority === 'high').length
    const medium = tasks.filter(t => t.priority === 'medium').length
    const low = tasks.filter(t => t.priority === 'low').length

    return (
        <DashboardLayoutV3>
            <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                <div>
                    <h1 className="text-3xl font-bold font-display flex items-center gap-2">
                        <TrendingUp className="w-8 h-8 text-primary" />
                        Statistiques
                    </h1>
                    <p className="text-muted-foreground">Analyse détaillée de votre productivité.</p>
                </div>

                {/* KPI Grid */}
                <div data-tour="stats-kpis" className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-stagger-fast">
                    <div className="stats shadow bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 dark:hover:shadow-purple-500/30 transition-all">
                        <div className="stat">
                            <div className="stat-figure text-primary">
                                <LayoutDashboard className="w-8 h-8 opacity-20" />
                            </div>
                            <div className="stat-title">Total Tâches</div>
                            <div className="stat-value text-primary font-display">{totalTasks}</div>
                        </div>
                    </div>
                    <div className="stats shadow bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 dark:hover:shadow-purple-500/30 transition-all">
                        <div className="stat">
                            <div className="stat-figure text-secondary">
                                <CheckCircle2 className="w-8 h-8 opacity-20" />
                            </div>
                            <div className="stat-title">Complétées</div>
                            <div className="stat-value text-secondary font-display">{completedTasks}</div>
                        </div>
                    </div>
                    <div className="stats shadow bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 dark:hover:shadow-purple-500/30 transition-all">
                        <div className="stat">
                            <div className="stat-figure text-accent">
                                <TrendingUp className="w-8 h-8 opacity-20" />
                            </div>
                            <div className="stat-title">Productivité</div>
                            <div className="stat-value text-accent font-display">{productivity}%</div>
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div data-tour="stats-chart" className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 dark:hover:shadow-purple-500/30 transition-all animate-slide-up delay-200">
                    <div className="card-body">
                        <h2 className="card-title">Tendance Hebdomadaire</h2>
                        {tasks.length > 0 ? <WeeklyChart tasks={tasks} /> : <div className="skeleton h-[300px] w-full"></div>}
                    </div>
                </div>

                {/* Breakdown Section */}
                <div data-tour="stats-breakdown" className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up delay-300">
                    <div className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 dark:hover:shadow-purple-500/30 transition-all">
                        <div className="card-body">
                            <h2 className="card-title">Par Priorité</h2>
                            <div className="space-y-4 mt-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-error font-medium">Haute</span>
                                        <span>{high}</span>
                                    </div>
                                    <progress className="progress progress-error w-full" value={high} max={totalTasks}></progress>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-warning font-medium">Moyenne</span>
                                        <span>{medium}</span>
                                    </div>
                                    <progress className="progress progress-warning w-full" value={medium} max={totalTasks}></progress>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-success font-medium">Basse</span>
                                        <span>{low}</span>
                                    </div>
                                    <progress className="progress progress-success w-full" value={low} max={totalTasks}></progress>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayoutV3>
    )
}
