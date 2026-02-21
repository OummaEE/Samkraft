export {}

declare global {
  interface Window {
    __SAMKRAFT_ENV__?: {
      supabaseUrl?: string
      supabaseAnonKey?: string
    }
  }
}

declare module '*.tsx?client' {
  const clientPath: string
  export default clientPath
}
