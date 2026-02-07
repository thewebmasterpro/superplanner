import { useQuery } from '@tanstack/react-query'
import { campaignsService } from '../services/campaigns.service'
import { useWorkspaceStore } from '../stores/workspaceStore'

export function useCampaigns() {
    const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)

    return useQuery({
        queryKey: ['campaigns', activeWorkspaceId],
        queryFn: () => campaignsService.getAll({ workspaceId: activeWorkspaceId })
    })
}
