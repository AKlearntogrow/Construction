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
        setLoading(false)
        return
      }

      if (!profile) {
        console.log('No profile found for auth_id:', authId)
        setUserProfile(null)
        setCompany(null)
        setLoading(false)
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
      console.log('fetchUserProfile complete, setting loading=false')
      setLoading(false)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    if (user?.id) {
      console.log('refreshUser called')
      await fetchUserProfile(user.id)
    }
  }, [user?.id, fetchUserProfile])

  useEffect(() => {
    let mounted = true
    let timeoutId = null

    // Safety timeout - if loading takes more than 10 seconds, something is wrong
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.error('Auth loading timeout - forcing loading=false')
        setLoading(false)
      }
    }, 10000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('getSession result:', session?.user?.email || 'no session')
      if (!mounted) return
      
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('onAuthStateChange:', event, session?.user?.email || 'no session')
        if (!mounted) return
        
        // Skip redundant fetches on TOKEN_REFRESHED if we already have data
        if (event === 'TOKEN_REFRESHED' && userProfile && company) {
          console.log('Skipping fetch on TOKEN_REFRESHED - already have data')
          return
        }
        
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
          setCompany(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
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
