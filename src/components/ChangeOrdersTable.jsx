import { FileText } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import StatusBadge from './StatusBadge'

export default function ChangeOrdersTable({ changeOrders }) {
  const { darkMode } = useTheme()

  return (
    <div className={`backdrop-blur-xl rounded-2xl border overflow-hidden ${
      darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'
    }`}>
      <div className={`px-6 py-4 border-b flex items-center justify-between ${
        darkMode ? 'border-white/10' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <FileText className={`w-5 h-5 ${darkMode ? 'text-white/60' : 'text-slate-500'}`} />
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Change Orders</h3>
        </div>
        <button className="text-sm text-emerald-500 hover:text-emerald-400 font-medium">View all</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={darkMode ? 'bg-white/5' : 'bg-slate-50'}>
              <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>CO #</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Project</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Amount</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Status</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Days</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-white/10' : 'divide-slate-100'}`}>
            {changeOrders.map((co) => (
              <tr key={co.id} className={`transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                <td className={`px-6 py-4 text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>{co.id}</td>
                <td className={`px-6 py-4 text-sm ${darkMode ? 'text-white/70' : 'text-slate-600'}`}>{co.project}</td>
                <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>${co.amount.toLocaleString()}</td>
                <td className="px-6 py-4"><StatusBadge status={co.status} /></td>
                <td className={`px-6 py-4 text-sm font-medium ${
                  co.daysOpen > 20 ? 'text-red-500' : co.daysOpen > 10 ? 'text-amber-500' : darkMode ? 'text-white/70' : 'text-slate-600'
                }`}>{co.daysOpen}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}