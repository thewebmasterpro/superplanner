import { useState } from 'react'
import { WorkspaceManager } from '../components/WorkspaceManager'
import { CategoryManager } from '../components/CategoryManager'
import { ProjectManager } from '../components/ProjectManager'
import { TagManager } from '../components/TagManager'
import { Layout, Building, FolderKanban, Tags, ListTree } from 'lucide-react'

export function Workspace() {
    const [activeTab, setActiveTab] = useState('workspaces')

    const tabs = [
        { id: 'workspaces', label: 'Workspaces', icon: Building, component: WorkspaceManager },
        { id: 'projects', label: 'Départements', icon: FolderKanban, component: ProjectManager },
        { id: 'categories', label: 'Catégories', icon: ListTree, component: CategoryManager },
        { id: 'tags', label: 'Tags', icon: Tags, component: TagManager },
    ]

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || WorkspaceManager

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display flex items-center gap-2 text-primary">
                        <Layout className="w-8 h-8" />
                        Configuration
                    </h1>
                    <p className="text-muted-foreground">Gérez vos espaces, départements et métadonnées.</p>
                </div>
            </div>

            {/* Tabs */}
            <div data-tour="workspace-tabs" className="bg-base-200 p-1 rounded-xl flex overflow-x-auto gap-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            className={`btn btn-sm flex-1 gap-2 ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Content */}
            <div data-tour="workspace-content" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ActiveComponent />
            </div>
        </div>
    )
}
