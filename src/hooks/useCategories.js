import { useQuery } from '@tanstack/react-query'
import { categoriesService } from '../services/categories.service'
import { useWorkspaceStore } from '../stores/workspaceStore'

export function useCategories(userId) {
    const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)

    return useQuery({
        queryKey: ['categories', userId, activeWorkspaceId],
        queryFn: () => categoriesService.getAll({ workspaceId: activeWorkspaceId }),
        enabled: !!userId,
    })
}
