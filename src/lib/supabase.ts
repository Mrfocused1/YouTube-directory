import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl &&
                           supabaseAnonKey &&
                           supabaseUrl !== 'your_supabase_project_url_here' &&
                           supabaseAnonKey !== 'your_supabase_anon_key_here' &&
                           supabaseUrl.startsWith('https://')

// Use dummy values if credentials are missing/invalid to prevent app crash
const fallbackUrl = 'https://demo.supabase.co'
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTU2OTQ1MiwiZXhwIjoxOTYxMTQ1NDUyfQ.demo'

export const supabase = createClient(
  hasValidCredentials ? supabaseUrl : fallbackUrl,
  hasValidCredentials ? supabaseAnonKey : fallbackKey,
  {
    auth: {
      autoRefreshToken: hasValidCredentials,
      persistSession: hasValidCredentials,
      detectSessionInUrl: hasValidCredentials
    }
  }
)

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = hasValidCredentials