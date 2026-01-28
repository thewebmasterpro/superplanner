import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkspaceManager } from '../components/WorkspaceManager'
import { CategoryManager } from '../components/CategoryManager'
import { ProjectManager } from '../components/ProjectManager'
import { TagManager } from '../components/TagManager'
import { Layout, Building, FolderKanban, Tags, ListTree } from 'lucide-react'

export function Workspace() {
    return (
        <div className="container-tight py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                    <Layout className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight font-display">Workspace Setup</h1>
                    <p className="text-muted-foreground font-medium">Manage your workspaces, projects, and metadata</p>
                </div>
            </div>
            <Tabs defaultValue="workspaces" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-xl h-12 w-full justify-start overflow-x-auto no-scrollbar">
                    <TabsTrigger value="workspaces" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">
                        <Building className="w-4 h-4 mr-2" />
                        Workspaces
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">
                        <FolderKanban className="w-4 h-4 mr-2" />
                        Projects
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">
                        <ListTree className="w-4 h-4 mr-2" />
                        Categories
                    </TabsTrigger>
                    <TabsTrigger value="tags" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">
                        <Tags className="w-4 h-4 mr-2" />
                        Tags
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="workspaces" className="space-y-4 outline-none">
                    <WorkspaceManager />
                </TabsContent>

                <TabsContent value="projects" className="space-y-4 outline-none">
                    <ProjectManager />
                </TabsContent>

                <TabsContent value="categories" className="space-y-4 outline-none">
                    <CategoryManager />
                </TabsContent>

                <TabsContent value="tags" className="space-y-4 outline-none">
                    <TagManager />
                </TabsContent>
            </Tabs >
        </div >
    )
}
