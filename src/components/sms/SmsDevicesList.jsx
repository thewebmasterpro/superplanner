import { useState } from 'react'
import { Plus, Smartphone, MoreVertical, Trash2, Edit2, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { useSmsDevices } from '../../hooks/useSms'
import { SmsDeviceModal } from './SmsDeviceModal'
import { format } from 'date-fns'

export function SmsDevicesList() {
  const { devices, isLoading, deleteDevice } = useSmsDevices()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState(null)
  const [menuOpenId, setMenuOpenId] = useState(null)

  const handleEdit = (device) => {
    setEditingDevice(device)
    setIsModalOpen(true)
    setMenuOpenId(null)
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer cet appareil ?')) return
    deleteDevice(id)
    setMenuOpenId(null)
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
        <h2 className="text-lg font-semibold">Mes Appareils</h2>
        <button
          onClick={() => { setEditingDevice(null); setIsModalOpen(true) }}
          className="btn btn-primary btn-sm gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un appareil
        </button>
      </div>

      {devices.length === 0 ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center py-12">
            <Smartphone className="w-16 h-16 text-base-content/20 mb-4" />
            <h3 className="text-lg font-semibold">Aucun appareil</h3>
            <p className="text-sm text-base-content/60 max-w-sm">
              Ajoutez votre premier appareil Android pour commencer à envoyer des SMS.
              Chaque appareil utilise sa propre carte SIM.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary btn-sm mt-4 gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un appareil
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map(device => (
            <div key={device.id} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${device.status === 'active' ? 'bg-success/10' : 'bg-base-200'}`}>
                      <Smartphone className={`w-6 h-6 ${device.status === 'active' ? 'text-success' : 'text-base-content/40'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{device.name}</h3>
                      <p className="text-xs text-base-content/60">{device.phone_number}</p>
                    </div>
                  </div>

                  <div className="dropdown dropdown-end">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === device.id ? null : device.id)}
                      className="btn btn-ghost btn-xs btn-circle"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpenId === device.id && (
                      <ul className="dropdown-content z-50 menu p-2 shadow-lg bg-base-100 rounded-xl w-44">
                        <li>
                          <button onClick={() => handleEdit(device)} className="gap-2">
                            <Edit2 className="w-4 h-4" /> Modifier
                          </button>
                        </li>
                        <li>
                          <button onClick={() => handleDelete(device.id)} className="gap-2 text-error">
                            <Trash2 className="w-4 h-4" /> Supprimer
                          </button>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  {device.status === 'active' ? (
                    <span className="badge badge-success badge-sm gap-1">
                      <Wifi className="w-3 h-3" /> Connecté
                    </span>
                  ) : (
                    <span className="badge badge-ghost badge-sm gap-1">
                      <WifiOff className="w-3 h-3" /> Hors ligne
                    </span>
                  )}
                  {device.model && (
                    <span className="badge badge-ghost badge-sm">{device.model}</span>
                  )}
                </div>

                {device.created && (
                  <p className="text-xs text-base-content/40 mt-2">
                    Ajouté le {format(new Date(device.created), 'dd/MM/yyyy')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <SmsDeviceModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        device={editingDevice}
      />
    </div>
  )
}
