import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { Toaster } from 'react-hot-toast'
import { GlobalTimerHandler } from '../GlobalTimerHandler'

export function MainLayout({ children }) {
  return (
    <div className="flex h-screen bg-background">
      <GlobalTimerHandler />
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  )
}
