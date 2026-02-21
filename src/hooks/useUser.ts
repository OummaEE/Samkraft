import { useMemo } from 'react'
import { useAuth } from './useAuth'

export function useUser() {
  const { profile, authUser, loading } = useAuth()

  return useMemo(
    () => ({
      isAuthenticated: !!authUser,
      userId: authUser?.id || null,
      profile,
      role: profile?.role || null,
      loading
    }),
    [authUser, profile, loading]
  )
}
