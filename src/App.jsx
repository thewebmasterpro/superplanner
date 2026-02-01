import React, { useState, useEffect } from 'react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import pb from './lib/pocketbase'
import { MainLayout } from './components/layout/MainLayout'
import { Dashboard } from './pages/Dashboard'
import { Tasks } from './pages/Tasks'
import { Calendar } from './pages/Calendar'
import { Campaigns } from './pages/Campaigns'
import { Contacts } from './pages/Contacts'
import { Settings } from './pages/Settings'
import { Trash } from './pages/Trash'
import { ArchivePage } from './pages/Archive'
import { LandingPage } from './pages/LandingPage'
import { TeamSettings } from './pages/TeamSettings'
import { Meetings } from './pages/Meetings'
import { Workspace } from './pages/Workspace'
import { LoginModal } from './components/LoginModal'
import { useUserStore } from './stores/userStore'
import { ThemeProvider } from './components/ThemeProvider'
import { motion, AnimatePresence } from 'framer-motion'
import './globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'

import DashboardV3 from './pages/DashboardV3'

// Simple router (can upgrade to react-router later)
const routes = {
  '/': DashboardV3, // V3 Dashboard is now default
  '/tasks': Tasks,
  '/meetings': Meetings,
  '/calendar': Calendar,
  '/campaigns': Campaigns,
  '/contacts': Contacts,
  '/pipeline': () => <Contacts initialView="pipeline" />,
  '/settings': Settings,
  '/trash': Trash,
  '/archive': ArchivePage,
  '/team': TeamSettings,
  '/workspace': Workspace,
}

function AppContent() {
  const [session, setSession] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { setUser } = useUserStore()
  const currentPath = window.location.pathname || '/'
  const PageComponent = routes[currentPath] || DashboardV3

  useEffect(() => {
    // Get initial session
    if (pb.authStore.isValid) {
      setSession(pb.authStore.token)
      setUser(pb.authStore.model)
    }
    setLoading(false)

    // Listen for auth changes
    const removeListener = pb.authStore.onChange((token, model) => {
      console.log('Auth state changed:', token ? 'Logged In' : 'Logged Out', model?.email)
      setSession(token)
      setUser(model)
    })

    return () => removeListener()
  }, [setUser])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md p-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }

  // Show login or landing if not authenticated
  if (!session) {
    return (
      <>
        <LandingPage onLoginClick={() => setShowLogin(true)} />
        <LoginModal
          open={showLogin}
          onOpenChange={setShowLogin}
          onLoginSuccess={(data) => {
            console.log('Login success:', data.user?.email)
            setSession(data.session)
            setUser(data.user)
            setShowLogin(false)
          }}
        />
      </>
    )
  }

  // React Router Setup
  const isV3 = (path) => path === '/' || path === '/v3'

  return (
    <ThemeProvider defaultTheme="dark" storageKey="superplanner-theme">
      <Routes>
        {/* V3 Routes (No MainLayout) */}
        <Route path="/" element={<DashboardV3 />} />

        {/* Legacy Routes (Wrapped in MainLayout) */}
        {Object.entries(routes).map(([path, Component]) => {
          if (path === '/') return null // Handled above

          return (
            <Route
              key={path}
              path={path}
              element={
                <MainLayout>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={path}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="flex-1 flex flex-col"
                    >
                      <Component />
                    </motion.div>
                  </AnimatePresence>
                </MainLayout>
              }
            />
          )
        })}

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  )
}

// Basic Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center p-8 max-w-md">
            <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong 😵</h1>
            <div className="bg-muted p-4 rounded-md text-left mb-6 overflow-auto max-h-48 text-sm font-mono">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
