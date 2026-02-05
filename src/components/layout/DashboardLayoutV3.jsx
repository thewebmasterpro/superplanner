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
        <div className="drawer md:drawer-open">
            <GlobalTimerHandler />
            <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />

            {/* Main content area */}
            <div className="drawer-content min-h-screen bg-base-200 font-sans text-base-content">
                {/* Mobile Header */}
                <div className="md:hidden navbar bg-base-100 shadow-sm sticky top-0 z-30">
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
