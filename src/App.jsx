import React, { Suspense, useState, useEffect } from 'react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { Routes, Route, Navigate } from 'react-router-dom'
import pb from './lib/pocketbase'
import { LandingPage } from './pages/LandingPage'
import { LoginModal } from './components/LoginModal'
import { useUserStore } from './stores/userStore'
import { ThemeProvider } from './components/ThemeProvider'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const DashboardV3 = React.lazy(() => import('./pages/DashboardV3'))
const TasksPageV3 = React.lazy(() => import('./pages/v3/TasksPageV3'))
const StatsPageV3 = React.lazy(() => import('./pages/v3/StatsPageV3'))
const SettingsPageV3 = React.lazy(() => import('./pages/v3/SettingsPageV3'))
const CalendarPageV3 = React.lazy(() => import('./pages/v3/CalendarPageV3'))
const ContactsPageV3 = React.lazy(() => import('./pages/v3/ContactsPageV3'))
const CampaignsPageV3 = React.lazy(() => import('./pages/v3/CampaignsPageV3'))
const MeetingsPageV3 = React.lazy(() => import('./pages/v3/MeetingsPageV3'))
const TrashPageV3 = React.lazy(() => import('./pages/v3/TrashPageV3'))
const ArchivePageV3 = React.lazy(() => import('./pages/v3/ArchivePageV3'))
const TeamPageV3 = React.lazy(() => import('./pages/v3/TeamPageV3'))
const TeamPoolPage = React.lazy(() => import('./pages/v3/TeamPoolPage'))
const GamificationPageV3 = React.lazy(() => import('./pages/GamificationPageV3'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppContent() {
  const [session, setSession] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { setUser, loadPreferences, loadTeams } = useUserStore()

  useEffect(() => {
    if (pb.authStore.isValid) {
      setSession(pb.authStore.token)
      setUser(pb.authStore.model)
      loadPreferences()
      loadTeams()
    }
    setLoading(false)

    const removeListener = pb.authStore.onChange((token, model) => {
      setSession(token)
      setUser(model)
      if (token) {
        loadPreferences()
        loadTeams()
      }
    })

    return () => removeListener()
  }, [setUser, loadPreferences])

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

  if (!session) {
    return (
      <>
        <LandingPage onLoginClick={() => setShowLogin(true)} />
        <LoginModal
          open={showLogin}
          onOpenChange={setShowLogin}
          onLoginSuccess={(data) => {
            setSession(data.session)
            setUser(data.user)
            setShowLogin(false)
          }}
        />
      </>
    )
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="superplanner-theme">
      <Toaster position="top-right" />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-base-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<DashboardV3 />} />
          <Route path="/tasks" element={<TasksPageV3 />} />
          <Route path="/stats" element={<StatsPageV3 />} />
          <Route path="/settings" element={<SettingsPageV3 />} />
          <Route path="/calendar" element={<CalendarPageV3 />} />
          <Route path="/contacts" element={<ContactsPageV3 />} />
          <Route path="/campaigns" element={<CampaignsPageV3 />} />
          <Route path="/meetings" element={<MeetingsPageV3 />} />
          <Route path="/trash" element={<TrashPageV3 />} />
          <Route path="/archive" element={<ArchivePageV3 />} />
          <Route path="/team" element={<TeamPageV3 />} />
          <Route path="/team/pool" element={<TeamPoolPage />} />
          <Route path="/gamification" element={<GamificationPageV3 />} />
          <Route path="/workspace" element={<Navigate to="/settings" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  )
}

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
            <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
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
