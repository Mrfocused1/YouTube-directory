import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface LoginProps {
  onClose?: () => void
  onLoginSuccess?: () => void
}

export const Login: React.FC<LoginProps> = ({ onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])
  const { signIn, signUp } = useAuth()

  useEffect(() => {
    console.log('Supabase configured:', isSupabaseConfigured)
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
    console.log('Supabase connection test starting...')

    // Test Supabase connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        console.log('Supabase connection test result:', { data, error })
      } catch (err) {
        console.log('Supabase connection test failed:', err)
      }
    }

    testConnection()
  }, [])

  const runAuthTests = async () => {
    console.log('🔧 Authentication test started')
    setTestResults(['🔍 Starting comprehensive auth tests...'])

    try {
      const testEmail = 'test@example.com'
      const testPassword = 'password123'

      // Test sign up
      setTestResults(prev => [...prev, '📝 Creating test user...'])
      console.log('Testing sign up...')

      const { error: signUpError } = await signUp(testEmail, testPassword)
      console.log('Sign up result:', signUpError)

      if (signUpError) {
        const errorMsg = `❌ Sign up failed: ${signUpError.message}`
        setTestResults(prev => [...prev, errorMsg])
        console.log(errorMsg)

        // Try to login with existing user instead
        setTestResults(prev => [...prev, '🔐 Trying login with existing credentials...'])
        const { error: signInError } = await signIn(testEmail, testPassword)

        if (signInError) {
          const loginErrorMsg = `❌ Login also failed: ${signInError.message}`
          setTestResults(prev => [...prev, loginErrorMsg])
          console.log(loginErrorMsg)
        } else {
          setTestResults(prev => [...prev, '✅ Login successful!', '🎉 Authentication working!'])
          console.log('✅ Login successful!')
        }
      } else {
        setTestResults(prev => [...prev, '✅ Test user created successfully'])
        console.log('✅ User created, testing login...')

        // Test login
        const { error: signInError } = await signIn(testEmail, testPassword)

        if (signInError) {
          const loginErrorMsg = `❌ Login failed: ${signInError.message}`
          setTestResults(prev => [...prev, loginErrorMsg])
          console.log(loginErrorMsg)
        } else {
          setTestResults(prev => [...prev, '✅ Login successful!', '🎉 Authentication working!'])
          console.log('✅ Login successful!')
        }
      }

    } catch (err) {
      const errorMsg = `💥 Test failed: ${err}`
      setTestResults(prev => [...prev, errorMsg])
      console.log(errorMsg)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    console.log('Auth attempt:', { email, isSignUp })

    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password)

      console.log('Auth result:', { error })
      console.log('Full error object:', error)
      console.log('Error details:', JSON.stringify(error, null, 2))

      if (error) {
        console.log('Auth failed:', error.message)
        console.log('Error code:', error.code)
        console.log('Error status:', error.status)
        setError(`Auth failed: ${error.message} (${error.code || 'unknown'})`)
      } else {
        if (isSignUp) {
          console.log('Sign up successful')
          setSuccess('Account created successfully! Please check your email for verification.')
          // Don't call callbacks for sign up, user needs to verify email first
        } else {
          console.log('Login successful, calling callbacks')
          setSuccess('Login successful! Redirecting to admin dashboard...')
          setTimeout(() => {
            onLoginSuccess?.()
          }, 1000)
        }
      }
    } catch (err) {
      console.log('Auth error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/8 to-pink-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-cyan-500/6 to-blue-500/6 rounded-full blur-2xl animate-pulse delay-2000"></div>

        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-y-12 animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-transparent transform skew-y-12 animate-pulse delay-1000"></div>
        </div>
      </div>

      {/* Main Login Container */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-6">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-lg opacity-30"></div>

          <div className="relative backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl shadow-2xl">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/[0.08] via-transparent to-white/[0.08] p-[1px]">
              <div className="h-full w-full rounded-3xl bg-black/20"></div>
            </div>

            <div className="relative p-12">
              {/* Header Section */}
              <div className="text-center mb-10">
                <div className="relative inline-flex items-center justify-center mb-8">
                  <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-spin opacity-60"></div>
                  <div className="relative w-20 h-20 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 blur-md"></div>
                    <div className="relative z-10">
                      <svg className="w-10 h-10 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5L15 4C15 2.34 13.66 1 12 1S9 2.34 9 4V7.5L3 7V9L9 10.5C9 11.33 9.67 12 10.5 12S12 11.33 12 10.5L21 9ZM12 13C7.03 13 3 17.03 3 22H5C5 18.13 8.13 15 12 15S19 18.13 19 22H21C21 17.03 16.97 13 12 13Z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <h1 className="text-4xl font-light text-white mb-3 tracking-wide">
                  <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                    {isSignUp ? 'Create Account' : 'Admin Portal'}
                  </span>
                </h1>

                <p className="text-white/70 text-base font-light leading-relaxed">
                  {isSignUp
                    ? 'Join the MadeYouThink Directory administration team'
                    : 'Access the content management dashboard'}
                </p>

                <div className="mt-6 mx-auto w-16 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="relative mb-8">
                  <div className="backdrop-blur-xl bg-red-500/10 border border-red-400/30 rounded-2xl p-5">
                    <div className="absolute -inset-1 bg-red-500/20 rounded-2xl blur-md opacity-50"></div>
                    <div className="relative flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                        <svg className="w-5 h-5 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-red-200 font-medium text-sm leading-relaxed">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="relative mb-8">
                  <div className="backdrop-blur-xl bg-green-500/10 border border-green-400/30 rounded-2xl p-5">
                    <div className="absolute -inset-1 bg-green-500/20 rounded-2xl blur-md opacity-50"></div>
                    <div className="relative flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                        <svg className="w-5 h-5 text-green-300" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-green-200 font-medium text-sm leading-relaxed">{success}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Supabase Status Warning */}
              {!isSupabaseConfigured && (
                <div className="relative mb-8">
                  <div className="backdrop-blur-xl bg-yellow-500/10 border border-yellow-400/30 rounded-2xl p-5">
                    <div className="absolute -inset-1 bg-yellow-500/20 rounded-2xl blur-md opacity-50"></div>
                    <div className="relative flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                        <svg className="w-5 h-5 text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-yellow-200 font-medium text-sm leading-relaxed">
                        Database connection not configured. Authentication will not work.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Auth Test Section */}
              {isSupabaseConfigured && (
                <div className="relative mb-8">
                  <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-400/30 rounded-2xl p-5">
                    <div className="relative space-y-4">
                      <button
                        type="button"
                        onClick={runAuthTests}
                        className="category-pill px-4 py-2 text-sm w-full mb-2"
                      >
                        🔧 Run Authentication Tests
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEmail('admin@test.com')
                          setPassword('password123')
                          setTestResults(['📝 Auto-filled test credentials', '👆 Now click Login button below'])
                        }}
                        className="category-pill px-4 py-2 text-sm w-full"
                      >
                        🎯 Fill Test Credentials
                      </button>

                      {testResults.length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {testResults.map((result, index) => (
                            <div key={index} className="text-blue-200 text-xs font-mono">
                              {result}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Email Field */}
                <div className="space-y-3">
                  <label htmlFor="email" className="block text-white/90 text-sm font-medium tracking-wide">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-white/70 transition-colors duration-300">
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="search-bar pl-12"
                      placeholder="admin@madeyouthink.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-3">
                  <label htmlFor="password" className="block text-white/90 text-sm font-medium tracking-wide">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-white/70 transition-colors duration-300 bg-transparent pointer-events-none">
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>

                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="search-bar pl-12 pr-12"
                      placeholder="Enter your secure password"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="category-pill w-full justify-center py-3 px-6 text-base flex"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-3">
                        <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span>Authenticating...</span>
                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {isSignUp ? 'Create Account' : 'Login'}
                        <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
              </form>

              {/* Footer Actions */}
              <div className="mt-16 flex flex-col items-center px-4">
                {/* Switch between login/signup */}
                <div className="relative mb-16">
                  {/* Green glow for sign up */}
                  {!isSignUp && (
                    <div className="absolute -inset-1 bg-green-500/30 rounded-full blur-lg opacity-75"></div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp)
                      setError(null)
                      setSuccess(null)
                    }}
                    className="category-pill px-4 py-2 text-sm relative z-10"
                  >
                    {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                  </button>
                </div>

                {/* Cancel button if modal */}
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="category-pill px-6 py-2 mt-8"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Return to Directory
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}