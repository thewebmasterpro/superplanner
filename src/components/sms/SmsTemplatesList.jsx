import { useState } from 'react'
import { Plus, FileText, Trash2, Edit2, Loader2, X, Copy } from 'lucide-react'
import { useSmsTemplates } from '../../hooks/useSms'
import toast from 'react-hot-toast'

export function SmsTemplatesList() {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, isCreating } = useSmsTemplates()
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [form, setForm] = useState({ name: '', body: '', category: '' })

  const openEdit = (template) => {
    setEditingTemplate(template)
    setForm({ name: template.name, body: template.body, category: template.category || '' })
    setShowForm(true)
  }

  const openCreate = () => {
    setEditingTemplate(null)
    setForm({ name: '', body: '', category: '' })
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim() || !form.body.trim()) return
    if (editingTemplate) {
      updateTemplate({ id: editingTemplate.id, ...form })
    } else {
      createTemplate(form)
    }
    setShowForm(false)
    setEditingTemplate(null)
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer ce template ?')) return
    deleteTemplate(id)
  }

  const handleCopy = (body) => {
    navigator.clipboard.writeText(body)
    toast.success('Template copié')
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
        <h2 className="text-lg font-semibold">Templates SMS</h2>
        <button onClick={openCreate} className="btn btn-primary btn-sm gap-2">
          <Plus className="w-4 h-4" />
          Nouveau template
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">
                {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
              </h3>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-xs btn-circle">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nom du template *"
                className="input input-bordered input-sm w-full"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
              <input
                type="text"
                placeholder="Catégorie (ex: Marketing, Support...)"
                className="input input-bordered input-sm w-full"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <textarea
                placeholder="Bonjour {{name}}, votre message ici..."
                className="textarea textarea-bordered w-full h-24 font-mono text-sm"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
              <p className="text-xs text-base-content/50">
                Variables : {'{{name}}'}, {'{{phone}}'}, {'{{email}}'}
              </p>
              <div className="flex gap-2">
                <button onClick={handleSubmit} className="btn btn-primary btn-sm" disabled={isCreating}>
                  {editingTemplate ? 'Mettre à jour' : 'Créer'}
                </button>
                <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {templates.length === 0 && !showForm ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center py-12">
            <FileText className="w-16 h-16 text-base-content/20 mb-4" />
            <h3 className="text-lg font-semibold">Aucun template</h3>
            <p className="text-sm text-base-content/60 max-w-sm">
              Créez des templates réutilisables pour vos campagnes SMS.
              Utilisez {'{{name}}'} pour personnaliser automatiquement.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div key={template.id} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{template.name}</h3>
                    {template.category && (
                      <span className="badge badge-ghost badge-xs mt-1">{template.category}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleCopy(template.body)} className="btn btn-ghost btn-xs btn-circle">
                      <Copy className="w-3 h-3" />
                    </button>
                    <button onClick={() => openEdit(template)} className="btn btn-ghost btn-xs btn-circle">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(template.id)} className="btn btn-ghost btn-xs btn-circle text-error">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-base-content/60 mt-2 whitespace-pre-wrap line-clamp-3 font-mono bg-base-200/50 rounded-lg p-2">
                  {template.body}
                </p>
                <p className="text-xs text-base-content/40 mt-2">
                  {template.body.length} caractères | {Math.ceil(template.body.length / 160)} SMS
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
