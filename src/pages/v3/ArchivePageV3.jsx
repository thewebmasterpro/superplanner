import DashboardLayoutV3 from '../../components/layout/DashboardLayoutV3'
import { ArchivePage } from '../Archive'
import { Archive } from 'lucide-react'

export default function ArchivePageV3() {
    return (
        <DashboardLayoutV3>
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-4 pt-4">
                    <Archive className="w-6 h-6 text-info" />
                    <h1 className="text-2xl font-bold font-display">Archives</h1>
                </div>
                <ArchivePage />
            </div>
        </DashboardLayoutV3>
    )
}
