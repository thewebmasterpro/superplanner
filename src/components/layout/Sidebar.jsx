import SpotifyPlayer from '../SpotifyPlayer'

export function Sidebar() {
  const { isSidebarOpen, setSidebarOpen } = useUIStore()
  const { preferences } = useUserStore()
  const currentPath = window.location.pathname

  const menuItems = [
    { label: 'Dashboard', icon: Home, href: '/' },
    { label: 'Tasks', icon: CheckSquare, href: '/tasks' },
    { label: 'Calendar', icon: Calendar, href: '/calendar' },
    {
      label: 'Campaigns',
      icon: BarChart3,
      href: '/campaigns',
      disabled: !preferences.enableCampaigns,
      badge: !preferences.enableCampaigns ? 'Disabled' : null
    },
    { label: 'Settings', icon: Settings, href: '/settings' },
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
                  flex items-center gap-3 px-4 py-2 rounded-md transition-colors
                  ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : isDisabled
                      ? 'opacity-50 cursor-not-allowed text-muted-foreground'
                      : 'hover:bg-muted text-foreground'
                  }
                `}
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
