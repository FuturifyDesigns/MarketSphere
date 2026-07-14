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
  signUp: (email: string, password: string, meta: { full_name: string; phone?: string; role: string }) => Promise<{ error: Error | null }>
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

  const signOutInternal = useCallback(async (notice?: string) => {
    if (signingOutRef.current) return
    signingOutRef.current = true
    if (notice) storeAccountNotice(notice)
    await supabase.auth.signOut()
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
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      await applyProfile((data as Profile | null) ?? null)
    },
    [applyProfile],
  )

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }: { data: { session: Session | null } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) fetchProfile(s.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, s: Session | null) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) void fetchProfile(s.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
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
    meta: { full_name: string; phone?: string; role: string }
  ) => {
    const role = meta.role === 'provider' ? 'provider' : 'customer'
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: meta.full_name,
          phone: meta.phone,
          role,
        },
        emailRedirectTo: getAuthRouteUrl('/auth/verify'),
      },
    })
    return { error: error as Error | null }
  }

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error as Error, bannedReason: null }

    if (data.user) {
      const { data: nextProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()

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
  }

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRouteUrl('/auth/reset-password'),
    })
    return { error: error as Error | null }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    await signOutInternal()
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, resetPasswordForEmail, updatePassword, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
