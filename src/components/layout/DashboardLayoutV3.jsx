import SidebarV3 from './SidebarV3'

export default function DashboardLayoutV3({ children }) {
    return (
        <div className="min-h-screen bg-base-200 font-sans text-base-content">
            {/* Mobile Header */}
            <div className="md:hidden navbar bg-base-100 shadow-sm">
                <div className="flex-1">
                    <a className="btn btn-ghost text-xl font-bold">Hagen Tasks V3</a>
                </div>
                <div className="flex-none">
                    <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost drawer-button lg:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </label>
                </div>
            </div>

            {/* Main Grid Layout for Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 md:p-6 min-h-screen max-w-[1600px] mx-auto">

                {/* Sidebar (Desktop) */}
                <div className="hidden md:block md:col-span-3 lg:col-span-2">
                    <SidebarV3 />
                </div>

                {/* Main Content */}
                <main className="md:col-span-9 lg:col-span-10 space-y-6">
                    {children}
                </main>
            </div>

            {/* Mobile Drawer (optional/if needed for better mobile exp) - simplistic mostly-css approach */}
        </div>
    )
}
