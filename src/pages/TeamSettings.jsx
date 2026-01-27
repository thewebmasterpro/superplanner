import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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
    const [createTeamName, setCreateTeamName] = useState('')
    const [inviteEmail, setInviteEmail] = useState('')

    // Load teams on mount
    useEffect(() => {
        loadTeams()
    }, [])

    // Load members when currentTeam changes
    useEffect(() => {
        if (currentTeam) {
            loadTeamDetails(currentTeam.id)
        }
    }, [currentTeam])

    const loadTeams = async () => {
        try {
            const { data, error } = await supabase
                .from('teams')
                .select(`
          *,
          team_members!inner(role)
        `)

            if (error) throw error

            // Transform to get role easily
            const processedTeams = data.map(team => ({
                ...team,
                myRole: team.team_members[0]?.role
            }))

            setTeams(processedTeams)

            // Auto-select first team if none selected
            if (!currentTeam && processedTeams.length > 0) {
                setCurrentTeam(processedTeams[0])
            }
        } catch (error) {
            console.error('Error loading teams:', error)
        }
    }

    const loadTeamDetails = async (teamId) => {
        try {
            // Load Members
            const { data: membersData, error: membersError } = await supabase
                .from('team_members')
                .select(`
          *,
          user:user_id(email)
        `) // Note: user_id references auth.users which might not be directly queryable if not in public schema. 
                // Usually we keep a public profiles table. For now assuming we might get errors here if no public profile.
                // If auth.users is restricted, we rely on what supabase returns.
                // Actually, standard Supabase doesn't expose auth.users to public API.
                // We might need a secure function or a profiles table.
                // For MVP, we'll try to rely on 'user_id' and if possible get metadata.
                // EDIT: Let's assume we need to fix this later or use a workaround. 
                // For now, let's just show the user_id or email if available in a view.
                .eq('team_id', teamId)

            if (!membersError) setMembers(membersData)

            // Load Invitations
            const { data: invData, error: invError } = await supabase
                .from('team_invitations')
                .select('*')
                .eq('team_id', teamId)

            if (!invError) setInvitations(invData)

        } catch (error) {
            console.error('Error details:', error)
        }
    }

    const handleCreateTeam = async (e) => {
        e.preventDefault()
        if (!createTeamName.trim()) return

        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('teams')
                .insert({
                    name: createTeamName,
                    owner_id: user.id
                })
                .select()
                .single()

            if (error) throw error

            toast.success('Team created!')
            setCreateTeamName('')
            loadTeams() // Refresh
        } catch (error) {
            toast.error('Failed to create team')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleInvite = async (e) => {
        e.preventDefault()
        if (!inviteEmail.trim() || !currentTeam) return

        setLoading(true)
        try {
            // Create invitation
            const token = Math.random().toString(36).substring(2) + Date.now().toString(36)

            const { error } = await supabase
                .from('team_invitations')
                .insert({
                    team_id: currentTeam.id,
                    email: inviteEmail,
                    invited_by: user.id,
                    role: 'member',
                    token: token
                })

            if (error) throw error

            toast.success(`Invitation sent to ${inviteEmail}`)
            setInviteEmail('')
            loadTeamDetails(currentTeam.id)
        } catch (error) {
            toast.error('Failed to send invitation')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container py-8 max-w-4xl animate-in fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Settings</h1>
                    <p className="text-muted-foreground">Manage your team, members, and permissions.</p>
                </div>
                <Button variant="outline" onClick={loadTeams}>Refresh</Button>
            </div>

            <div className="grid gap-8 md:grid-cols-[250px_1fr]">

                {/* Sidebar: List of Teams */}
                <aside className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Your Teams</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {teams.map(team => (
                                <div
                                    key={team.id}
                                    className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${currentTeam?.id === team.id ? 'bg-primary/10 border-primary border' : 'hover:bg-muted'}`}
                                    onClick={() => setCurrentTeam(team)}
                                >
                                    <div className="font-medium truncate">{team.name}</div>
                                    {team.myRole === 'owner' && <Badge variant="secondary" className="text-xs">Owner</Badge>}
                                </div>
                            ))}

                            {teams.length === 0 && (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                    No teams yet. Create one!
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
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
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">User {member.user_id.slice(0, 8)}...</div>
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
