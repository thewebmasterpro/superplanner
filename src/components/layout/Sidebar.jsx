import { Home, CheckSquare, Calendar, BarChart3, Settings, X, Users, Archive, Trash2, Building } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import { useUserStore } from '../../stores/userStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SpotifyPlayer from '../SpotifyPlayer'
import { ContextSelector } from '../ContextSelector'
import { useContextStore } from '../../stores/contextStore'

export function Sidebar() {
  const { isSidebarOpen, setSidebarOpen } = useUIStore()
  const { preferences } = useUserStore()
  const { getActiveContext } = useContextStore()
  const currentPath = window.location.pathname

  const activeContext = getActiveContext()

  const menuItems = [
    { label: 'Dashboard', icon: Home, href: '/' },
    { label: 'Tasks', icon: CheckSquare, href: '/tasks' },
    { label: 'Contacts', icon: Users, href: '/contacts' },
    { label: 'Calendar', icon: Calendar, href: '/calendar' },
    {
      label: 'Campaigns',
      icon: BarChart3,
      href: '/campaigns',
      disabled: false,
      badge: null
    },
    { label: 'Team', icon: Building, href: '/team' },
    { label: 'Settings', icon: Settings, href: '/settings' },
    { label: 'Archive', icon: Archive, href: '/archive', badge: null },
    { label: 'Trash', icon: Trash2, href: '/trash', badge: null }
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative top-0 left-0 h-screen z-50 w-64 border-r border-border bg-card
        transition-all duration-200 lg:translate-x-0 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close button mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 lg:hidden"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Logo */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-primary">🚀 Superplanner</h2>
        </div>

        {/* Context Selector */}
        <div className="p-3 border-b border-border bg-muted/30">
          <ContextSelector />
        </div>

        {/* Menu items */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isDisabled = item.disabled
            const isActive = currentPath === item.href

            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  if (isDisabled) e.preventDefault()
                  setSidebarOpen(false) // Close on mobile
                }}
                className={`
                  flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200
                  ${isActive
                    ? 'font-medium bg-primary/10'
                    : isDisabled
                      ? 'opacity-50 cursor-not-allowed text-muted-foreground'
                      : 'hover:bg-muted text-foreground'
                  }
                `}
                style={isActive && activeContext ? {
                  color: activeContext.color,
                  backgroundColor: `${activeContext.color}15`,
                  borderRight: `3px solid ${activeContext.color}`
                } : isActive ? {
                  color: 'var(--primary)',
                  backgroundColor: 'var(--secondary)'
                } : {}}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </a>
            )
          })}
        </nav>

        {/* Spotify Player in Sidebar */}
        {preferences?.spotify_playlist_url && preferences?.dashboardWidgets?.spotify !== false && (
          <div className="p-4 border-t border-border">
            <SpotifyPlayer playlistUrl={preferences.spotify_playlist_url} />
          </div>
        )}
      </aside>
    </>
  )
}
