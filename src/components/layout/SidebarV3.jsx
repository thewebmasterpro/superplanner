import { useNavigate, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    CheckSquare,
    BarChart,
    Calendar,
    Users,
    Settings,
    LogOut
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { GlobalSearch } from '../v3/GlobalSearch'

export default function SidebarV3() {
    const navigate = useNavigate()
    const location = useLocation()

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: CheckSquare, label: 'Mes Tâches', path: '/tasks' },
        { icon: Calendar, label: 'Calendrier', path: '/calendar' },
        { icon: Users, label: 'Contacts', path: '/contacts' },
        { icon: BarChart, label: 'Statistiques', path: '/stats' },
        { icon: Settings, label: 'Paramètres', path: '/settings' },
    ]

    return (
        <aside className="md:col-span-3 lg:col-span-2 card bg-base-100 shadow-xl h-full min-h-[500px]">
            <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <LayoutDashboard className="text-primary w-8 h-8" />
                    <span className="font-bold text-xl font-display tracking-tight">Hagen Tasks</span>
                    <span className="badge badge-primary badge-xs align-top">V3</span>
                </div>

                <div className="px-2 mb-6">
                    <GlobalSearch />
                </div>

                <ul className="menu bg-base-100 w-full p-0 gap-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path

                        return (
                            <li key={item.path}>
                                <a
                                    onClick={() => navigate(item.path)}
                                    className={cn(
                                        "flex items-center gap-3 py-3 font-medium",
                                        isActive ? "active font-bold" : ""
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.label}
                                </a>
                            </li>
                        )
                    })}
                </ul>

                <div className="mt-auto pt-4 border-t border-base-200">
                    <button className="btn btn-ghost btn-block justify-start gap-3 text-error">
                        <LogOut className="w-5 h-5" />
                        Déconnexion
                    </button>
                </div>
            </div>
        </aside>
    )
}
