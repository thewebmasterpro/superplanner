import { Menu, Settings, LogOut, User, Plus, CheckSquare, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUIStore } from '../../stores/uiStore'
import { useUserStore } from '../../stores/userStore'
import { useState } from 'react'
import { TaskModal } from '../TaskModal'
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

export function Navbar() {
  const { isSidebarOpen, toggleSidebar, setSidebarOpen, isTaskModalOpen, setTaskModalOpen } = useUIStore()
  const { user } = useUserStore()
  const [selectedTask, setSelectedTask] = useState(null)
  const currentPath = window.location.pathname || '/'

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
    setSelectedTask({ type })
    setTaskModalOpen(true)
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

        {/* Right - User menu */}
        <div className="flex items-center gap-2">
          {/* Quick Create Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="hidden sm:flex gap-2">
                <Plus className="w-4 h-4" />
                <span>New</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Quick Create</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openCreateModal('task')}>
                <CheckSquare className="w-4 h-4 mr-2" />
                New Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateModal('meeting')}>
                <Calendar className="w-4 h-4 mr-2" />
                New Meeting
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
        onOpenChange={setTaskModalOpen}
        task={selectedTask}
      />
    </nav>
  )
}
