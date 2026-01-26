import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import './Login.css'

function LoginSupabase({ onLoginSuccess }) {
  const [error, setError] = useState('')

  // Handle authentication state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // User successfully logged in
      const user = session.user
      onLoginSuccess({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.user_metadata?.full_name || user.email?.split('@')[0]
        },
        session
      })
    } else if (event === 'SIGNED_OUT') {
      setError('')
    } else if (event === 'USER_UPDATED') {
      console.log('User updated:', session)
    }
  })

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>🚀 Superplanner</h1>
          <p>Task Management & CRM</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="supabase-auth-wrapper">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#667eea',
                    brandAccent: '#764ba2',
                  },
                },
              },
              style: {
                button: {
                  borderRadius: '8px',
                  fontSize: '1em',
                  padding: '14px 24px',
                },
                input: {
                  borderRadius: '8px',
                  fontSize: '1em',
                  padding: '12px 16px',
                },
                container: {
                  gap: '20px',
                },
              },
            }}
            providers={['google']}
            redirectTo={window.location.origin}
            onlyThirdPartyProviders={false}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Password',
                  email_input_placeholder: 'Your email address',
                  password_input_placeholder: 'Your password',
                  button_label: 'Sign in',
                  loading_button_label: 'Signing in ...',
                  social_provider_text: 'Sign in with {{provider}}',
                  link_text: "Don't have an account? Sign up",
                },
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Password',
                  email_input_placeholder: 'Your email address',
                  password_input_placeholder: 'Your password',
                  button_label: 'Sign up',
                  loading_button_label: 'Signing up ...',
                  social_provider_text: 'Sign up with {{provider}}',
                  link_text: 'Already have an account? Sign in',
                },
              },
            }}
          />
        </div>

        <div className="login-footer">
          <p className="info-text">
            Sign in with your email or Google account
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginSupabase
