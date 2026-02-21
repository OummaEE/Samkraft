import { createClient } from '@supabase/supabase-js'

const runtimeEnv = window.__SAMKRAFT_ENV__ ?? {}
const supabaseUrl = runtimeEnv.supabaseUrl || import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = runtimeEnv.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY

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
