import { Menu, Settings, LogOut, User, Plus, CheckSquare, Calendar, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUIStore } from '../../stores/uiStore'
import { useUserStore } from '../../stores/userStore'
import { useState, useEffect, useRef } from 'react'
import { TaskModal } from '../TaskModal'
import { CampaignModal } from '../CampaignModal'
import { ContactModal } from '../ContactModal'
import { supabase } from '../../lib/supabase'
import { ThemeToggle } from '../ThemeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Navbar() {
  const {
    isSidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    isTaskModalOpen,
    setTaskModalOpen,
    isCampaignModalOpen,
    setCampaignModalOpen,
    isContactModalOpen,
    setContactModalOpen,
    searchQuery,
    setSearchQuery
  } = useUIStore()
  const { user } = useUserStore()
  const [selectedTask, setSelectedTask] = useState(null)
  const searchInputRef = useRef(null)
  const currentPath = window.location.pathname || '/'

  // Keyboard shortcut CMD+K for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const getPageTitle = () => {
    switch (currentPath) {
      case '/': return 'Dashboard'
      case '/tasks': return 'Tasks'
      case '/meetings': return 'Meetings'
      case '/contacts': return 'Contacts'
      case '/calendar': return 'Calendar'
      case '/campaigns': return 'Campaigns'
      case '/team': return 'Team'
      case '/settings': return 'Settings'
      case '/archive': return 'Archive'
      case '/trash': return 'Trash'
      default: return 'Superplanner'
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const openCreateModal = (type) => {
    if (type === 'task' || type === 'meeting') {
      setSelectedTask({ type })
      setTaskModalOpen(true)
    } else if (type === 'campaign') {
      setCampaignModalOpen(true)
    } else if (type === 'client') {
      setContactModalOpen(true)
    }
  }

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container-tight h-16 flex items-center justify-between">
        {/* Left - Menu toggle */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleSidebar()}
            className="flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: isSidebarOpen ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {isSidebarOpen ? <Menu className="w-5 h-5" /> : <Plus className="w-5 h-5 rotate-45" />}
            </motion.div>
          </Button>

          <div className="flex items-center gap-2">
            {!isSidebarOpen && (
              <span className="text-xl font-bold text-foreground hidden sm:inline-block"> Superplanner </span>
            )}
            {!isSidebarOpen && <span className="text-muted-foreground/40 hidden sm:inline-block">/</span>}
            <h1 className="text-lg font-semibold text-foreground">{getPageTitle()}</h1>
          </div>
        </div>

        {/* Global Search Center */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search across Superplanner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 bg-muted/50 border-transparent focus:bg-background focus:border-primary/20 transition-all rounded-full h-10"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-medium text-muted-foreground pointer-events-none opacity-50 group-focus-within:opacity-0 transition-opacity">
            ⌘K
          </div>
        </div>

        {/* Right - User menu */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="hidden sm:flex gap-2 font-semibold px-4">
                <Plus className="w-4 h-4" />
                <span>New content</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Create New</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openCreateModal('task')}>
                <CheckSquare className="w-4 h-4 mr-2" />
                New Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateModal('meeting')}>
                <Calendar className="w-4 h-4 mr-2" />
                New Meeting
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openCreateModal('campaign')}>
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateModal('client')}>
                <User className="w-4 h-4 mr-2" />
                New Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = '/settings'}
          >
            <Settings className="w-5 h-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.email || 'My Account'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={(open) => {
          setTaskModalOpen(open)
          if (!open) setSelectedTask(null)
        }}
        task={selectedTask}
      />
      <CampaignModal
        open={isCampaignModalOpen}
        onOpenChange={setCampaignModalOpen}
        onSuccess={() => window.location.reload()}
      />
      <ContactModal
        open={isContactModalOpen}
        onOpenChange={setContactModalOpen}
      />
    </nav>
  )
}
