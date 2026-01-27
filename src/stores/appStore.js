import { create } from 'zustand'

export const useAppStore = create((set) => ({
  // Tasks
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  
  // Filters
  filters: {
    status: null,
    priority: null,
    projectId: null,
    categoryId: null,
    dateRange: null,
  },
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  // Sort
  sortBy: 'due_date', // 'due_date', 'priority', 'status'
  setSortBy: (sortBy) => set({ sortBy }),
  
  // View mode
  viewMode: 'list', // 'list', 'kanban', 'calendar'
  setViewMode: (viewMode) => set({ viewMode }),
  
  // Selected task
  selectedTaskId: null,
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
}))
