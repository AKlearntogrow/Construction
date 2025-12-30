import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTheme } from '../context/ThemeContext'

export default function BudgetChart({ data }) {
  const { darkMode } = useTheme()

  return (
    <div className={`backdrop-blur-xl rounded-2xl border p-6 ${
      darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Budget vs Actuals</h2>
          <p className={`text-sm ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>Contract value breakdown ($K)</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-500" />
            <span className={darkMode ? 'text-white/50' : 'text-slate-500'}>Original</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className={darkMode ? 'text-white/50' : 'text-slate-500'}>Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span className={darkMode ? 'text-white/50' : 'text-slate-500'}>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className={darkMode ? 'text-white/50' : 'text-slate-500'}>Disputed</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <XAxis 
            type="number" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: darkMode ? 'rgba(255,255,255,0.5)' : '#64748b', fontSize: 12 }}
            tickFormatter={(v) => `$${v}K`}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: darkMode ? 'rgba(255,255,255,0.7)' : '#334155', fontSize: 12 }}
            width={120}
          />
          <Tooltip 
            contentStyle={{ 
              background: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'white',
              border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
              borderRadius: '12px'
            }}
            formatter={(value) => [`$${value}K`, 'Amount']}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Footer */}
      <div className={`mt-6 pt-6 border-t flex items-center justify-between ${
        darkMode ? 'border-white/10' : 'border-slate-200'
      }`}>
        <div className="text-center">
          <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Original Contract</p>
          <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>$4.20M</p>
        </div>
        <div className={`text-2xl ${darkMode ? 'text-white/20' : 'text-slate-300'}`}>→</div>
        <div className="text-center">
          <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Current Approved</p>
          <p className="text-lg font-semibold text-emerald-500">$4.58M</p>
        </div>
        <div className={`text-2xl ${darkMode ? 'text-white/20' : 'text-slate-300'}`}>→</div>
        <div className="text-center">
          <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Projected Final</p>
          <p className="text-lg font-semibold text-violet-500">$4.80M</p>
        </div>
        <div className={`text-center pl-6 border-l ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Variance</p>
          <p className="text-lg font-semibold text-amber-500">+14.3%</p>
        </div>
      </div>
    </div>
  )
}