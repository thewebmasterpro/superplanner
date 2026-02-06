import { ChevronRight, AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * TaskModalAssignment - Handles links & assignment fields
 * Contact, team assignment mode, member assignment, workspace
 */
export function TaskModalAssignment({
  formData,
  setFormData,
  contactsList,
  currentTeam,
  teams = [],
  teamMembers,
  assignmentMode,
  setAssignmentMode,
  workspaces,
  activeWorkspaceId,
  getActiveWorkspace
}) {
  // Get available teams (user's teams)
  const availableTeams = teams.length > 0 ? teams : (currentTeam ? [currentTeam] : [])
  return (
    <details className="group">
      <summary className="flex items-center gap-2 cursor-pointer py-3 border-t border-base-200 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80 transition-opacity select-none">
        <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
        Liens
      </summary>
      <div className="pb-4 space-y-4">
        {/* Contact/Client */}
        <div className="space-y-2">
          <Label htmlFor="contact">Client</Label>
          <Select
            value={formData.contact_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, contact_id: value === 'none' ? null : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {contactsList.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name} {contact.company && `(${contact.company})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assignment Mode Selection */}
        {availableTeams.length > 0 && (
          <div className="space-y-4 p-4 rounded-xl bg-base-200/30 dark:bg-white/5">
            <Label>Mode d'assignation</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignmentMode"
                  value="individual"
                  checked={assignmentMode === 'individual'}
                  onChange={(e) => {
                    setAssignmentMode(e.target.value)
                    setFormData({ ...formData, assigned_to: '', status: 'todo', team_id: '' })
                  }}
                  className="radio radio-sm radio-primary"
                />
                <span className="text-sm">Assigner à un membre</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignmentMode"
                  value="team"
                  checked={assignmentMode === 'team'}
                  onChange={(e) => {
                    setAssignmentMode(e.target.value)
                    // Set default team when switching to team mode
                    const defaultTeam = availableTeams[0]
                    setFormData({
                      ...formData,
                      assigned_to: null,
                      status: 'unassigned',
                      team_id: defaultTeam?.id || ''
                    })
                  }}
                  className="radio radio-sm radio-primary"
                />
                <span className="text-sm">Assigner à l'équipe (Pool)</span>
              </label>
            </div>

            {assignmentMode === 'individual' && teamMembers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Membre assigné</Label>
                <Select
                  value={formData.assigned_to || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, assigned_to: value === 'none' ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Non assigné" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non assigné</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.auth_user?.email || `User ${member.user_id.slice(0, 8)}...`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {assignmentMode === 'team' && (
              <div className="space-y-4">
                {/* Team Selector */}
                <div className="space-y-2">
                  <Label htmlFor="team_id">Équipe *</Label>
                  <Select
                    value={formData.team_id || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, team_id: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger className={!formData.team_id ? 'border-amber-500' : ''}>
                      <SelectValue placeholder="Sélectionner une équipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Claim Deadline */}
                <div className="space-y-2">
                  <Label htmlFor="claim_deadline">Date limite pour prendre la tâche (optionnel)</Label>
                  <Input
                    id="claim_deadline"
                    type="date"
                    value={formData.claim_deadline}
                    onChange={(e) => setFormData({ ...formData, claim_deadline: e.target.value })}
                  />
                  <p className="text-xs opacity-60">
                    Cette tâche sera disponible dans le pool de l'équipe. Les membres pourront la prendre librement.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workspace Selector */}
        {(!activeWorkspaceId || activeWorkspaceId === 'trash' || activeWorkspaceId === 'archive') ? (
          <div className="space-y-2 p-3 rounded-xl bg-base-200/30">
            <Label htmlFor="context" className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              Workspace *
            </Label>
            <Select
              value={formData.context_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, context_id: value === 'none' ? '' : value })}
            >
              <SelectTrigger className={!formData.context_id ? 'border-amber-500' : ''}>
                <SelectValue placeholder="Select a workspace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>Select a workspace...</SelectItem>
                {workspaces.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color || '#6366f1' }} />
                      {w.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Creating in:</span>
            <Badge variant="outline" className="rounded-lg" style={{ borderColor: getActiveWorkspace()?.color, color: getActiveWorkspace()?.color }}>
              {getActiveWorkspace()?.name || 'Unknown Workspace'}
            </Badge>
          </div>
        )}
      </div>
    </details>
  )
}
