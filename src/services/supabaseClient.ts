import { createClient } from '@supabase/supabase-js'

const runtimeEnv = window.__SAMKRAFT_ENV__ ?? {}
const fallbackSupabaseUrl = 'https://dltfprkqyzxyyvfejrdy.supabase.co'
const fallbackSupabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdGZwcmtxeXp4eXl2ZmVqcmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzcxNDksImV4cCI6MjA4NjU1MzE0OX0.EpSsjOtnxkgKw32VdjMZl62ug59_tYB9APtKveyMAH4'

const sanitize = (value?: string) => {
  if (!value) return ''
  if (value.startsWith('%VITE_')) return ''
  return value
}

const supabaseUrl =
  sanitize(runtimeEnv.supabaseUrl) || sanitize(import.meta.env.VITE_SUPABASE_URL) || fallbackSupabaseUrl
const supabaseAnonKey =
  sanitize(runtimeEnv.supabaseAnonKey) || sanitize(import.meta.env.VITE_SUPABASE_ANON_KEY) || fallbackSupabaseAnonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
