import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getAuthRouteUrl } from '../lib/authRoutes'
import { getBanMessage, isProfileBanned, storeAccountNotice } from '../lib/accountGuard'
import type { Profile } from '../lib/types'

interface SignInResult {
  error: Error | null
  bannedReason: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    meta: {
      full_name: string
      phone?: string
      role: string
      privacy_consent?: boolean
      privacy_consent_at?: string
    },
  ) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<SignInResult>
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const signingOutRef = useRef(false)
  const profileFetchGen = useRef(0)

  const signOutInternal = useCallback(async (notice?: string) => {
    if (signingOutRef.current) return
    signingOutRef.current = true
    if (notice) storeAccountNotice(notice)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('[auth] signOut failed', error)
    }
    setProfile(null)
    setUser(null)
    setSession(null)
    signingOutRef.current = false
  }, [])

  const applyProfile = useCallback(
    async (nextProfile: Profile | null) => {
      if (!nextProfile) {
        await signOutInternal('Your account has been deleted.')
        return
      }

      if (isProfileBanned(nextProfile)) {
        await signOutInternal(getBanMessage(nextProfile))
        return
      }

      setProfile(nextProfile)
    },
    [signOutInternal],
  )

  const fetchProfile = useCallback(
    async (userId: string) => {
      const gen = ++profileFetchGen.current
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
        if (gen !== profileFetchGen.current) return

        if (error) {
          // Transient query failures must not look like a deleted account.
          console.error('[auth] profile fetch failed', error)
          return
        }

        await applyProfile((data as Profile | null) ?? null)
      } catch (error) {
        if (gen !== profileFetchGen.current) return
        console.error('[auth] profile fetch threw', error)
      }
    },
    [applyProfile],
  )

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  useEffect(() => {
    let cancelled = false

    void supabase.auth
      .getSession()
      .then(({ data: { session: s } }: { data: { session: Session | null } }) => {
        if (cancelled) return
        setSession(s)
        setUser(s?.user ?? null)
        if (s?.user) {
          void fetchProfile(s.user.id).finally(() => {
            if (!cancelled) setLoading(false)
          })
        } else {
          setLoading(false)
        }
      })
      .catch((error: unknown) => {
        console.error('[auth] getSession failed', error)
        if (!cancelled) setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, s: Session | null) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) void fetchProfile(s.user.id)
      else setProfile(null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`profile-guard-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            await signOutInternal('Your account has been deleted by an administrator.')
            return
          }

          const nextProfile = payload.new as Profile
          if (isProfileBanned(nextProfile)) {
            await signOutInternal(getBanMessage(nextProfile))
            return
          }

          setProfile(nextProfile)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [signOutInternal, user])

  const signUp = async (
    email: string,
    password: string,
    meta: {
      full_name: string
      phone?: string
      role: string
      privacy_consent?: boolean
      privacy_consent_at?: string
    },
  ) => {
    try {
      const role = meta.role === 'provider' ? 'provider' : 'customer'
      if (!meta.privacy_consent) {
        return { error: new Error('Please accept the Terms of Service and Privacy Policy to continue.') }
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: meta.full_name,
            phone: meta.phone,
            role,
            privacy_consent: true,
            privacy_consent_at: meta.privacy_consent_at || new Date().toISOString(),
          },
          emailRedirectTo: getAuthRouteUrl('/auth/verify'),
        },
      })
      return { error: error as Error | null }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Sign up failed. Please try again.') }
    }
  }

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error as Error, bannedReason: null }

      if (data.user) {
        const { data: nextProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profileError) {
          await signOutInternal()
          return {
            error: new Error('Could not verify your account. Please try again.'),
            bannedReason: null,
          }
        }

        if (!nextProfile) {
          await signOutInternal('Your account could not be found.')
          return { error: new Error('Your account could not be found.'), bannedReason: null }
        }

        if (isProfileBanned(nextProfile)) {
          const bannedReason = getBanMessage(nextProfile as Profile)
          await signOutInternal(bannedReason)
          return { error: new Error(bannedReason), bannedReason }
        }
      }

      return { error: null, bannedReason: null }
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Sign in failed. Please try again.'),
        bannedReason: null,
      }
    }
  }

  const resetPasswordForEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRouteUrl('/auth/reset-password'),
      })
      return { error: error as Error | null }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Could not send reset email.') }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password })
      return { error: error as Error | null }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Could not update password.') }
    }
  }

  const signOut = async () => {
    await signOutInternal()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        resetPasswordForEmail,
        updatePassword,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
