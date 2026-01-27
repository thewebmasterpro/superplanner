import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import './globals.css'

export default function AppSimple() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('AppSimple: Checking session...')

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        console.log('Session result:', { session, error })
        if (error) {
          setError(error.message)
        }
        setSession(session)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Session error:', err)
        setError(err.message)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #ddd',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: '#333' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fee'
      }}>
        <div style={{ textAlign: 'center', padding: '20px', maxWidth: '500px' }}>
          <h1 style={{ color: '#c00' }}>Error</h1>
          <p style={{ color: '#333', margin: '20px 0' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h1 style={{ color: '#333', marginBottom: '20px' }}>🚀 Superplanner</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>Please sign in to continue</p>
          <p style={{
            padding: '15px',
            backgroundColor: '#fef3c7',
            borderRadius: '5px',
            color: '#92400e'
          }}>
            Login form would appear here. Using AppSupabase version for now.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '40px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>Dashboard</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Welcome, {session.user.email}!
        </p>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#333', fontSize: '20px', marginBottom: '15px' }}>Stats</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {[
              { label: 'Total Tasks', value: '0' },
              { label: 'In Progress', value: '0' },
              { label: 'Overdue', value: '0' },
              { label: 'Completed', value: '0' },
            ].map(stat => (
              <div key={stat.label} style={{
                padding: '20px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>{stat.label}</p>
                <p style={{ color: '#333', fontSize: '32px', fontWeight: 'bold' }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={async () => {
            await supabase.auth.signOut()
            window.location.reload()
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}
