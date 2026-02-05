import { useQuery } from '@tanstack/react-query'
import { campaignsService } from '../services/campaigns.service'

export function useCampaigns() {
    return useQuery({
        queryKey: ['campaigns'],
        queryFn: () => campaignsService.getAll()
    })
}
