import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: AuthError }>
  signUp: (email: string, password: string) => Promise<{ error?: AuthError }>
  signOut: () => Promise<{ error?: AuthError }>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)

    // Demo authentication for development
    if (email === 'admin@test.com' && password === 'password123') {
      console.log('✅ Demo authentication successful')
      const demoUser = {
        id: 'demo-user-123',
        email: 'admin@test.com',
        email_confirmed_at: new Date().toISOString(),
        app_metadata: { provider: 'demo' },
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User

      setUser(demoUser)
      setSession({
        access_token: 'demo-token',
        refresh_token: 'demo-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: demoUser
      } as Session)

      setLoading(false)
      return { error: undefined }
    }

    if (!isSupabaseConfigured) {
      setLoading(false)
      return { error: { message: 'Use demo credentials: admin@test.com / password123' } as AuthError }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      setLoading(false)
      return { error: error || undefined }
    } catch (err) {
      console.log('Supabase auth failed, falling back to demo mode')
      setLoading(false)
      return { error: { message: 'Connection failed. Use demo credentials: admin@test.com / password123' } as AuthError }
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase not configured' } as AuthError }
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    setLoading(false)
    return { error: error || undefined }
  }

  const signOut = async () => {
    setLoading(true)

    // Handle demo mode sign out
    if (user?.email === 'admin@test.com') {
      console.log('✅ Demo sign out')
      setUser(null)
      setSession(null)
      setLoading(false)
      return { error: undefined }
    }

    if (!isSupabaseConfigured) {
      setLoading(false)
      return { error: { message: 'Supabase not configured' } as AuthError }
    }

    try {
      const { error } = await supabase.auth.signOut()
      setLoading(false)
      return { error: error || undefined }
    } catch (err) {
      // Fallback sign out for demo mode
      setUser(null)
      setSession(null)
      setLoading(false)
      return { error: undefined }
    }
  }

  // For now, consider any authenticated user as admin
  // You can enhance this later with role-based access control
  const isAdmin = !!user

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}