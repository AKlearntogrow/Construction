import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email || 'none')
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'none')
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

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (authId) => {
    try {
      console.log('Fetching profile for authId:', authId)
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        throw profileError
      }

      console.log('Profile fetched:', profile?.email, 'company_id:', profile?.company_id)
      setUserProfile(profile)

      // Get company if user has one
      if (profile?.company_id) {
        console.log('Fetching company:', profile.company_id)
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single()

        if (!companyError) {
          console.log('Company fetched:', companyData?.name)
          setCompany(companyData)
        } else {
          console.error('Company fetch error:', companyError)
        }
      } else {
        console.log('No company_id, user needs onboarding')
        setCompany(null)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
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
    isAuthenticated: !!user
  }

  console.log('AuthContext state:', { 
    isAuthenticated: !!user, 
    hasProfile: !!userProfile, 
    hasCompany: !!company, 
    loading 
  })

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
