import { useEffect } from 'react'
import DashboardLayoutV3 from '../components/layout/DashboardLayoutV3'
import { LayoutDashboard, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export default function DashboardV3() {

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

    return (
        <DashboardLayoutV3>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Bonjour, Anouar 👋</h1>
                    <p className="text-muted-foreground">Voici ce qui se passe aujourd'hui.</p>
                </div>
                <button className="btn btn-primary gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Nouvelle Tâche
                </button>
            </div>

            {/* Stats Section */}
            <section id="stats-section" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stats shadow bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <LayoutDashboard className="w-8 h-8 opacity-50" />
                        </div>
                        <div className="stat-title">Total Tâches</div>
                        <div className="stat-value text-primary">24</div>
                        <div className="stat-desc">↗︎ 2 (aujourd'hui)</div>
                    </div>
                </div>

                <div className="stats shadow bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-secondary">
                            <CheckCircle2 className="w-8 h-8 opacity-50" />
                        </div>
                        <div className="stat-title">Complétées</div>
                        <div className="stat-value text-secondary">12</div>
                        <div className="stat-desc">↘︎ 1 (cette semaine)</div>
                    </div>
                </div>

                <div className="stats shadow bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-accent">
                            <TrendingUp className="w-8 h-8 opacity-50" />
                        </div>
                        <div className="stat-title">Productivité</div>
                        <div className="stat-value text-accent">86%</div>
                        <div className="stat-desc">↗︎ 5% (vs hier)</div>
                    </div>
                </div>

                <div className="stats shadow bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-error">
                            <AlertCircle className="w-8 h-8 opacity-50" />
                        </div>
                        <div className="stat-title">Critiques</div>
                        <div className="stat-value text-error">3</div>
                        <div className="stat-desc">À traiter d'urgence</div>
                    </div>
                </div>
            </section>

            {/* Tasks Section */}
            <section id="task-section" className="card bg-base-100 shadow-xl">
                <div className="card-body p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="card-title text-lg">Tâches en cours</h2>
                        <div className="flex gap-2">
                            <button className="btn btn-sm btn-ghost">Voir tout</button>
                        </div>
                    </div>

                    {/* Placeholder for Task List - mimicking the HTMX slot from prompt */}
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Tâche</th>
                                    <th>Priorité</th>
                                    <th>Statut</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3].map((i) => (
                                    <tr key={i} className="hover">
                                        <th>
                                            <label>
                                                <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" />
                                            </label>
                                        </th>
                                        <td>
                                            <div className="font-bold">Design Dashboard V3</div>
                                            <div className="text-xs opacity-50">UI/UX improvements</div>
                                        </td>
                                        <td>
                                            <div className="badge badge-error gap-2">Haute</div>
                                        </td>
                                        <td>En cours</td>
                                        <td>01 Fév</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </DashboardLayoutV3>
    )
}
