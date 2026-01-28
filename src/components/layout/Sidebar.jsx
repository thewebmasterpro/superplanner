import { Home, CheckSquare, Calendar, BarChart3, Settings, X, Users, Archive, Trash2, Building, Video, ChevronLeft, Layout } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import { useUserStore } from '../../stores/userStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SpotifyPlayer from '../SpotifyPlayer'
import { WorkspaceSelector } from '../WorkspaceSelector'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { motion, AnimatePresence } from 'framer-motion'

export function Sidebar() {
  const { isSidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore()
  const { preferences } = useUserStore()
  const { getActiveWorkspace } = useWorkspaceStore()
  const currentPath = window.location.pathname
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

  const activeWorkspace = getActiveWorkspace()

  const menuItems = [
    { label: 'Dashboard', icon: Home, href: '/' },
    { label: 'Tasks', icon: CheckSquare, href: '/tasks' },
    { label: 'Meetings', icon: Video, href: '/meetings' },
    { label: 'Contacts', icon: Users, href: '/contacts' },
    { label: 'Pipeline', icon: BarChart3, href: '/pipeline' },
    { label: 'Calendar', icon: Calendar, href: '/calendar' },
    {
      label: 'Campaigns',
      icon: BarChart3,
      href: '/campaigns',
      disabled: false,
      badge: null
    },
    { label: 'Team', icon: Building, href: '/team' },
    { label: 'Workspace', icon: Layout, href: '/workspace' },
    { label: 'Settings', icon: Settings, href: '/settings' },
    { label: 'Archive', icon: Archive, href: '/archive', badge: null },
    { label: 'Trash', icon: Trash2, href: '/trash', badge: null }
  ]

  const sidebarVariants = {
    open: {
      x: 0,
      width: 256,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    closed: {
      x: isMobile ? -256 : -256,
      width: isMobile ? 256 : 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={isSidebarOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50 border-r border-border bg-card
          flex flex-col overflow-hidden
        `}
      >
        {/* Close button mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 lg:hidden"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Slide-out indicator (desktop only) */}
        {!isMobile && isSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-2 hidden lg:flex h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Logo */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-primary">🚀 Superplanner</h2>
        </div>

        {/* Workspace Selector */}
        <div className="p-3 border-b border-border bg-muted/30">
          <WorkspaceSelector />
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
                  if (isMobile) setSidebarOpen(false)
                }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 tap-target
                  ${isActive
                    ? 'font-medium bg-primary/10'
                    : isDisabled
                      ? 'opacity-50 cursor-not-allowed text-muted-foreground'
                      : 'hover:bg-muted text-foreground'
                  }
                `}
                style={isActive && activeWorkspace ? {
                  color: activeWorkspace.color,
                  backgroundColor: `${activeWorkspace.color}15`,
                  borderRight: `3px solid ${activeWorkspace.color}`
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

        {/* Version Display */}
        <div className="p-2 text-center text-[10px] text-muted-foreground/40 font-mono">
          v1.1.0
        </div>
      </motion.aside>
    </>
  )
}
