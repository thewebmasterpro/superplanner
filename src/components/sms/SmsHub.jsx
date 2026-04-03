import { useState } from 'react'
import {
  MessageSquare, Send, Users, Smartphone, FileText,
  BarChart3, Plus
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { SmsDashboard } from './SmsDashboard'
import { SmsCampaignsList } from './SmsCampaignsList'
import { SmsChat } from './SmsChat'
import { SmsGroupsList } from './SmsGroupsList'
import { SmsDevicesList } from './SmsDevicesList'
import { SmsTemplatesList } from './SmsTemplatesList'

const tabs = [
  { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
  { id: 'campaigns', label: 'Campagnes', icon: Send },
  { id: 'chat', label: 'Chat SMS', icon: MessageSquare },
  { id: 'groups', label: 'Groupes', icon: Users },
  { id: 'devices', label: 'Appareils', icon: Smartphone },
  { id: 'templates', label: 'Templates', icon: FileText },
]

export function SmsHub() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-primary" />
            SMS Hub
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Envoyez des SMS en masse via vos appareils Android
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200/50 p-1 gap-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "tab gap-2 transition-all",
                activeTab === tab.id && "tab-active"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'dashboard' && <SmsDashboard />}
        {activeTab === 'campaigns' && <SmsCampaignsList />}
        {activeTab === 'chat' && <SmsChat />}
        {activeTab === 'groups' && <SmsGroupsList />}
        {activeTab === 'devices' && <SmsDevicesList />}
        {activeTab === 'templates' && <SmsTemplatesList />}
      </div>
    </div>
  )
}
