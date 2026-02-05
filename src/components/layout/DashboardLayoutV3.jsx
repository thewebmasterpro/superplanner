import SidebarV3 from './SidebarV3'
import TopBar from './TopBar'
import { GlobalTimerHandler } from '../GlobalTimerHandler'
import { TaskModal } from '../TaskModal'
import { ContactModal } from '../ContactModal'
import { BugReportModal } from '../BugReportModal'
import { useUIStore } from '../../stores/uiStore'

export default function DashboardLayoutV3({ children }) {
    const {
        isTaskModalOpen, setTaskModalOpen, modalTask,
        isContactModalOpen, setContactModalOpen,
    } = useUIStore()

    return (
        <div className="drawer md:drawer-open relative bg-slate-950">
            {/* Animated gradient background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900"></div>
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-600/25 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-3xl"></div>
            </div>

            <GlobalTimerHandler />
            <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />

            {/* Main content area */}
            <div className="drawer-content min-h-screen bg-transparent font-sans text-white relative z-10">
                {/* Mobile Header */}
                <div className="md:hidden navbar backdrop-blur-xl bg-black/30 shadow-sm sticky top-0 z-30 border-b border-white/10">
                    <div className="flex-1">
                        <a className="btn btn-ghost text-xl font-bold">Hagen Tasks V3</a>
                    </div>
                    <div className="flex-none">
                        <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </label>
                    </div>
                </div>

                {/* Quick Actions Top Bar */}
                <TopBar />

                {/* Main Content */}
                <main className="p-4 md:p-6 min-h-screen max-w-[1400px] mx-auto space-y-6">
                    {children}
                </main>
            </div>

            {/* Drawer Sidebar (mobile: slide-in, desktop: always visible) */}
            <div className="drawer-side z-40">
                <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
                <div className="w-72 min-h-full">
                    <SidebarV3 />
                </div>
            </div>

            {/* Global Modals */}
            <TaskModal open={isTaskModalOpen} onOpenChange={setTaskModalOpen} task={modalTask} />
            <ContactModal open={isContactModalOpen} onOpenChange={setContactModalOpen} contact={null} />
            <BugReportModal />
        </div>
    )
}
