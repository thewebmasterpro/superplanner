import { useState, useRef } from 'react'
import {
  Plus, Users, MoreVertical, Trash2, Edit2, Loader2,
  Upload, ChevronDown, ChevronUp, UserPlus, X, Download
} from 'lucide-react'
import { useSmsGroups, useSmsGroupMembers } from '../../hooks/useSms'
import { format } from 'date-fns'

export function SmsGroupsList() {
  const { groups, isLoading, createGroup, updateGroup, deleteGroup, isCreating } = useSmsGroups()
  const [expandedGroupId, setExpandedGroupId] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return
    createGroup({ name: newGroupName.trim(), description: newGroupDesc.trim() })
    setNewGroupName('')
    setNewGroupDesc('')
    setShowCreateForm(false)
  }

  const handleDeleteGroup = (id) => {
    if (!confirm('Supprimer ce groupe et tous ses membres ?')) return
    deleteGroup(id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Groupes de contacts</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary btn-sm gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau groupe
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4">
            <h3 className="font-semibold mb-3">Créer un groupe</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nom du groupe *"
                className="input input-bordered input-sm w-full"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optionnel)"
                className="input input-bordered input-sm w-full"
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={handleCreateGroup} className="btn btn-primary btn-sm" disabled={isCreating}>
                  Créer
                </button>
                <button onClick={() => setShowCreateForm(false)} className="btn btn-ghost btn-sm">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {groups.length === 0 && !showCreateForm ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center py-12">
            <Users className="w-16 h-16 text-base-content/20 mb-4" />
            <h3 className="text-lg font-semibold">Aucun groupe</h3>
            <p className="text-sm text-base-content/60 max-w-sm">
              Créez des groupes pour organiser vos contacts et envoyer des campagnes SMS ciblées.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(group => (
            <div key={group.id} className="card bg-base-100 shadow-md">
              <div className="card-body p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{group.name}</h3>
                      <p className="text-xs text-base-content/50">
                        {group.member_count || 0} contacts
                        {group.description && ` - ${group.description}`}
                      </p>
                    </div>
                    {expandedGroupId === group.id ? (
                      <ChevronUp className="w-4 h-4 ml-auto text-base-content/40" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-auto text-base-content/40" />
                    )}
                  </button>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="btn btn-ghost btn-xs btn-circle text-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedGroupId === group.id && (
                  <GroupMembersPanel groupId={group.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function GroupMembersPanel({ groupId }) {
  const { members, isLoading, addMember, removeMember, importMembers, isImporting } = useSmsGroupMembers(groupId)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', phone: '', email: '' })
  const fileInputRef = useRef(null)

  const handleAddMember = () => {
    if (!newMember.phone.trim()) return
    addMember(newMember)
    setNewMember({ name: '', phone: '', email: '' })
    setShowAddForm(false)
  }

  const handleCSVImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      const lines = text.split('\n').filter(l => l.trim())

      // Skip header if it looks like one
      const startIndex = lines[0]?.toLowerCase().includes('name') || lines[0]?.toLowerCase().includes('phone') ? 1 : 0

      const parsed = []
      for (let i = startIndex; i < lines.length; i++) {
        const cols = lines[i].split(/[,;\t]/).map(c => c.trim().replace(/^["']|["']$/g, ''))
        if (cols.length >= 1) {
          parsed.push({
            name: cols[0] || '',
            phone: cols[1] || cols[0] || '',
            email: cols[2] || ''
          })
        }
      }

      if (parsed.length > 0) {
        importMembers(parsed)
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset file input
  }

  const handleExportCSV = () => {
    if (members.length === 0) return
    const header = 'name,phone,email'
    const rows = members.map(m => `"${m.name || ''}","${m.phone || ''}","${m.email || ''}"`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `group-contacts-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-4 border-t border-base-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">{members.length} membres</span>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.txt,.tsv"
            onChange={handleCSVImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="btn btn-ghost btn-xs gap-1"
          >
            <Upload className="w-3 h-3" />
            {isImporting ? 'Import...' : 'Importer CSV'}
          </button>
          {members.length > 0 && (
            <button onClick={handleExportCSV} className="btn btn-ghost btn-xs gap-1">
              <Download className="w-3 h-3" />
              Exporter
            </button>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary btn-xs gap-1"
          >
            <UserPlus className="w-3 h-3" />
            Ajouter
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="flex items-center gap-2 mb-3 bg-base-200/50 p-2 rounded-lg">
          <input
            type="text"
            placeholder="Nom"
            className="input input-bordered input-xs flex-1"
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
          />
          <input
            type="tel"
            placeholder="Téléphone *"
            className="input input-bordered input-xs flex-1"
            value={newMember.phone}
            onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            className="input input-bordered input-xs flex-1"
            value={newMember.email}
            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
          />
          <button onClick={handleAddMember} className="btn btn-primary btn-xs">OK</button>
          <button onClick={() => setShowAddForm(false)} className="btn btn-ghost btn-xs">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-base-content/40 text-center py-4">
          Aucun membre. Ajoutez-en ou importez un fichier CSV.
        </p>
      ) : (
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="table table-xs table-zebra">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id}>
                  <td className="text-sm">{member.name || '-'}</td>
                  <td className="text-sm font-mono">{member.phone}</td>
                  <td className="text-sm">{member.email || '-'}</td>
                  <td>
                    <button
                      onClick={() => removeMember(member.id)}
                      className="btn btn-ghost btn-xs btn-circle text-error"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
