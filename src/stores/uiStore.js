import { create } from 'zustand'

export const useUIStore = create((set) => ({
  // Modals
  isTaskModalOpen: false,
  setTaskModalOpen: (open) => set({ isTaskModalOpen: open }),
  
  isCampaignModalOpen: false,
  setCampaignModalOpen: (open) => set({ isCampaignModalOpen: open }),
  
  // Sidebar
  isSidebarOpen: true,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  
  // Toasts (basic tracking)
  toasts: [],
  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { ...toast, id: Date.now() }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),
  
  // Loading states
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}))
