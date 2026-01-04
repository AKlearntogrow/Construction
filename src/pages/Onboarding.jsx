import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { Building2, Loader2, HardHat, ArrowRight, MapPin, Phone, Mail } from 'lucide-react'

export default function Onboarding() {
  const { userProfile, company, refreshUser } = useAuth()
  const { darkMode } = useTheme()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    company_type: 'gc',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    if (company) {
      navigate('/')
    }
  }, [company, navigate])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.name,
          slug: generateSlug(formData.name),
          company_type: formData.company_type,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zip: formData.zip || null,
          phone: formData.phone || null,
          email: formData.email || null,
          plan: 'free',
          plan_started_at: new Date().toISOString(),
          monthly_ticket_limit: 5,
          monthly_project_limit: 1,
          status: 'active'
        })
        .select()
        .single()

      if (companyError) throw companyError

      const { error: userError } = await supabase
        .from('users')
        .update({
          company_id: newCompany.id,
          role: 'admin'
        })
        .eq('id', userProfile.id)

      if (userError) throw userError

      // Refresh auth context then navigate
      await refreshUser()
      navigate('/')

    } catch (err) {
      console.error('Onboarding error:', err)
      setError(err.message || 'Failed to create company')
      setLoading(false)
    }
  }

  if (company) {
    return null
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${
      darkMode ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      <div className={`w-full max-w-lg p-8 rounded-2xl shadow-xl ${
        darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'
      }`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Set up your company
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Let's get your workspace ready
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-emerald-500' : darkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
          <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-emerald-500' : darkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
          <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-emerald-500' : darkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Company Name *
                </label>
                <div className="relative">
                  <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                    } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                    placeholder="Acme Construction LLC"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Company Type *
                </label>
                <select
                  name="company_type"
                  value={formData.company_type}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                >
                  <option value="gc">General Contractor</option>
                  <option value="sub">Subcontractor</option>
                  <option value="owner">Owner / Developer</option>
                  <option value="architect">Architect / Engineer</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.name}
                className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Address
                </label>
                <div className="relative">
                  <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                    } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                    placeholder="123 Main Street"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                />
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                />
                <input
                  type="text"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  placeholder="ZIP"
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Phone
                </label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                    } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Company Email
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                    } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                    placeholder="info@company.com"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    darkMode
                      ? 'bg-slate-700 text-white hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</>
                  ) : (
                    'Create Company'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className={`mt-6 text-center text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          You can update these details later in settings
        </p>
      </div>
    </div>
  )
}
