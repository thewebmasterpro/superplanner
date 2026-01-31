import { useQuery } from '@tanstack/react-query'
import { categoriesService } from '../services/categories.service'

export function useCategories(userId) {
    return useQuery({
        queryKey: ['categories', userId],
        queryFn: () => categoriesService.getAll(), // Service handles fetching (and auth check via pb instance usually, though passing userId is good practice for queryKey)
        enabled: !!userId,
    })
}
