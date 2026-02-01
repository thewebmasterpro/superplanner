import { useState, useEffect } from 'react'
import { useUserStore } from '../stores/userStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import toast from 'react-hot-toast'
import { Users, Mail, Plus, Settings, LogOut, Check, RefreshCw } from 'lucide-react'
import { teamsService } from '../services/teams.service'
import pb from '../lib/pocketbase' // Keep for pb.files.getUrl usage in AvatarImage

export function TeamSettings() {
    const { user, teams, setTeams, currentTeam, setCurrentTeam } = useUserStore()
    const [loading, setLoading] = useState(false)
    const [members, setMembers] = useState([])
    const [invitations, setInvitations] = useState([])
    const [receivedInvitations, setReceivedInvitations] = useState([]) // Invites TO the user
    const [createTeamName, setCreateTeamName] = useState('')
    const [inviteEmail, setInviteEmail] = useState('')

    // Load teams on mount
    useEffect(() => {
        loadTeams()
        loadReceivedInvitations()
    }, [])

    // Load members when currentTeam changes
    useEffect(() => {
        if (currentTeam) {
            loadTeamDetails(currentTeam.id)
        }
    }, [currentTeam])

    const loadTeams = async () => {
        try {
            const membersData = await teamsService.MyMemberships()

            const processedTeams = membersData.map(m => ({
                ...m.expand.team_id,
                myRole: m.role
            }))

            setTeams(processedTeams)

            if (!currentTeam && processedTeams.length > 0) {
                setCurrentTeam(processedTeams[0])
            }
        } catch (error) {
            console.error('Error loading teams:', error)
        }
    }

    const loadReceivedInvitations = async () => {
        try {
            // Fetch invitations by email
            const data = await teamsService.getReceivedInvitations()
            setReceivedInvitations(data)
        } catch (error) {
            console.error('Error loading received invitations:', error)
        }
    }

    const handleAcceptInvite = async (invite, inviteId) => {
        setLoading(true)
        try {
            await teamsService.acceptInvitation(inviteId, invite.team_id)

            toast.success('Joined team successfully!')
            loadTeams()
            loadReceivedInvitations()
        } catch (error) {
            toast.error(`Error: ${error.message}`)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const loadTeamDetails = async (teamId) => {
        try {
            // Load Members
            const membersData = await teamsService.getTeamMembers(teamId)
            setMembers(membersData)

            // Load Invitations (Sent BY the team)
            const invData = await teamsService.getTeamInvitations(teamId)
            setInvitations(invData)

        } catch (error) {
            console.error('Error details:', error)
        }
    }

    const handleCreateTeam = async (e) => {
        e.preventDefault()
        if (!createTeamName.trim()) return

        setLoading(true)
        try {
            await teamsService.createTeam(createTeamName)

            toast.success('Team created!')
            setCreateTeamName('')
            loadTeams()
        } catch (error) {
            toast.error(`Failed to create team: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const handleInvite = async (e) => {
        e.preventDefault()
        if (!inviteEmail.trim() || !currentTeam) return

        setLoading(true)
        try {
            await teamsService.inviteMember(currentTeam.id, inviteEmail.trim())

            toast.success(`Invitation sent to ${inviteEmail}`)
            setInviteEmail('')
            loadTeamDetails(currentTeam.id)
        } catch (error) {
            // Handle unique constraint if user already invited?
            toast.error(`Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    // Add missing handler for remove member
    const handleRemoveMember = async (memberId) => {
        if (!confirm('Are you sure you want to remove this member?')) return
        try {
            await teamsService.removeMember(memberId)
            toast.success('Member removed')
            loadTeamDetails(currentTeam.id)
        } catch (e) {
            toast.error('Failed to remove member')
        }
    }

    // Also delete team handler
    const handleDeleteTeam = async () => {
        if (!confirm('Are you sure you want to delete this team? This cannot be undone.')) return
        setLoading(true)
        try {
            await teamsService.deleteTeam(currentTeam.id)
            toast.success('Team deleted')
            setCurrentTeam(null)
            loadTeams()
        } catch (e) {
            toast.error('Failed to delete team')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div data-tour="team-header" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display flex items-center gap-2 text-primary">
                        <Users className="w-8 h-8" />
                        Gestion d'Équipe
                    </h1>
                    <p className="text-muted-foreground">Gérez vos équipes, membres et permissions.</p>
                </div>
                <button className="btn btn-ghost btn-sm gap-2" onClick={loadTeams}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[280px_1fr] items-start">
                {/* Sidebar: List of Teams */}
                <aside className="flex flex-col gap-6">
                    <div className="card bg-base-100 shadow-xl border border-base-300">
                        <div className="card-body p-4">
                            <h2 className="text-xs font-bold uppercase opacity-50 mb-2 px-2">Vos Équipes</h2>
                            <div className="flex flex-col gap-1">
                                {teams.map(team => (
                                    <div
                                        key={team.id}
                                        className={`group p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${currentTeam?.id === team.id ? 'bg-primary text-primary-content shadow-lg' : 'hover:bg-base-200'}`}
                                        onClick={() => setCurrentTeam(team)}
                                    >
                                        <div className="font-bold truncate text-sm">{team.name}</div>
                                        {team.myRole === 'owner' && (
                                            <span className={`badge badge-xs ${currentTeam?.id === team.id ? 'badge-ghost' : 'badge-primary'} opacity-70`}>Owner</span>
                                        )}
                                    </div>
                                ))}

                                {teams.length === 0 && (
                                    <div className="text-xs text-muted-foreground text-center py-8 bg-base-200/50 rounded-xl">
                                        Aucune équipe. Créez-en une !
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {receivedInvitations.length > 0 && (
                        <div className="card bg-primary/10 border border-primary/20 shadow-lg animate-pulse">
                            <div className="card-body p-4 text-primary">
                                <h2 className="text-xs font-bold uppercase mb-2 flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Invitations ({receivedInvitations.length})
                                </h2>
                                <div className="flex flex-col gap-2">
                                    {receivedInvitations.map(inv => (
                                        <div key={inv.id} className="bg-base-100 p-3 rounded-xl shadow-sm border border-primary/20">
                                            <p className="text-[10px] font-bold mb-2">Rejoindre <span className="underline">{inv.expand?.team_id?.name || 'Inconnue'}</span></p>
                                            <button className="btn btn-primary btn-xs w-full" onClick={() => handleAcceptInvite(inv, inv.id)} disabled={loading}>
                                                Accepter
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card bg-base-100 shadow-xl border border-base-300">
                        <div className="card-body p-4">
                            <h2 className="text-xs font-bold uppercase opacity-50 mb-4 px-2 tracking-widest">Nouvelle Équipe</h2>
                            <form onSubmit={handleCreateTeam} className="form-control gap-2">
                                <input
                                    className="input input-bordered input-sm"
                                    placeholder="Nom de l'équipe..."
                                    value={createTeamName}
                                    onChange={e => setCreateTeamName(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary btn-sm gap-2" disabled={loading || !createTeamName}>
                                    <Plus className="w-4 h-4" />
                                    Créer
                                </button>
                            </form>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main data-tour="team-members" className="flex flex-col gap-6">
                    {currentTeam ? (
                        <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
                            <div className="card-body p-0">
                                <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200/50">
                                    <h2 className="font-bold text-xl">{currentTeam.name}</h2>
                                    <div className="join join-horizontal bg-base-100 p-0.5 border border-base-300">
                                        <button className={`join-item btn btn-xs ${!loading ? 'btn-primary' : 'btn-ghost'}`}>Membres</button>
                                        <button className={`join-item btn btn-xs btn-ghost`} onClick={() => handleDeleteTeam()}>Paramètres</button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Invite Form */}
                                    <div data-tour="team-invite" className="bg-base-200/50 p-4 rounded-3xl border border-base-300 mb-8">
                                        <div className="flex flex-col md:flex-row gap-4 items-end">
                                            <div className="form-control flex-1 w-full">
                                                <label className="label">
                                                    <span className="label-text font-bold">Inviter un collaborateur</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    className="input input-bordered w-full"
                                                    placeholder="nom@entreprise.com"
                                                    value={inviteEmail}
                                                    onChange={e => setInviteEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <button className="btn btn-primary gap-2" onClick={handleInvite} disabled={loading}>
                                                <Mail className="w-4 h-4" />
                                                Envoyer l'invitation
                                            </button>
                                        </div>
                                    </div>

                                    {/* Members List */}
                                    <div className="space-y-4">
                                        <h3 className="font-bold flex items-center gap-2 opacity-60 text-sm uppercase px-2">
                                            <Users className="w-4 h-4" />
                                            Membres de l'équipe ({members.length})
                                        </h3>
                                        <div className="grid gap-3">
                                            {members.map(member => (
                                                <div key={member.id} className="flex items-center justify-between p-4 bg-base-200/30 rounded-2xl hover:bg-base-200/50 transition-colors border border-transparent hover:border-base-300">
                                                    <div className="flex items-center gap-4">
                                                        <div className="avatar">
                                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                                                                {member.expand?.user_id?.avatar ? (
                                                                    <img src={pb.files.getUrl(member.expand.user_id, member.expand.user_id.avatar)} alt="avatar" />
                                                                ) : (
                                                                    <span className="text-xl font-bold text-primary">{(member.expand?.user_id?.name || 'U')[0].toUpperCase()}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="font-bold">{member.expand?.user_id?.name || member.expand?.user_id?.email || 'Utilisateur inconnu'}</div>
                                                            <div className="badge badge-sm badge-ghost opacity-60 capitalize">{member.role}</div>
                                                        </div>
                                                    </div>
                                                    {currentTeam.myRole === 'owner' && member.role !== 'owner' && (
                                                        <button className="btn btn-error btn-ghost btn-xs" onClick={() => handleRemoveMember(member.id)}>Retirer</button>
                                                    )}
                                                </div>
                                            ))}

                                            {invitations.map(inv => (
                                                <div key={inv.id} className="flex items-center justify-between p-4 bg-base-200/10 rounded-2xl border border-dashed border-base-300 italic opacity-60">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full border border-dashed border-base-300 flex items-center justify-center">
                                                            <Mail className="w-4 h-4" />
                                                        </div>
                                                        <span>{inv.email}</span>
                                                    </div>
                                                    <span className="badge badge-sm badge-ghost">En attente</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-base-100 rounded-3xl border border-dashed border-base-300 min-h-[400px]">
                            <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mb-6">
                                <Users className="w-12 h-12 opacity-10" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Sélectionnez une Équipe</h3>
                            <p className="text-muted-foreground max-w-sm">Choisissez une équipe dans la barre latérale ou créez-en une nouvelle pour commencer à collaborer.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
