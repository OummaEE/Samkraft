import { createContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../services/supabaseClient'
import * as authService from '../services/authService'
import * as userService from '../services/userService'
import type { LoginInput, RegisterInput, UserProfile } from '../types'

type AuthState = {
  session: Session | null
  authUser: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTH'; payload: { session: Session | null; authUser: User | null } }
  | { type: 'SET_PROFILE'; payload: UserProfile | null }
  | { type: 'SET_ERROR'; payload: string | null }

const initialState: AuthState = {
  session: null,
  authUser: null,
  profile: null,
  loading: true,
  error: null,
}

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_AUTH':
      return { ...state, session: action.payload.session, authUser: action.payload.authUser }
    case 'SET_PROFILE':
      return { ...state, profile: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

type AuthContextValue = AuthState & {
  register: (input: RegisterInput) => Promise<void>
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadProfile = async (userId: string) => {
    try {
      const profile = await userService.getCurrentUserProfile(userId)
      dispatch({ type: 'SET_PROFILE', payload: profile })
    } catch (err) {
      console.error('Failed to load profile:', err)
      dispatch({ type: 'SET_PROFILE', payload: null })
    }
  }

  const refreshProfile = async () => {
    if (!state.authUser?.id) return
    await loadProfile(state.authUser.id)
  }

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const session = await authService.getSession()
        if (!mounted) return

        dispatch({ type: 'SET_AUTH', payload: { session, authUser: session?.user || null } })

        if (session?.user) {
          await loadProfile(session.user.id)
        }
      } catch (error) {
        console.error('Init auth error:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Kunde inte ladda session.' })
      } finally {
        if (mounted) dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      dispatch({ type: 'SET_AUTH', payload: { session, authUser: session?.user || null } })
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        dispatch({ type: 'SET_PROFILE', payload: null })
      }
      dispatch({ type: 'SET_LOADING', payload: false })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const register = async (input: RegisterInput) => {
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await authService.signUp(input)
      const user = response.user
      if (!user) throw new Error('Registrering lyckades inte')

      try {
        await userService.createProfile({
          id: user.id,
          email: input.email,
          fullName: input.fullName,
          role: input.role,
          municipality: input.municipality,
        })
        await loadProfile(user.id)
      } catch (profileError: any) {
        // Auth succeeded but profile creation failed — sign out to clean up
        console.error('Profile creation failed, signing out:', profileError)
        await authService.signOut()
        dispatch({ type: 'SET_AUTH', payload: { session: null, authUser: null } })
        dispatch({ type: 'SET_PROFILE', payload: null })
        throw new Error('Kontot skapades men profilen kunde inte sparas. Försök igen.')
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Kunde inte registrera användare.' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const login = async (input: LoginInput) => {
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await authService.signIn(input)
      if (response.user?.id) {
        await loadProfile(response.user.id)
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Inloggning misslyckades.' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const logout = async () => {
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      await authService.signOut()
    } catch (err) {
      console.error('Logout error:', err)
    }
    dispatch({ type: 'SET_AUTH', payload: { session: null, authUser: null } })
    dispatch({ type: 'SET_PROFILE', payload: null })
    dispatch({ type: 'SET_LOADING', payload: false })
  }

  const value = useMemo(
    () => ({
      ...state,
      register,
      login,
      logout,
      refreshProfile,
    }),
    [state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}