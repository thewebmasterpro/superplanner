import React, { useState, useEffect } from 'react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { supabase } from './lib/supabase'
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
import { LoginModal } from './components/LoginModal'
import { useUserStore } from './stores/userStore'
import './globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Simple router (can upgrade to react-router later)
const routes = {
  '/': Dashboard,
  '/tasks': Tasks,
  '/calendar': Calendar,
  '/campaigns': Campaigns,
  '/contacts': Contacts,
  '/settings': Settings,
  '/trash': Trash,
  '/archive': ArchivePage,
}

function AppContent() {
  const [session, setSession] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { setUser } = useUserStore()
  const currentPath = window.location.pathname || '/'
  const PageComponent = routes[currentPath] || Dashboard

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Auth error:', error)
          setError(error.message)
        }
        setSession(session)
        setUser(session?.user || null)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to get session:', err)
        setError(err.message)
        setLoading(false)
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email)
      setSession(session)
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
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

  // Show app with MainLayout
  return (
    <MainLayout>
      <PageComponent />
    </MainLayout>
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
