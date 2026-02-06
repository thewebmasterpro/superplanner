import DashboardLayoutV3 from '../../components/layout/DashboardLayoutV3'
import { Settings as SettingsIcon, Save, AlertTriangle, Bell, Monitor, Database, Moon, Info, Plus, X, Layout, LayoutDashboard, Building, FolderKanban, Palette, Tag as TagIcon, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useUserStore } from '../../stores/userStore'
import { useTelegramNotifications } from '../../hooks/useTelegramNotifications'
import { settingsService } from '../../services/settings.service'
import { DataBackupSettings } from '../../components/settings/DataBackupSettings'
import { WorkspaceManager } from '../../components/WorkspaceManager'
import { CategoryManager } from '../../components/CategoryManager'
import { ProjectManager } from '../../components/ProjectManager'
import { TagManager } from '../../components/TagManager'
import { useTheme } from '../../components/ThemeProvider'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input as ShadcnInput } from '@/components/ui/input'
import toast from 'react-hot-toast'
import pb from '../../lib/pocketbase'

export default function SettingsPageV3() {
    const { preferences, setPreferences } = useUserStore()
    const { sendTestNotification } = useTelegramNotifications()
    const [activeTab, setActiveTab] = useState('profil')
    const { theme, setTheme } = useTheme()

    // Profile state
    const [userProfile, setUserProfile] = useState({
        name: '',
        email: '',
        username: ''
    })
    const [profileLoading, setProfileLoading] = useState(false)

    // Accordion state for Configuration tab
    const [openSections, setOpenSections] = useState({
        workspaces: false,
        projects: false,
        categories: false,
        tags: false
    })

    // Dialog state for danger zone
    const [showResetDialog, setShowResetDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')

    // Load user profile on mount
    useEffect(() => {
        const user = pb.authStore.model
        if (user) {
            setUserProfile({
                name: user.name || '',
                email: user.email || '',
                username: user.username || ''
            })
        }
    }, [])

    const toggleSection = (key) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const themes = ["light", "dark"]

    const handleTestTelegram = async () => {
        const result = await sendTestNotification()
        if (result.success) {
            toast.success('Test notification sent successfully! Check your Telegram.')
        } else {
            toast.error(`Failed to send notification: ${result.error}`)
        }
    }

    const savePreferences = async () => {
        try {
            const payload = {
                telegram: preferences.telegram,
                dashboardWidgets: preferences.dashboardWidgets,
                prayerLocation: preferences.prayerLocation,
                spotify_playlist_url: preferences.spotify_playlist_url,
                world_clock_cities: preferences.world_clock_cities
            }
            await settingsService.updatePreferences(payload)
            toast.success('Preferences saved successfully!')
        } catch (e) {
            console.error(e)
            toast.error('Failed to save: ' + e.message)
        }
    }

    const toggleWidget = (id) => {
        setPreferences({
            dashboardWidgets: {
                ...(preferences?.dashboardWidgets || {}),
                [id]: !(preferences?.dashboardWidgets?.[id] ?? true)
            }
        })
    }

    const handleResetApp = () => setShowResetDialog(true)

    const executeResetApp = () => {
        localStorage.clear()
        toast.success('Application réinitialisée.')
        window.location.href = '/'
    }

    const handleDeleteAccount = () => {
        setDeleteConfirmText('')
        setShowDeleteDialog(true)
    }

    const executeDeleteAccount = async () => {
        try {
            await pb.collection('users').delete(pb.authStore.model.id)
            pb.authStore.clear()
            toast.success('Compte supprimé.')
            window.location.href = '/'
        } catch (e) {
            console.error(e)
            toast.error('Erreur lors de la suppression : ' + e.message)
        }
    }

    const saveProfile = async () => {
        setProfileLoading(true)
        try {
            const userId = pb.authStore.model.id
            await pb.collection('users').update(userId, {
                name: userProfile.name,
                username: userProfile.username
            })
            // Reload auth to get updated data
            await pb.collection('users').authRefresh()
            toast.success('Profil mis à jour!', { icon: '✅' })
        } catch (e) {
            console.error(e)
            toast.error('Erreur lors de la mise à jour: ' + e.message)
        } finally {
            setProfileLoading(false)
        }
    }

    return (
        <DashboardLayoutV3>
            <div className="flex flex-col gap-6 w-full pb-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-display flex items-center gap-2 text-primary">
                            <SettingsIcon className="w-8 h-8" />
                            Paramètres
                        </h1>
                        <p className="text-muted-foreground">Gérez vos préférences et données système.</p>
                    </div>
                    <button
                        data-tour="settings-save"
                        onClick={savePreferences}
                        className="btn btn-primary btn-sm shadow-lg gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Sauvegarder
                    </button>
                </div>

                {/* Tabs: Profil > Apparence > Configuration > Dashboard > Préférences > Données */}
                <div data-tour="settings-tabs" className="bg-base-200/30 dark:backdrop-blur-xl dark:bg-black/30 border border-base-300 dark:border-white/20 p-1 mb-2 rounded-xl flex overflow-x-auto gap-1">
                    <button
                        className={`btn btn-sm flex-1 gap-2 ${activeTab === 'profil' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('profil')}
                    >
                        <User className="w-4 h-4" /> Profil
                    </button>
                    <button
                        className={`btn btn-sm flex-1 gap-2 ${activeTab === 'apparence' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('apparence')}
                    >
                        <Monitor className="w-4 h-4" /> Apparence
                    </button>
                    <button
                        className={`btn btn-sm flex-1 gap-2 ${activeTab === 'configuration' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('configuration')}
                    >
                        <Layout className="w-4 h-4" /> Configuration
                    </button>
                    <button
                        className={`btn btn-sm flex-1 gap-2 ${activeTab === 'widgets' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('widgets')}
                    >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </button>
                    <button
                        className={`btn btn-sm flex-1 gap-2 ${activeTab === 'preferences' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('preferences')}
                    >
                        <Bell className="w-4 h-4" /> Préférences
                    </button>
                    <button
                        className={`btn btn-sm flex-1 gap-2 ${activeTab === 'data' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('data')}
                    >
                        <Database className="w-4 h-4" /> Données
                    </button>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* ─── Tab 0: Profil ─── */}
                    {activeTab === 'profil' && (
                        <div className="space-y-6 animate-stagger">
                            <div className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all">
                                <div className="card-body">
                                    <h2 className="card-title flex gap-2">
                                        <User className="w-5 h-5 text-primary" /> Informations du Profil
                                    </h2>
                                    <p className="text-sm opacity-70 mb-4">Gérez vos informations personnelles.</p>

                                    <div className="space-y-4">
                                        {/* Name */}
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-semibold">Nom complet</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="input input-bordered w-full"
                                                value={userProfile.name}
                                                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                                                placeholder="Votre nom"
                                            />
                                        </div>

                                        {/* Username */}
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-semibold">Nom d'utilisateur</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="input input-bordered w-full"
                                                value={userProfile.username}
                                                onChange={(e) => setUserProfile({ ...userProfile, username: e.target.value })}
                                                placeholder="votre_nom_utilisateur"
                                            />
                                            <label className="label">
                                                <span className="label-text-alt opacity-50">Utilisé pour vous identifier dans l'application</span>
                                            </label>
                                        </div>

                                        {/* Email (read-only) */}
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-semibold">Adresse email</span>
                                            </label>
                                            <input
                                                type="email"
                                                className="input input-bordered w-full bg-base-200 cursor-not-allowed"
                                                value={userProfile.email}
                                                disabled
                                            />
                                            <label className="label">
                                                <span className="label-text-alt opacity-50">L'email ne peut pas être modifié ici</span>
                                            </label>
                                        </div>

                                        {/* Save Button */}
                                        <div className="flex justify-end pt-4">
                                            <button
                                                onClick={saveProfile}
                                                disabled={profileLoading}
                                                className={`btn btn-primary gap-2 ${profileLoading ? 'loading' : ''}`}
                                            >
                                                {!profileLoading && <Save className="w-4 h-4" />}
                                                {profileLoading ? 'Enregistrement...' : 'Enregistrer le profil'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Info */}
                            <div className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-primary/10 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all">
                                <div className="card-body">
                                    <h2 className="card-title flex gap-2">
                                        <Info className="w-5 h-5 text-info" /> Informations du Compte
                                    </h2>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between py-2 border-b border-base-300">
                                            <span className="opacity-70">ID Utilisateur</span>
                                            <span className="font-mono font-semibold">{pb.authStore.model?.id}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-base-300">
                                            <span className="opacity-70">Email vérifié</span>
                                            <span className={`badge ${pb.authStore.model?.verified ? 'badge-success' : 'badge-warning'}`}>
                                                {pb.authStore.model?.verified ? 'Oui' : 'Non'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="opacity-70">Date de création</span>
                                            <span className="font-semibold">
                                                {new Date(pb.authStore.model?.created).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Tab 1: Apparence ─── */}
                    {activeTab === 'apparence' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-stagger">
                            <div data-tour="settings-theme" className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all">
                                <div className="card-body">
                                    <h2 className="card-title flex gap-2">
                                        <Moon className="w-5 h-5 text-secondary" /> Thème Visuel
                                    </h2>
                                    <p className="text-sm opacity-70">Choisissez l'apparence générale de l'interface.</p>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar p-1">
                                        {themes.map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setTheme(t)}
                                                className={`flex flex-col gap-3 p-3 rounded-2xl border-2 transition-all hover:shadow-md hover:-translate-y-1 active:scale-95 ${theme === t
                                                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                                                    : 'border-base-300 bg-base-100 hover:border-primary/40'
                                                    }`}
                                                data-theme={t}
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="text-[10px] font-black uppercase tracking-widest truncate opacity-80">{t}</span>
                                                    {theme === t && (
                                                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-4 gap-1 w-full h-6 rounded-lg overflow-hidden border border-base-content/5">
                                                    <div className="bg-primary h-full" title="Primary"></div>
                                                    <div className="bg-secondary h-full" title="Secondary"></div>
                                                    <div className="bg-accent h-full" title="Accent"></div>
                                                    <div className="bg-neutral h-full" title="Neutral"></div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-primary/10 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all">
                                <div className="card-body">
                                    <h2 className="card-title flex gap-2">
                                        <Info className="w-5 h-5 text-primary" /> Version V3
                                    </h2>
                                    <p className="text-sm">Vous utilisez actuellement la version V3 de Hagen Tasks.</p>
                                    <ul className="text-xs space-y-2 mt-4 opacity-70">
                                        <li>• Menu latéral intelligent</li>
                                        <li>• Recherche sémantique IA (CMD+K)</li>
                                        <li>• Widgets de statistiques avancés</li>
                                        <li>• Support thématique complet DaisyUI</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Tab 2: Configuration (Accordion) ─── */}
                    {activeTab === 'configuration' && (
                        <div className="space-y-4 animate-stagger">
                            {/* Workspaces */}
                            <div className={`collapse collapse-arrow bg-base-100 border border-base-300 rounded-2xl shadow-md transition-shadow hover:shadow-lg ${openSections.workspaces ? 'collapse-open' : 'collapse-close'}`}>
                                <div
                                    className="collapse-title text-lg font-bold flex items-center gap-3 cursor-pointer select-none"
                                    onClick={() => toggleSection('workspaces')}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Building className="w-4 h-4 text-primary" />
                                    </div>
                                    Workspaces
                                </div>
                                <div className="collapse-content">
                                    <div className="pt-2">
                                        <WorkspaceManager />
                                    </div>
                                </div>
                            </div>

                            {/* Départements */}
                            <div className={`collapse collapse-arrow bg-base-100 border border-base-300 rounded-2xl shadow-md transition-shadow hover:shadow-lg ${openSections.projects ? 'collapse-open' : 'collapse-close'}`}>
                                <div
                                    className="collapse-title text-lg font-bold flex items-center gap-3 cursor-pointer select-none"
                                    onClick={() => toggleSection('projects')}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                                        <FolderKanban className="w-4 h-4 text-secondary" />
                                    </div>
                                    Départements
                                </div>
                                <div className="collapse-content">
                                    <div className="pt-2">
                                        <ProjectManager />
                                    </div>
                                </div>
                            </div>

                            {/* Catégories */}
                            <div className={`collapse collapse-arrow bg-base-100 border border-base-300 rounded-2xl shadow-md transition-shadow hover:shadow-lg ${openSections.categories ? 'collapse-open' : 'collapse-close'}`}>
                                <div
                                    className="collapse-title text-lg font-bold flex items-center gap-3 cursor-pointer select-none"
                                    onClick={() => toggleSection('categories')}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                        <Palette className="w-4 h-4 text-accent" />
                                    </div>
                                    Catégories
                                </div>
                                <div className="collapse-content">
                                    <div className="pt-2">
                                        <CategoryManager />
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className={`collapse collapse-arrow bg-base-100 border border-base-300 rounded-2xl shadow-md transition-shadow hover:shadow-lg ${openSections.tags ? 'collapse-open' : 'collapse-close'}`}>
                                <div
                                    className="collapse-title text-lg font-bold flex items-center gap-3 cursor-pointer select-none"
                                    onClick={() => toggleSection('tags')}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                                        <TagIcon className="w-4 h-4 text-warning" />
                                    </div>
                                    Tags
                                </div>
                                <div className="collapse-content">
                                    <div className="pt-2">
                                        <TagManager />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Tab 3: Dashboard / Widgets ─── */}
                    {activeTab === 'widgets' && (
                        <div className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all">
                            <div className="card-body">
                                <h2 className="card-title">📊 Visibilité des Widgets</h2>
                                <p className="text-sm opacity-70 mb-4">Affichez ou masquez les éléments du Dashboard.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-stagger-fast">
                                    {[
                                        { id: 'prayerTimes', label: 'Horaires de Prière', icon: '🕌' },
                                        { id: 'quranVerse', label: 'Verset du jour (Inspiration)', icon: '📖' },
                                        { id: 'focusTools', label: 'Outils Focus (Timer)', icon: '⚡' },
                                        { id: 'stats', label: 'Statistiques Tâches', icon: '📈' },
                                        { id: 'upcomingTasks', label: 'Tâches à venir', icon: '📅' },
                                        { id: 'eisenhower', label: 'Matrice Eisenhower', icon: '🎯' },
                                        { id: 'scratchpad', label: 'Bloc-notes', icon: '📝' },
                                        { id: 'worldClock', label: 'Horloge Mondiale', icon: '🌍' },
                                        { id: 'spotify', label: 'Lecteur Spotify', icon: '🎵' },
                                        { id: 'inspiration_quote', label: 'Citations', icon: '💬' },
                                        { id: 'inspiration_growth', label: 'Growth Hack', icon: '🚀' },
                                        { id: 'inspiration_joke', label: 'Blagues', icon: '😄' },
                                        { id: 'inspiration_fact', label: 'Savoir Inutile', icon: '💡' },
                                        { id: 'inspiration_bias', label: 'Biais Cognitifs', icon: '🧠' },
                                        { id: 'inspiration_business', label: 'Business Tips', icon: '💼' },
                                        { id: 'inspiration_tip', label: 'Conseils Productivité', icon: '⚡' },
                                        { id: 'inspiration_challenge', label: 'Défis Quotidiens', icon: '🎯' },
                                        { id: 'inspiration_word', label: 'Mot du Jour', icon: '📚' },
                                        { id: 'inspiration_quran', label: 'Verset du jour (Coran)', icon: '📖' },
                                        { id: 'inspiration_zen', label: 'Minute Zen', icon: '🧘' },
                                    ].map(w => (
                                        <label
                                            key={w.id}
                                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group select-none ${(preferences?.dashboardWidgets?.[w.id] ?? true)
                                                ? 'bg-primary/5 border-primary/20 hover:border-primary/40'
                                                : 'bg-base-200/50 border-transparent opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:bg-base-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-xl transition-colors ${(preferences?.dashboardWidgets?.[w.id] ?? true) ? 'bg-primary text-primary-foreground' : 'bg-base-300'
                                                    }`}>
                                                    <span className="text-xl leading-none">{w.icon}</span>
                                                </div>
                                                <span className="font-bold text-sm">{w.label}</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-primary"
                                                checked={preferences?.dashboardWidgets?.[w.id] ?? true}
                                                onChange={() => toggleWidget(w.id)}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Tab 4: Préférences ─── */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-6 animate-stagger">
                            {/* Prayer Times */}
                            <div className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all">
                                <div className="card-body">
                                    <h2 className="card-title">🕌 Localisation Prières</h2>
                                    <p className="text-sm opacity-70">Configurez votre ville pour des horaires de prière précis.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div className="form-control">
                                            <label className="label"><span className="label-text">Ville</span></label>
                                            <input
                                                type="text"
                                                className="input input-bordered"
                                                value={preferences?.prayerLocation?.city || ''}
                                                onChange={(e) => setPreferences({
                                                    prayerLocation: {
                                                        ...(preferences?.prayerLocation || { country: '' }),
                                                        city: e.target.value
                                                    }
                                                })}
                                                placeholder="ex: Paris, Casablanca"
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text">Pays</span></label>
                                            <input
                                                type="text"
                                                className="input input-bordered"
                                                value={preferences?.prayerLocation?.country || ''}
                                                onChange={(e) => setPreferences({
                                                    prayerLocation: {
                                                        ...(preferences?.prayerLocation || { city: '' }),
                                                        country: e.target.value
                                                    }
                                                })}
                                                placeholder="ex: France, Maroc"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Telegram */}
                            <div className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all">
                                <div className="card-body">
                                    <h2 className="card-title">📱 Notifications Telegram</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                                        <div className="space-y-4">
                                            <div className="form-control">
                                                <label className="label"><span className="label-text font-bold">Chat ID</span></label>
                                                <input
                                                    type="text"
                                                    className="input input-bordered font-mono"
                                                    value={preferences?.telegram?.chatId || ''}
                                                    onChange={(e) => setPreferences({
                                                        telegram: {
                                                            ...(preferences?.telegram || { enabled: false, advanceMinutes: 30 }),
                                                            chatId: e.target.value
                                                        }
                                                    })}
                                                    placeholder="123456789"
                                                />
                                            </div>

                                            <div className="form-control">
                                                <label className="label cursor-pointer justify-start gap-4">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox border-base-300 bg-base-200 checked:border-primary checked:bg-primary checked:text-primary-content"
                                                        checked={preferences?.telegram?.enabled || false}
                                                        onChange={(e) => setPreferences({
                                                            telegram: {
                                                                ...(preferences?.telegram || { chatId: '', advanceMinutes: 30 }),
                                                                enabled: e.target.checked
                                                            }
                                                        })}
                                                    />
                                                    <span className="label-text">Activer les rappels Telegram</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="bg-base-200 p-4 rounded-xl flex flex-col justify-between border border-base-300 shadow-inner">
                                            <div className="space-y-2">
                                                <h3 className="font-bold text-sm">Temps d'avance</h3>
                                                <input
                                                    type="range"
                                                    min="5"
                                                    max="120"
                                                    step="5"
                                                    value={preferences?.telegram?.advanceMinutes || 30}
                                                    className="range range-xs range-primary"
                                                    onChange={(e) => setPreferences({
                                                        telegram: {
                                                            ...(preferences?.telegram || { chatId: '', enabled: false }),
                                                            advanceMinutes: parseInt(e.target.value)
                                                        }
                                                    })}
                                                />
                                                <p className="text-center font-bold text-primary">{preferences?.telegram?.advanceMinutes || 30} minutes</p>
                                            </div>

                                            <button
                                                className="btn btn-outline btn-sm gap-2 mt-4"
                                                onClick={handleTestTelegram}
                                                disabled={!preferences?.telegram?.chatId || !preferences?.telegram?.enabled}
                                            >
                                                🚀 Tester l'envoi
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* External Tools (Spotify & World Clock) */}
                            <div className="card bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 shadow-xl border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all">
                                <div className="card-body">
                                    <h2 className="card-title">🌐 Outils Externes</h2>
                                    <div className="space-y-6 mt-4">
                                        {/* Spotify */}
                                        <div className="form-control">
                                            <label className="label py-1">
                                                <span className="label-text font-bold">Playlist Spotify (URL ou ID)</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="input input-bordered w-full"
                                                value={preferences?.spotify_playlist_url || ''}
                                                onChange={(e) => setPreferences({ spotify_playlist_url: e.target.value })}
                                                placeholder="https://open.spotify.com/playlist/..."
                                            />
                                            <label className="label">
                                                <span className="label-text-alt opacity-50">Laissez vide pour utiliser la playlist par défaut.</span>
                                            </label>
                                        </div>

                                        {/* World Clock Management */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="label py-1">
                                                    <span className="label-text font-bold">Horloges Mondiales</span>
                                                </label>
                                                <span className="text-[10px] opacity-50 uppercase font-black tracking-widest">Configurées</span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {(preferences?.world_clock_cities || []).map((city, idx) => (
                                                    <div key={idx} className="flex gap-3 items-center bg-base-100 p-3 rounded-2xl border-2 border-base-300 shadow-sm hover:border-primary/30 transition-all">
                                                        <div className="flex-1">
                                                            <input
                                                                type="text"
                                                                list="world-cities"
                                                                className="input input-sm bg-transparent w-full font-bold px-0 focus:outline-none placeholder:opacity-30"
                                                                value={city.city}
                                                                onChange={(e) => {
                                                                    const name = e.target.value
                                                                    const CITY_MAP = {
                                                                        'Paris': 'Europe/Paris', 'Bruxelles': 'Europe/Brussels', 'Brussels': 'Europe/Brussels',
                                                                        'London': 'Europe/London', 'Londres': 'Europe/London', 'Casablanca': 'Africa/Casablanca',
                                                                        'Dubaï': 'Asia/Dubai', 'Dubai': 'Asia/Dubai', 'New York': 'America/New_York',
                                                                        'Tokyo': 'Asia/Tokyo', 'Istanbul': 'Europe/Istanbul', 'Marrakech': 'Africa/Casablanca',
                                                                        'Rabat': 'Africa/Casablanca', 'Berlin': 'Europe/Berlin', 'Madrid': 'Europe/Madrid',
                                                                        'Rome': 'Europe/Rome', 'Moscou': 'Europe/Moscow', 'Moscow': 'Europe/Moscow',
                                                                        'Sydney': 'Australia/Sydney', 'Singapour': 'Asia/Singapore', 'Singapore': 'Asia/Singapore',
                                                                        'Séoul': 'Asia/Seoul', 'Seoul': 'Asia/Seoul', 'Los Angeles': 'America/Los_Angeles',
                                                                        'Montréal': 'America/Toronto', 'Montreal': 'America/Toronto', 'Alger': 'Africa/Algiers'
                                                                    }
                                                                    const newCities = [...preferences.world_clock_cities]
                                                                    newCities[idx].city = name
                                                                    if (CITY_MAP[name]) {
                                                                        newCities[idx].timezone = CITY_MAP[name]
                                                                    }
                                                                    setPreferences({ world_clock_cities: newCities })
                                                                }}
                                                                placeholder="Rechercher une ville..."
                                                            />
                                                            <div className="text-[10px] opacity-40 font-mono mt-1 uppercase tracking-tight">
                                                                {city.timezone}
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="btn btn-error btn-ghost btn-sm btn-square"
                                                            onClick={() => {
                                                                const newCities = (preferences.world_clock_cities || []).filter((_, i) => i !== idx)
                                                                setPreferences({ world_clock_cities: newCities })
                                                            }}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}

                                                <datalist id="world-cities">
                                                    <option value="Paris" /> <option value="Bruxelles" /> <option value="Casablanca" />
                                                    <option value="Dubaï" /> <option value="New York" /> <option value="Londres" />
                                                    <option value="Tokyo" /> <option value="Istanbul" /> <option value="Marrakech" />
                                                    <option value="Berlin" /> <option value="Madrid" /> <option value="Rome" />
                                                    <option value="Sydney" /> <option value="Séoul" /> <option value="Singapour" />
                                                    <option value="Montréal" /> <option value="Alger" />
                                                </datalist>

                                                <button
                                                    className="btn btn-outline btn-sm border-dashed rounded-2xl h-auto py-4 flex flex-col gap-1 border-primary/30 hover:bg-primary/5 hover:border-primary"
                                                    onClick={() => {
                                                        const newCities = [...(preferences.world_clock_cities || []), { city: '', timezone: 'UTC' }]
                                                        setPreferences({ world_clock_cities: newCities })
                                                    }}
                                                >
                                                    <Plus className="w-5 h-5 text-primary" />
                                                    <span className="text-[10px] font-bold">Nouvelle ville</span>
                                                </button>
                                            </div>

                                            {/* Quick Select Popular Cities */}
                                            <div className="bg-base-200/50 p-4 rounded-2xl border border-dashed border-base-300">
                                                <p className="text-[11px] font-black uppercase opacity-40 mb-3 tracking-widest">Suggestions Rapides</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {[
                                                        { city: 'Paris', timezone: 'Europe/Paris' },
                                                        { city: 'Bruxelles', timezone: 'Europe/Brussels' },
                                                        { city: 'Casablanca', timezone: 'Africa/Casablanca' },
                                                        { city: 'Dubaï', timezone: 'Asia/Dubai' },
                                                        { city: 'New York', timezone: 'America/New_York' },
                                                        { city: 'Londres', timezone: 'Europe/London' },
                                                        { city: 'Tokyo', timezone: 'Asia/Tokyo' },
                                                        { city: 'Istanbul', timezone: 'Europe/Istanbul' }
                                                    ].filter(pc => !preferences?.world_clock_cities?.some(c => c.timezone === pc.timezone)).map(pc => (
                                                        <button
                                                            key={pc.timezone}
                                                            onClick={() => {
                                                                const updated = [...(preferences.world_clock_cities || []), pc]
                                                                setPreferences({ world_clock_cities: updated })
                                                            }}
                                                            className="btn btn-xs btn-outline font-normal text-[10px] h-7 px-3 bg-base-100 border-base-300 hover:border-primary"
                                                        >
                                                            + {pc.city}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-[10px] opacity-40 italic">La configuration est automatiquement sauvegardée dans vos préférences.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Tab 5: Données ─── */}
                    {activeTab === 'data' && (
                        <div className="space-y-6 animate-stagger">
                            <DataBackupSettings />

                            <div className="card bg-error/5 dark:backdrop-blur-xl dark:bg-error/10 border border-error/20 dark:border-error/30 shadow-xl">
                                <div className="card-body">
                                    <h2 className="card-title text-error flex gap-2">
                                        <AlertTriangle className="w-5 h-5" /> Zone de Danger
                                    </h2>
                                    <p className="text-sm opacity-70">Ces actions sont irréversibles.</p>
                                    <div className="mt-4 flex flex-wrap gap-4">
                                        <button className="btn btn-error btn-outline btn-sm" onClick={handleResetApp}>Réinitialiser l'App</button>
                                        <button className="btn btn-error btn-sm" onClick={handleDeleteAccount}>Supprimer mon compte</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Mobile Save */}
            <div className="fixed bottom-0 left-0 right-0 bg-base-100/80 dark:backdrop-blur-xl dark:bg-black/40 backdrop-blur-md p-4 flex justify-center md:hidden border-t border-base-300 dark:border-white/20 z-50">
                <button
                    onClick={savePreferences}
                    className="btn btn-primary btn-sm btn-block shadow-lg gap-2"
                >
                    <Save className="w-4 h-4" /> Sauvegarder tout
                </button>
            </div>

            {/* Reset App Confirmation */}
            <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-warning" />
                            Réinitialiser l'application ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Toutes vos préférences locales seront effacées. Vos données serveur ne seront pas affectées.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeResetApp}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Oui, réinitialiser
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Account Confirmation */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Supprimer votre compte ?
                        </DialogTitle>
                        <DialogDescription>
                            Cette action est définitive. Toutes vos données seront supprimées.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <label className="text-sm font-medium">Tapez SUPPRIMER pour confirmer</label>
                        <ShadcnInput
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="SUPPRIMER"
                            className="font-mono"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
                        <Button
                            variant="destructive"
                            disabled={deleteConfirmText !== 'SUPPRIMER'}
                            onClick={executeDeleteAccount}
                        >
                            Supprimer définitivement
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayoutV3>
    )
}
