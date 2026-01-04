import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = useCallback(async (authId) => {
    console.log('fetchUserProfile called with authId:', authId)
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .maybeSingle()

      console.log('Profile fetch result:', { profile, profileError })

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        setUserProfile(null)
        setCompany(null)
        return
      }

      if (!profile) {
        console.log('No profile found for auth_id:', authId)
        setUserProfile(null)
        setCompany(null)
        return
      }

      setUserProfile(profile)

      if (profile.company_id) {
        console.log('Fetching company:', profile.company_id)
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .maybeSingle()

        console.log('Company fetch result:', { companyData, companyError })

        if (!companyError && companyData) {
          setCompany(companyData)
        } else {
          setCompany(null)
        }
      } else {
        console.log('No company_id on profile')
        setCompany(null)
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      setUserProfile(null)
      setCompany(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    if (user?.id) {
      console.log('refreshUser called')
      setLoading(true)
      await fetchUserProfile(user.id)
    }
  }, [user?.id, fetchUserProfile])

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        console.log('initAuth: calling getSession...')
        
        // Add timeout to getSession
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getSession timeout')), 5000)
        )
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])
        
        console.log('getSession result:', session?.user?.email || 'no session')
        
        if (!mounted) return
        
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('initAuth error:', error.message)
        // If getSession fails/times out, clear any corrupt data and reset
        if (mounted) {
          setUser(null)
          setUserProfile(null)
          setCompany(null)
          setLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('onAuthStateChange:', event, session?.user?.email || 'no session')
        if (!mounted) return
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Only fetch profile on SIGNED_IN, not on every token refresh
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            await fetchUserProfile(session.user.id)
          } else if (event === 'TOKEN_REFRESHED') {
            // Just ensure loading is false, don't refetch
            setLoading(false)
          }
        } else {
          setUserProfile(null)
          setCompany(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setUserProfile(null)
      setCompany(null)
    }
    return { error }
  }

  const value = {
    user,
    userProfile,
    company,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUser,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
