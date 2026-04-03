import { useState, useEffect } from 'react'
import { Smartphone, X } from 'lucide-react'
import { useSmsDevices } from '../../hooks/useSms'

export function SmsDeviceModal({ open, onOpenChange, device = null }) {
  const { createDevice, updateDevice, isCreating } = useSmsDevices()
  const [form, setForm] = useState({ name: '', phone_number: '', model: '', api_key: '' })

  useEffect(() => {
    if (device) {
      setForm({
        name: device.name || '',
        phone_number: device.phone_number || '',
        model: device.model || '',
        api_key: device.api_key || ''
      })
    } else {
      setForm({ name: '', phone_number: '', model: '', api_key: '' })
    }
  }, [device, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.phone_number) return

    if (device) {
      updateDevice({ id: device.id, ...form })
    } else {
      createDevice(form)
    }
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <button
          onClick={() => onOpenChange(false)}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-bold text-lg flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" />
          {device ? 'Modifier l\'appareil' : 'Ajouter un appareil'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Nom de l'appareil *</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Samsung Galaxy S24"
              className="input input-bordered"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Numéro de téléphone *</span>
            </label>
            <input
              type="tel"
              placeholder="+33 6 12 34 56 78"
              className="input input-bordered"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Modèle</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Android 14"
              className="input input-bordered"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Clé API (optionnel)</span>
            </label>
            <input
              type="text"
              placeholder="Clé d'authentification de l'appareil"
              className="input input-bordered"
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/50">
                Utilisée pour authentifier l'appareil via l'API
              </span>
            </label>
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={isCreating}>
              {isCreating ? 'Enregistrement...' : device ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={() => onOpenChange(false)} />
    </div>
  )
}
