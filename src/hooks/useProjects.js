import { useQuery } from '@tanstack/react-query'
import { projectsService } from '../services/projects.service'
import pb from '../lib/pocketbase' // Still needed for useCategories for now

export const useProjects = (userId) => {
  return useQuery({
    queryKey: ['projects', userId],
    queryFn: () => projectsService.getAll(),
    enabled: !!userId,
  })
}

// useCategories moved to src/hooks/useCategories.js
