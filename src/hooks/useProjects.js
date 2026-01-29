import { useQuery } from '@tanstack/react-query'
import pb from '../lib/pocketbase'

export const useProjects = (userId) => {
  return useQuery({
    queryKey: ['projects', userId],
    queryFn: async () => {
      // Assuming collection name is 'projects'
      return await pb.collection('projects').getFullList({
        filter: `user_id = "${userId}"`,
        sort: '-created'
      })
    },
    enabled: !!userId,
  })
}

export const useCategories = (userId) => {
  return useQuery({
    queryKey: ['categories', userId],
    queryFn: async () => {
      // Assuming collection name is 'task_categories'
      return await pb.collection('task_categories').getFullList({
        filter: `user_id = "${userId}"`,
        sort: 'name'
      })
    },
    enabled: !!userId,
  })
}
