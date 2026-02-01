import DashboardLayoutV3 from '../../components/layout/DashboardLayoutV3'
import { Trash } from '../Trash'
import { Trash2 } from 'lucide-react'

export default function TrashPageV3() {
    return (
        <DashboardLayoutV3>
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-4 pt-4">
                    <Trash2 className="w-6 h-6 text-error" />
                    <h1 className="text-2xl font-bold font-display">Corbeille</h1>
                </div>
                <Trash />
            </div>
        </DashboardLayoutV3>
    )
}
