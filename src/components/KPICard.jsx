import { DollarSign, CheckCircle, Clock, Target } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const icons = {
  violet: DollarSign,
  emerald: CheckCircle,
  blue: Clock,
  amber: Target,
}

const gradients = {
  violet: 'from-violet-500 to-purple-600',
  emerald: 'from-emerald-500 to-green-600',
  blue: 'from-blue-500 to-cyan-600',
  amber: 'from-amber-500 to-orange-600',
}

export default function KPICard({ title, value, change, positive, color }) {
  const { darkMode } = useTheme()
  const Icon = icons[color]

  return (
    <div className={`backdrop-blur-xl rounded-2xl border p-5 transition-all ${
      darkMode ? 'bg-white/10 border-white/20 hover:bg-white/15' : 'bg-white border-slate-200 hover:shadow-lg'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>{title}</span>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{value}</p>
      <p className={`text-sm mt-1 ${
        positive === true ? 'text-emerald-500' : 
        positive === false ? 'text-red-500' : 
        darkMode ? 'text-white/40' : 'text-slate-400'
      }`}>{change}</p>
    </div>
  )
}