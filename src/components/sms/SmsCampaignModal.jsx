import { useState, useEffect } from 'react'
import { Send, X, Info } from 'lucide-react'
import { useSmsCampaigns, useSmsGroups, useSmsDevices, useSmsTemplates } from '../../hooks/useSms'

export function SmsCampaignModal({ open, onOpenChange, campaign = null }) {
  const { createCampaign, updateCampaign, isCreating } = useSmsCampaigns()
  const { groups } = useSmsGroups()
  const { devices } = useSmsDevices()
  const { templates } = useSmsTemplates()

  const [form, setForm] = useState({
    name: '',
    message: '',
    group_id: '',
    device_id: '',
    scheduled_at: ''
  })

  useEffect(() => {
    if (campaign) {
      setForm({
        name: campaign.name || '',
        message: campaign.message || '',
        group_id: campaign.group_id || '',
        device_id: campaign.device_id || '',
        scheduled_at: campaign.scheduled_at || ''
      })
    } else {
      setForm({ name: '', message: '', group_id: '', device_id: '', scheduled_at: '' })
    }
  }, [campaign, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.message || !form.group_id) return

    if (campaign) {
      updateCampaign({ id: campaign.id, ...form })
    } else {
      createCampaign(form)
    }
    onOpenChange(false)
  }

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setForm({ ...form, message: template.body })
    }
  }

  const charCount = form.message.length
  const smsCount = Math.ceil(charCount / 160) || 0

  if (!open) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        <button
          onClick={() => onOpenChange(false)}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-bold text-lg flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          {campaign ? 'Modifier la campagne' : 'Nouvelle campagne SMS'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Nom de la campagne *</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Promo Black Friday"
              className="input input-bordered"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Groupe de destinataires *</span>
            </label>
            <select
              className="select select-bordered"
              value={form.group_id}
              onChange={(e) => setForm({ ...form, group_id: e.target.value })}
              required
            >
              <option value="">Sélectionner un groupe</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.member_count || 0} contacts)
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Appareil d'envoi</span>
            </label>
            <select
              className="select select-bordered"
              value={form.device_id}
              onChange={(e) => setForm({ ...form, device_id: e.target.value })}
            >
              <option value="">Automatique</option>
              {devices.filter(d => d.status === 'active').map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.phone_number})
                </option>
              ))}
            </select>
          </div>

          {templates.length > 0 && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Utiliser un template</span>
              </label>
              <select
                className="select select-bordered select-sm"
                onChange={(e) => handleTemplateSelect(e.target.value)}
                defaultValue=""
              >
                <option value="">Choisir un template...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Message *</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-32 font-mono text-sm"
              placeholder="Bonjour {{name}}, ..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
            <label className="label">
              <span className="label-text-alt flex items-center gap-1 text-base-content/50">
                <Info className="w-3 h-3" />
                {charCount} caractères | {smsCount} SMS par destinataire
              </span>
              <span className="label-text-alt text-base-content/50">
                {'{{name}} {{phone}} {{email}}'}
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Programmer l'envoi (optionnel)</span>
            </label>
            <input
              type="datetime-local"
              className="input input-bordered"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            />
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={isCreating}>
              {isCreating ? 'Enregistrement...' : campaign ? 'Mettre à jour' : 'Créer la campagne'}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={() => onOpenChange(false)} />
    </div>
  )
}
