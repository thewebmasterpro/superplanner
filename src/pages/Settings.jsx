import { useState, useEffect } from 'react'
import { useUserStore } from '../stores/userStore'
import { useTelegramNotifications } from '../hooks/useTelegramNotifications'
import { Settings as SettingsIcon, Save, Bell, Database, Layout, Clock, Globe, Info, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { DataBackupSettings } from '@/components/settings/DataBackupSettings'
import { settingsService } from '../services/settings.service'

export function Settings() {
  const { preferences, setPreferences } = useUserStore()
  const { sendTestNotification } = useTelegramNotifications()

  const handleTestTelegram = async () => {
    const result = await sendTestNotification()
    if (result.success) {
      toast.success('Notification de test envoyée ! Vérifiez Telegram.')
    } else {
      toast.error(`Échec de l'envoi : ${result.error}`)
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
      toast.success('Préférences enregistrées avec succès !')
    } catch (e) {
      console.error(e)
      toast.error('Échec de la sauvegarde : ' + e.message)
    }
  }

  const activeTab = preferences.tab || 'preferences'

  return (
    <div className="flex flex-col h-full gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <SettingsIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight font-display text-primary">Paramètres</h1>
            <p className="text-muted-foreground font-medium">Gérez vos préférences personnelles et vos données.</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs tabs-boxed bg-base-100 p-1 rounded-2xl border border-base-300 shadow-sm w-fit">
        <button
          className={`tab tab-md h-10 gap-2 font-bold transition-all rounded-xl ${activeTab === 'preferences' ? 'tab-active bg-primary text-primary-content shadow-lg' : 'hover:bg-base-200'}`}
          onClick={() => setPreferences({ tab: 'preferences' })}
        >
          <Bell className="w-4 h-4" />
          Préférences
        </button>
        <button
          className={`tab tab-md h-10 gap-2 font-bold transition-all rounded-xl ${activeTab === 'dashboard' ? 'tab-active bg-primary text-primary-content shadow-lg' : 'hover:bg-base-200'}`}
          onClick={() => setPreferences({ tab: 'dashboard' })}
        >
          <Layout className="w-4 h-4" />
          Tableau de bord
        </button>
        <button
          className={`tab tab-md h-10 gap-2 font-bold transition-all rounded-xl ${activeTab === 'data' ? 'tab-active bg-primary text-primary-content shadow-lg' : 'hover:bg-base-200'}`}
          onClick={() => setPreferences({ tab: 'data' })}
        >
          <Database className="w-4 h-4" />
          Données & Sauvegarde
        </button>
      </div>

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="card bg-base-100 shadow-xl border border-base-300 rounded-3xl overflow-hidden">
            <div className="card-body p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-warning/10 rounded-xl text-warning">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="card-title text-xl font-black font-display tracking-tight">Horaires de Prière</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-8">Configurez votre emplacement pour des horaires de prière précis.</p>

              <div className="space-y-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-black uppercase tracking-widest text-[10px] opacity-60">Ville</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full rounded-xl focus:border-primary transition-all font-medium"
                    value={preferences?.prayerLocation?.city || ''}
                    onChange={(e) => setPreferences({
                      prayerLocation: {
                        ...(preferences?.prayerLocation || { country: '' }),
                        city: e.target.value
                      }
                    })}
                    placeholder="ex: Paris"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-black uppercase tracking-widest text-[10px] opacity-60">Pays</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full rounded-xl focus:border-primary transition-all font-medium"
                    value={preferences?.prayerLocation?.country || ''}
                    onChange={(e) => setPreferences({
                      prayerLocation: {
                        ...(preferences?.prayerLocation || { city: '' }),
                        country: e.target.value
                      }
                    })}
                    placeholder="ex: France"
                  />
                </div>
              </div>
              <div className="mt-8 p-4 bg-base-200/50 rounded-2xl border border-base-300 flex items-start gap-3">
                <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
                <span className="text-xs font-medium text-base-content/70 italic">Les horaires sont calculés selon la méthode de la Ligue Islamique Mondiale.</span>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-300 rounded-3xl overflow-hidden">
            <div className="card-body p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Bell className="w-5 h-5" />
                </div>
                <h2 className="card-title text-xl font-black font-display tracking-tight">Notifications Telegram</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-8">Recevez des rappels intelligents pour vos tâches et prières.</p>

              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text font-black uppercase tracking-widest text-[10px] opacity-60">Chat ID Telegram</span>
                </label>
                <div className="join w-full">
                  <input
                    type="text"
                    className="input input-bordered join-item flex-1 rounded-l-xl focus:border-primary transition-all font-medium"
                    value={preferences?.telegram?.chatId || ''}
                    onChange={(e) => setPreferences({
                      telegram: {
                        ...(preferences?.telegram || { enabled: false, advanceMinutes: 30 }),
                        chatId: e.target.value
                      }
                    })}
                    placeholder="123456789"
                  />
                  <button
                    className="btn btn-primary join-item rounded-r-xl font-black uppercase tracking-widest text-xs px-6"
                    onClick={handleTestTelegram}
                    disabled={!preferences?.telegram?.chatId || !preferences?.telegram?.enabled}
                  >
                    Tester
                  </button>
                </div>
                <label className="label">
                  <span className="label-text-alt text-[10px] font-medium text-base-content/50">💡 Envoyez <code className="bg-base-200 px-1 rounded font-black">/start</code> au bot pour obtenir votre ID personnel.</span>
                </label>
              </div>

              <div className="form-control bg-base-200/50 border border-base-300 p-4 rounded-2xl mb-6">
                <label className="label cursor-pointer p-0">
                  <span className="label-text font-bold">Activer les notifications</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={preferences?.telegram?.enabled || false}
                    onChange={(e) => setPreferences({
                      telegram: {
                        ...(preferences?.telegram || { chatId: '', advanceMinutes: 30 }),
                        enabled: e.target.checked
                      }
                    })}
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-black uppercase tracking-widest text-[10px] opacity-60">Délai de rappel (minutes)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full rounded-xl focus:border-primary transition-all font-medium"
                  value={preferences?.telegram?.advanceMinutes || 30}
                  onChange={(e) => setPreferences({
                    telegram: {
                      ...(preferences?.telegram || { chatId: '', enabled: false }),
                      advanceMinutes: parseInt(e.target.value)
                    }
                  })}
                  min="5"
                  max="1440"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="card bg-base-100 shadow-xl border border-base-300 rounded-3xl overflow-hidden">
            <div className="card-body p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-accent/10 rounded-xl text-accent">
                  <Layout className="w-5 h-5" />
                </div>
                <h2 className="card-title text-xl font-black font-display tracking-tight">Outils & Widgets</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-8">Personnalisez les éléments affichés sur votre dashboard principal.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'prayerTimes', label: 'Horaires de Prière', desc: 'Affiche les 5 prières et le compte à rebours', icon: '🕌' },
                  { id: 'quranVerse', label: 'Verset du Jour', desc: 'Inspiration quotidienne du Coran', icon: '📖' },
                  { id: 'focusTools', label: 'Outils Focus', desc: 'Pomodoro et minuteur de tâches', icon: '⚡' },
                  { id: 'spotify', label: 'Lecteur Spotify', desc: 'Musique (nécessite une URL de playlist)', icon: '🎵' },
                  { id: 'stats', label: 'Statistiques', desc: 'Progression et compteurs de tâches', icon: '📊' },
                  { id: 'upcomingTasks', label: 'Tâches à Venir', desc: 'Liste pour aujourd\'hui et demain', icon: '📅' },
                  { id: 'eisenhower', label: 'Matrice Eisenhower', desc: 'Widget des tâches urgentes à faire maintenant', icon: '🎯' },
                  { id: 'scratchpad', label: 'Brouillon', desc: 'Prise de notes rapide avec sauvegarde auto', icon: '✍️' },
                  { id: 'worldClock', label: 'Horloge Mondiale', desc: 'Heure dans plusieurs villes du monde', icon: '🌍' },
                ].map(widget => (
                  <div key={widget.id} className="form-control bg-base-200/50 p-4 rounded-2xl hover:bg-base-200 transition-all border border-transparent hover:border-base-300 group">
                    <label className="label cursor-pointer p-0 flex justify-between gap-4">
                      <div className="flex-1 flex gap-3">
                        <span className="text-xl group-hover:scale-110 transition-transform">{widget.icon}</span>
                        <div>
                          <span className="label-text font-black text-sm block">{widget.label}</span>
                          <span className="text-[10px] font-medium opacity-60 block leading-tight">{widget.desc}</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm"
                        checked={preferences?.dashboardWidgets?.[widget.id] ?? true}
                        onChange={(e) => setPreferences({
                          dashboardWidgets: {
                            ...(preferences?.dashboardWidgets || {}),
                            [widget.id]: e.target.checked
                          }
                        })}
                      />
                    </label>
                  </div>
                ))}
              </div>

              {preferences?.dashboardWidgets?.worldClock !== false && (
                <div className="mt-12 p-8 bg-base-200/30 rounded-3xl border border-dashed border-base-300">
                  <div className="flex items-center gap-3 mb-6">
                    <Globe className="w-5 h-5 opacity-50 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-60">Villes de l'horloge mondiale</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[0, 1, 2].map(index => {
                      const currentCity = preferences?.world_clock_cities?.[index]
                      return (
                        <div key={index} className="space-y-3">
                          <input
                            className="input input-bordered input-md w-full bg-base-100 rounded-xl font-bold text-sm focus:border-primary transition-all"
                            placeholder="Rechercher une ville..."
                            defaultValue={currentCity?.city || ''}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                const val = e.currentTarget.value
                                if (!val) return
                                e.preventDefault()
                                const toastId = toast.loading('Recherche...')
                                try {
                                  const { searchCityTimezone } = await import('../services/prayerTimesApi')
                                  const result = await searchCityTimezone(val)
                                  toast.dismiss(toastId)
                                  toast.success(`Trouvé: ${result.city}`)
                                  const newCities = [...(preferences?.world_clock_cities || [])]
                                  while (newCities.length <= index) newCities.push(null)
                                  newCities[index] = {
                                    label: result.city,
                                    city: result.city,
                                    value: result.timezone,
                                    timezone: result.timezone,
                                    country: result.country
                                  }
                                  setPreferences({ world_clock_cities: newCities })
                                  await settingsService.updatePreferences({ ...preferences, world_clock_cities: newCities })
                                } catch (err) {
                                  toast.dismiss(toastId)
                                  toast.error('Ville non trouvée')
                                }
                              }
                            }}
                          />
                          {currentCity?.timezone ? (
                            <div className="badge badge-primary badge-outline text-[10px] font-black uppercase gap-1 px-3 h-6">
                              <div className="w-1 h-1 rounded-full bg-primary animate-pulse"></div>
                              {currentCity.timezone}
                            </div>
                          ) : (
                            <div className="text-[10px] font-bold opacity-30 px-1 uppercase tracking-widest italic">Aucune ville sélectionnée</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="divider my-12 opacity-50">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  <span className="font-black uppercase tracking-widest text-xs">Grille d'Inspiration</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { id: 'inspiration_growth', label: 'Growth Hack 🚀', desc: 'Astuce Croissance' },
                  { id: 'inspiration_bias', label: 'Biais Cognitif 🧠', desc: 'Psychologie & Vente' },
                  { id: 'inspiration_business', label: 'Business Tip 💼', desc: 'Stratégie & Croissance' },
                  { id: 'inspiration_body', label: 'Corps Humain 💖', desc: 'Secrets de ton corps' },
                  { id: 'inspiration_quran', label: 'Verset du Jour 📖', desc: 'Parole sacrée' },
                  { id: 'inspiration_challenge', label: 'Défi du Jour 🎯', desc: 'Passe à l\'action' },
                  { id: 'inspiration_tip', label: 'Conseil Prod ⚡', desc: 'Booster productivité' },
                  { id: 'inspiration_zen', label: 'Minute Zen 🌬️', desc: 'Respire un coup' },
                  { id: 'inspiration_word', label: 'Mot du Jour 📚', desc: 'Enrichir vocabulaire' },
                  { id: 'inspiration_quote', label: 'Citation 💬', desc: 'Sagesse & motivation' },
                  { id: 'inspiration_joke', label: 'Blague 💡', desc: 'Un peu d\'humour' },
                  { id: 'inspiration_fact', label: 'Savoir Inutile 🧠', desc: 'Culture générale' }
                ].map(widget => (
                  <div key={widget.id} className="flex items-center justify-between bg-base-200/50 p-4 rounded-xl border border-transparent hover:border-base-300 transition-all hover:bg-base-200 group">
                    <div className="flex-1">
                      <span className="text-[11px] font-black block uppercase tracking-tight group-hover:text-primary transition-colors">{widget.label}</span>
                      <span className="text-[10px] font-medium opacity-50 block">{widget.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm border-base-300 bg-base-200 checked:border-primary checked:bg-primary checked:text-primary-content rounded-lg"
                      checked={preferences?.dashboardWidgets?.[widget.id] ?? true}
                      onChange={(e) => setPreferences({
                        dashboardWidgets: {
                          ...(preferences?.dashboardWidgets || {}),
                          [widget.id]: e.target.checked
                        }
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data & Backup Tab */}
      {activeTab === 'data' && (
        <div className="card bg-base-100 shadow-xl border border-base-300 rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="card-body p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-error/10 rounded-xl text-error">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="card-title text-xl font-black font-display tracking-tight">Sauvegarde & Export</h2>
            </div>
            <DataBackupSettings />
          </div>
        </div>
      )}

      {/* Floating Save Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={savePreferences}
          className="btn btn-primary btn-lg shadow-2xl gap-3 font-black px-10 rounded-2xl h-16 hover:scale-105 transition-all text-sm uppercase tracking-widest"
        >
          <Save className="w-5 h-5" />
          Enregistrer
        </button>
      </div>
    </div>
  )
}
