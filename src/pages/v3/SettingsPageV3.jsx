import DashboardLayoutV3 from '../../components/layout/DashboardLayoutV3'
import { Settings, Save, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export default function SettingsPageV3() {
    const [theme, setTheme] = useState('dark')

    const themes = ["light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula", "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee", "winter", "dim", "nord", "sunset"]

    return (
        <DashboardLayoutV3>
            <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
                <div>
                    <h1 className="text-3xl font-bold font-display flex items-center gap-2">
                        <Settings className="w-8 h-8 text-primary" />
                        Paramètres
                    </h1>
                    <p className="text-muted-foreground">Personnalisez votre expérience Superplanner V3.</p>
                </div>

                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title mb-4">Apparence</h2>

                        <div className="form-control w-full max-w-xs">
                            <label className="label">
                                <span className="label-text">Select Theme</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={theme}
                                onChange={(e) => {
                                    setTheme(e.target.value)
                                    document.documentElement.setAttribute('data-theme', e.target.value)
                                }}
                            >
                                {themes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                        </div>

                        <div className="alert alert-info mt-6 shadow-sm">
                            <AlertTriangle className="w-6 h-6" />
                            <div>
                                <h3 className="font-bold">Note Beta</h3>
                                <div className="text-xs">
                                    Les paramètres complets (préférences, notifications, données) sont en cours de migration depuis la V2.
                                    Utilisez la V2 pour les changements critiques pour l'instant.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayoutV3>
    )
}
