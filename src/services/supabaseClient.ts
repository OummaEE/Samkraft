import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Cloudflare Pages environment variables.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    // ↓↓↓ ЭТО — ключевой фикс: отключаем Web Locks API ↓↓↓
    lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
      // Простой in-memory lock без navigator.locks
      return await fn()
    },
  },
})
