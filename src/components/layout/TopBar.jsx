import { Plus, Video, Contact, Bug, HelpCircle } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import { useTour } from '../../hooks/useTour'

export default function TopBar() {
  const {
    setTaskModalOpen,
    setModalTask,
    setContactModalOpen,
    setBugModalOpen,
  } = useUIStore()

  const { replayTour, hasTour } = useTour()

  const handleNewTask = () => {
    setModalTask({ type: 'task' })
    setTaskModalOpen(true)
  }

  const handleNewMeeting = () => {
    setModalTask({ type: 'meeting' })
    setTaskModalOpen(true)
  }

  const handleNewContact = () => {
    setContactModalOpen(true)
  }

  const handleBugReport = () => {
    setBugModalOpen(true)
  }

  return (
    <div className="md:sticky md:top-0 z-20 bg-base-100/80 backdrop-blur-md border-b border-base-300">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 md:gap-2 flex-wrap" data-tour="topbar-actions">
          <button
            onClick={handleNewTask}
            className="btn btn-xs md:btn-sm gap-1 md:gap-2 shadow-none transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tache</span>
          </button>

          <button
            onClick={handleNewMeeting}
            className="btn btn-xs md:btn-sm gap-1 md:gap-2 shadow-none transition-transform hover:scale-105 active:scale-95"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reunion</span>
          </button>

          <button
            onClick={handleNewContact}
            className="btn btn-xs md:btn-sm gap-1 md:gap-2 shadow-none transition-transform hover:scale-105 active:scale-95"
          >
            <Contact className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Contact</span>
          </button>

          <button
            onClick={handleBugReport}
            className="btn btn-ghost btn-xs md:btn-sm gap-1 md:gap-2 shadow-none transition-transform hover:scale-105 active:scale-95"
          >
            <Bug className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Bug</span>
          </button>
        </div>

        {hasTour && (
          <button
            onClick={replayTour}
            className="btn btn-ghost btn-xs md:btn-sm gap-1 md:gap-2 shadow-none transition-transform hover:scale-105 active:scale-95"
            title="Rejouer le guide de cette page"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Guide</span>
          </button>
        )}
      </div>
    </div>
  )
}
