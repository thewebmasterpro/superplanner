import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    CheckSquare,
    BarChart,
    Calendar,
    Users,
    Contact,
    Layers,
    Video,
    Archive,
    Trash2,
    Settings,
    LogOut,
    Globe,
    ChevronDown,
    Check,
    Trophy
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { GlobalSearch } from '../v3/GlobalSearch'
import pb from '../../lib/pocketbase'
import { useUserStore } from '../../stores/userStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'

export default function SidebarV3() {
    const navigate = useNavigate()
    const location = useLocation()
    const logout = useUserStore((s) => s.logout)
    const { workspaces, activeWorkspaceId, setActiveWorkspace, loadWorkspaces } = useWorkspaceStore()
    const [wsOpen, setWsOpen] = useState(false)
    const wsRef = useRef(null)

    useEffect(() => { loadWorkspaces() }, [])

    // Close dropdown on outside click
    useEffect(() => {
        if (!wsOpen) return
        const handler = (e) => {
            if (wsRef.current && !wsRef.current.contains(e.target)) setWsOpen(false)
        }
        window.addEventListener('mousedown', handler)
        return () => window.removeEventListener('mousedown', handler)
    }, [wsOpen])

    const activeWs = workspaces.find(w => w.id === activeWorkspaceId)

    const handleLogout = () => {
        pb.authStore.clear()
        logout()
        window.location.href = '/'
    }

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: CheckSquare, label: 'Mes Tâches', path: '/tasks' },
        { icon: Calendar, label: 'Calendrier', path: '/calendar' },
        { icon: Video, label: 'Réunions', path: '/meetings' },
        { icon: Contact, label: 'Contacts', path: '/contacts' },
        { icon: Layers, label: 'Projets', path: '/campaigns' },
        { icon: Users, label: 'Équipe', path: '/team' },
        { icon: BarChart, label: 'Statistiques', path: '/stats' },
        { icon: Trophy, label: 'Récompenses', path: '/gamification' },
        { icon: Archive, label: 'Archives', path: '/archive' },
        { icon: Trash2, label: 'Corbeille', path: '/trash' },
        { icon: Settings, label: 'Paramètres', path: '/settings' },
    ]

    return (
        <aside data-tour="sidebar-nav" className="md:col-span-3 lg:col-span-2 card bg-base-100 dark:backdrop-blur-xl dark:bg-black/50 shadow-xl dark:shadow-purple-500/20 border-r dark:border-white/20 h-full min-h-[500px]">
            <div className="card-body p-4">
                <div
                    className="flex items-center gap-2 mb-8 px-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate('/')}
                >
                    <LayoutDashboard className="text-primary w-8 h-8" />
                    <span className="font-bold text-xl font-display tracking-tight">Hagen Tasks</span>
                    <span className="badge badge-primary badge-xs align-top">V3</span>
                </div>

                <div className="px-2 mb-4">
                    <GlobalSearch />
                </div>

                {/* Workspace selector */}
                <div className="px-2 mb-4 relative" ref={wsRef}>
                    <button
                        onClick={() => setWsOpen(!wsOpen)}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-base-200/40 hover:bg-base-200/70 transition-colors text-sm"
                    >
                        {activeWs ? (
                            <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: activeWs.color || '#6366f1' }}
                            />
                        ) : (
                            <Globe className="w-3.5 h-3.5 opacity-50 shrink-0" />
                        )}
                        <span className="truncate font-medium">
                            {activeWs ? activeWs.name : 'Vue globale'}
                        </span>
                        <ChevronDown className={cn(
                            "w-3.5 h-3.5 opacity-40 ml-auto shrink-0 transition-transform",
                            wsOpen && "rotate-180"
                        )} />
                    </button>

                    {wsOpen && (
                        <div className="absolute left-2 right-2 top-full mt-1 z-50 rounded-xl border border-base-300 bg-base-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            <div className="p-1">
                                <button
                                    onClick={() => { setActiveWorkspace(null); setWsOpen(false) }}
                                    className={cn(
                                        "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-base-200/60",
                                        !activeWorkspaceId && "bg-base-200/50 font-semibold"
                                    )}
                                >
                                    <Globe className="w-3.5 h-3.5 opacity-50" />
                                    <span>Vue globale</span>
                                    {!activeWorkspaceId && <Check className="w-3.5 h-3.5 ml-auto opacity-50" />}
                                </button>
                                {workspaces.length > 0 && (
                                    <div className="border-t border-base-200 my-1" />
                                )}
                                {workspaces.map(w => (
                                    <button
                                        key={w.id}
                                        onClick={() => { setActiveWorkspace(w.id); setWsOpen(false) }}
                                        className={cn(
                                            "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-base-200/60",
                                            activeWorkspaceId === w.id && "bg-base-200/50 font-semibold"
                                        )}
                                    >
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: w.color || '#6366f1' }}
                                        />
                                        <span className="truncate">{w.name}</span>
                                        {activeWorkspaceId === w.id && <Check className="w-3.5 h-3.5 ml-auto opacity-50" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
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
                    <button className="btn btn-error btn-ghost btn-block justify-start gap-3" onClick={handleLogout}>
                        <LogOut className="w-5 h-5" />
                        Déconnexion
                    </button>
                </div>
            </div>
        </aside>
    )
}
