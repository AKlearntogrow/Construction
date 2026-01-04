import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { 
  CheckCircle2, Circle, Building2, FolderPlus, FileText, 
  Users, ChevronRight, Sparkles, X 
} from 'lucide-react'

export default function GettingStarted() {
  const { company, userProfile } = useAuth()
  const { darkMode } = useTheme()
  const navigate = useNavigate()
  
  const [dismissed, setDismissed] = useState(false)
  const [stats, setStats] = useState({ projects: 0, tickets: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user dismissed the checklist
    const wasDismissed = localStorage.getItem('gettingStartedDismissed')
    if (wasDismissed) {
      setDismissed(true)
    }
    
    fetchStats()
  }, [company])

  const fetchStats = async () => {
    if (!company) return
    
    try {
      // Count projects for this company
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('gc_company_id', company.id)

      // Count tickets (via projects)
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('gc_company_id', company.id)

      let ticketCount = 0
      if (projects && projects.length > 0) {
        const projectIds = projects.map(p => p.id)
        const { count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)
        ticketCount = count || 0
      }

      setStats({
        projects: projectCount || 0,
        tickets: ticketCount
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('gettingStartedDismissed', 'true')
    setDismissed(true)
  }

  // Don't show if dismissed or if user has completed all steps
  if (dismissed || loading) return null
  
  const isGC = company?.company_type === 'gc'
  const hasProject = stats.projects > 0
  const hasTicket = stats.tickets > 0

  // If all steps complete, don't show
  if (hasProject && hasTicket) return null

  const steps = isGC ? [
    {
      id: 'account',
      label: 'Create your account',
      done: true,
      action: null
    },
    {
      id: 'company',
      label: 'Set up your company',
      done: true,
      action: null
    },
    {
      id: 'project',
      label: 'Create your first project',
      done: hasProject,
      action: () => navigate('/projects')
    },
    {
      id: 'ticket',
      label: 'Capture your first T&M ticket',
      done: hasTicket,
      action: () => navigate('/capture')
    }
  ] : [
    {
      id: 'account',
      label: 'Create your account',
      done: true,
      action: null
    },
    {
      id: 'company',
      label: 'Set up your company',
      done: true,
      action: null
    },
    {
      id: 'project',
      label: 'Join a project',
      done: hasProject,
      action: () => navigate('/projects'),
      sublabel: 'Enter an invite code from your GC'
    },
    {
      id: 'ticket',
      label: 'Capture your first T&M ticket',
      done: hasTicket,
      action: () => navigate('/capture')
    }
  ]

  const completedCount = steps.filter(s => s.done).length
  const progress = (completedCount / steps.length) * 100

  return (
    <div className={`rounded-2xl border p-6 mb-8 relative overflow-hidden ${
      darkMode 
        ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20' 
        : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
    }`}>
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className={`absolute top-4 right-4 p-1 rounded-lg transition-colors ${
          darkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-black/5 text-slate-400'
        }`}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'
        }`}>
          <Sparkles className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Getting Started
          </h3>
          <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
            {completedCount} of {steps.length} complete
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`h-2 rounded-full mb-6 ${darkMode ? 'bg-white/10' : 'bg-emerald-100'}`}>
        <div 
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            onClick={step.action && !step.done ? step.action : undefined}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              step.done
                ? darkMode ? 'bg-white/5' : 'bg-white/50'
                : step.action
                  ? darkMode 
                    ? 'bg-white/10 hover:bg-white/15 cursor-pointer' 
                    : 'bg-white hover:bg-white/80 cursor-pointer shadow-sm'
                  : darkMode ? 'bg-white/5' : 'bg-white/50'
            }`}
          >
            {/* Check icon */}
            {step.done ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <Circle className={`w-5 h-5 flex-shrink-0 ${
                darkMode ? 'text-white/30' : 'text-slate-300'
              }`} />
            )}
            
            {/* Label */}
            <div className="flex-1">
              <span className={`text-sm font-medium ${
                step.done 
                  ? darkMode ? 'text-white/50 line-through' : 'text-slate-400 line-through'
                  : darkMode ? 'text-white' : 'text-slate-700'
              }`}>
                {step.label}
              </span>
              {step.sublabel && !step.done && (
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  {step.sublabel}
                </p>
              )}
            </div>

            {/* Arrow for actionable items */}
            {step.action && !step.done && (
              <ChevronRight className={`w-5 h-5 ${
                darkMode ? 'text-white/40' : 'text-slate-400'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
