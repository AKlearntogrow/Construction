import { useTheme } from '../context/ThemeContext'

const gradients = {
  blue: 'from-blue-500 to-cyan-600',
  orange: 'from-amber-500 to-orange-600',
  green: 'from-emerald-500 to-green-600',
  purple: 'from-violet-500 to-purple-600',
  violet: 'from-violet-500 to-purple-600',
  emerald: 'from-emerald-500 to-green-600',
  amber: 'from-amber-500 to-orange-600',
}

export default function KPICard({ title, value, sub, icon: Icon, color }) {
  const { darkMode } = useTheme()
  
  const gradient = gradients[color] || gradients.blue
  
  return (
    <div className={`backdrop-blur-xl rounded-2xl border p-5 transition-all ${
      darkMode ? 'bg-white/10 border-white/20 hover:bg-white/15' : 'bg-white border-slate-200 hover:shadow-lg'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>{title}</span>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          {Icon && <Icon className="w-5 h-5 text-white" />}
        </div>
      </div>
      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{value}</p>
      <p className={`text-sm mt-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>{sub}</p>
    </div>
  )
}
