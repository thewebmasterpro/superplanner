import { create } from 'zustand'

export const useUIStore = create((set) => ({
  // Modals
  isTaskModalOpen: false,
  setTaskModalOpen: (open) => set({ isTaskModalOpen: open }),

  isCampaignModalOpen: false,
  setCampaignModalOpen: (open) => set({ isCampaignModalOpen: open }),

  isContactModalOpen: false,
  setContactModalOpen: (open) => set({ isContactModalOpen: open }),

  // Global Task Modal State
  modalTask: null,
  setModalTask: (task) => set({ modalTask: task }),

  // Sidebar
  isSidebarOpen: (() => {
    const saved = localStorage.getItem('superplanner-sidebar-open')
    if (saved !== null) return saved === 'true'
    return window.innerWidth > 1024 // Default to open on desktop, closed on mobile
  })(),
  setSidebarOpen: (open) => {
    localStorage.setItem('superplanner-sidebar-open', open)
    set({ isSidebarOpen: open })
  },
  toggleSidebar: () => set((state) => {
    const newState = !state.isSidebarOpen
    localStorage.setItem('superplanner-sidebar-open', newState)
    return { isSidebarOpen: newState }
  }),

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

  // Global Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
