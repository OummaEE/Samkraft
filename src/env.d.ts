export {}

declare global {
  interface Window {
    __SAMKRAFT_ENV__?: {
      supabaseUrl?: string
      supabaseAnonKey?: string
    }
  }
}
