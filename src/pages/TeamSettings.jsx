import { useState, useEffect } from 'react'
import pb from '../lib/pocketbase'
import { useUserStore } from '../stores/userStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import toast from 'react-hot-toast'
import { Users, Mail, Plus, Settings, LogOut, Check } from 'lucide-react'

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
            const userId = pb.authStore.model?.id
            if (!userId) return

            // 1. Fetch teams where user is member
            const membersData = await pb.collection('team_members').getFullList({
                filter: `user_id = "${userId}"`,
                expand: 'team_id'
            })

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
        const user = pb.authStore.model
        if (!user) return
        try {
            // Fetch invitations by email
            const data = await pb.collection('team_invitations').getFullList({
                filter: `email = "${user.email}" && status = "pending"`,
                expand: 'team_id'
            })

            setReceivedInvitations(data)
        } catch (error) {
            console.error('Error loading received invitations:', error)
        }
    }

    const handleAcceptInvite = async (invite, inviteId) => {
        setLoading(true)
        try {
            const user = pb.authStore.model
            // 1. Create team member
            await pb.collection('team_members').create({
                team_id: invite.team_id,
                user_id: user.id,
                role: 'member'
            })

            // 2. Update/Delete invitation
            await pb.collection('team_invitations').delete(inviteId)

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
            const membersData = await pb.collection('team_members').getFullList({
                filter: `team_id = "${teamId}"`,
                expand: 'user_id'
            })

            setMembers(membersData)

            // Load Invitations (Sent BY the team)
            const invData = await pb.collection('team_invitations').getFullList({
                filter: `team_id = "${teamId}" || status = "pending"`
            })

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
            const user = pb.authStore.model
            if (!user) throw new Error('Not authenticated')

            const team = await pb.collection('teams').create({
                name: createTeamName,
                owner_id: user.id
            })

            // Add owner as member
            await pb.collection('team_members').create({
                team_id: team.id,
                user_id: user.id,
                role: 'owner'
            })

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
            // 1. Check if user exists (Optional, if we want to add directly)
            // But usually just create invitation record
            await pb.collection('team_invitations').create({
                team_id: currentTeam.id,
                email: inviteEmail.trim(),
                status: 'pending'
            })

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

    return (
        <div className="container-tight py-8 space-y-6 animate-in fade-in">
            <div className="flex items-center gap-2">
                <Users className="w-8 h-8" />
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">Team Settings</h1>
                    <p className="text-muted-foreground">Manage your team, members, and permissions.</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadTeams}>Refresh</Button>
            </div>

            <div className="grid gap-6 md:grid-cols-[240px_1fr] items-start">

                {/* Sidebar: List of Teams */}
                <aside className="space-y-4">
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-muted/50 py-3">
                            <CardTitle className="text-sm font-medium">Your Teams</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {teams.map(team => (
                                <div
                                    key={team.id}
                                    className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${currentTeam?.id === team.id ? 'bg-primary/10 border-primary border' : 'hover:bg-muted'}`}
                                    onClick={() => setCurrentTeam(team)}
                                >
                                    <div className="font-medium truncate text-sm">{team.name}</div>
                                    {team.myRole === 'owner' && <Badge variant="secondary" className="text-[10px] m-0 h-5">Owner</Badge>}
                                </div>
                            ))}

                            {teams.length === 0 && (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                    No teams yet. Create one!
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {receivedInvitations.length > 0 && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-primary" />
                                    New Invitations ({receivedInvitations.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {receivedInvitations.map(inv => (
                                    <div key={inv.id} className="flex items-center justify-between p-2 bg-background border rounded-md">
                                        <div className="text-xs">
                                            <p className="font-medium">Invitation to join <span className="text-primary font-bold">{inv.expand?.team_id?.name || 'Unknown Team'}</span></p>
                                        </div>
                                        <Button size="sm" onClick={() => handleAcceptInvite(inv, inv.id)} disabled={loading}>
                                            Accept
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader className="bg-muted/50 py-3">
                            <CardTitle className="text-sm font-medium">Create Team</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateTeam} className="space-y-3">
                                <Input
                                    placeholder="Team Name"
                                    value={createTeamName}
                                    onChange={e => setCreateTeamName(e.target.value)}
                                />
                                <Button type="submit" size="sm" className="w-full" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Team'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </aside>

                {/* Main Content: Members & Settings */}
                <main>
                    {currentTeam ? (
                        <Tabs defaultValue="members">
                            <TabsList className="mb-4">
                                <TabsTrigger value="members">Members</TabsTrigger>
                                <TabsTrigger value="settings">Settings</TabsTrigger>
                            </TabsList>

                            {/* Members Tab */}
                            <TabsContent value="members" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Invite Member</CardTitle>
                                        <CardDescription>Invite a colleague by email to join <strong>{currentTeam.name}</strong></CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleInvite} className="flex gap-2">
                                            <Input
                                                type="email"
                                                placeholder="colleague@company.com"
                                                value={inviteEmail}
                                                onChange={e => setInviteEmail(e.target.value)}
                                                className="max-w-md"
                                                required
                                            />
                                            <Button type="submit" disabled={loading}>
                                                <Mail className="w-4 h-4 mr-2" />
                                                Send Invite
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Team Members ({members.length})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {members.map(member => (
                                                <div key={member.id} className="flex items-center justify-between p-2 border rounded-lg bg-card/50">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarFallback>U</AvatarFallback>
                                                            {member.expand?.user_id?.avatar && <AvatarImage src={pb.files.getUrl(member.expand.user_id, member.expand.user_id.avatar)} />}
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">{member.expand?.user_id?.name || member.expand?.user_id?.email || 'Unknown User'}</div>
                                                            <div className="text-xs text-muted-foreground capitalize">{member.role}</div>
                                                        </div>
                                                    </div>
                                                    {currentTeam.myRole === 'owner' && member.role !== 'owner' && (
                                                        <Button variant="ghost" size="sm" className="text-destructive">Remove</Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {invitations.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm">Pending Invitations</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {invitations.map(inv => (
                                                    <div key={inv.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                                                        <span>{inv.email}</span>
                                                        <Badge variant="outline">Pending</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Settings Tab */}
                            <TabsContent value="settings">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Team Settings</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Team ID</Label>
                                            <div className="p-2 bg-muted rounded font-mono text-xs">{currentTeam.id}</div>
                                        </div>

                                        {currentTeam.myRole === 'owner' && (
                                            <div className="pt-4 border-t">
                                                <Button variant="destructive" className="w-full sm:w-auto">
                                                    <LogOut className="w-4 h-4 mr-2" />
                                                    Delete Team
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl bg-muted/10">
                            <Users className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
                            <h3 className="text-lg font-semibold">Select a Team</h3>
                            <p className="text-muted-foreground">Or create a new one to get started.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
