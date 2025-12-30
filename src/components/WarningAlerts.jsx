import { AlertTriangle, Activity, Clock, TrendingUp } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const iconMap = {
  activity: Activity,
  clock: Clock,
  trending: TrendingUp,
}

export default function WarningAlerts({ warnings }) {
  const { darkMode } = useTheme()

  return (
    <div className={`rounded-2xl border p-4 mb-8 ${
      darkMode 
        ? 'bg-gradient-to-r from-red-500/10 to-transparent border-red-500/30' 
        : 'bg-gradient-to-r from-red-50 to-transparent border-red-200'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Early Warning Signals</h3>
        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
          {warnings.length} active
        </span>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {warnings.map((warning, idx) => {
          const Icon = iconMap[warning.iconType] || Activity
          return (
            <div key={idx} className={`rounded-xl p-3 border ${
              darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 ${
                  warning.severity === 'high' ? 'text-red-500' : 'text-amber-500'
                }`} />
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>{warning.message}</p>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>{warning.detail}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}