import { useQuery } from '@tanstack/react-query'
import { projectsService } from '../services/projects.service'
import { useWorkspaceStore } from '../stores/workspaceStore'

export const useProjects = (userId) => {
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)

  return useQuery({
    queryKey: ['projects', userId, activeWorkspaceId],
    queryFn: () => projectsService.getAll({ workspaceId: activeWorkspaceId }),
    enabled: !!userId,
  })
}
