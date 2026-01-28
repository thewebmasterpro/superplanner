import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { Toaster } from 'react-hot-toast'
import { GlobalTimerHandler } from '../GlobalTimerHandler'
import { useEffect } from 'react'
import { useUIStore } from '../../stores/uiStore'

export function MainLayout({ children }) {
  const { toggleSidebar } = useUIStore()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <GlobalTimerHandler />
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto pb-12">
          {children}
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  )
}
