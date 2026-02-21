import { createClient } from '@supabase/supabase-js'

const runtimeEnv = window.__SAMKRAFT_ENV__ ?? {}

const sanitize = (value?: string) => {
  if (!value) return ''
  if (value.startsWith('%VITE_')) return ''
  return value
}

const supabaseUrl = sanitize(runtimeEnv.supabaseUrl) || sanitize(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = sanitize(runtimeEnv.supabaseAnonKey) || sanitize(import.meta.env.VITE_SUPABASE_ANON_KEY)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials saknas. Kontrollera .dev.vars eller VITE_ variabler.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
