import { useState } from 'react'
import { DollarSign, CheckCircle, Clock, Target, Zap, Bell, User, Sun, Moon } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// Chart data - Budget vs Actuals
const waterfallData = [
  { name: 'Original Contract', value: 4200, color: '#64748b' },
  { name: 'Approved COs', value: 380, color: '#10b981' },
  { name: 'Pending COs', value: 156, color: '#f59e0b' },
  { name: 'Disputed', value: 67, color: '#ef4444' },
]

function App() {
  const [darkMode, setDarkMode] = useState(true)

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-100 via-white to-slate-100'
    }`}>
      
      {/* Navigation */}
      <nav className={`border-b px-6 py-4 ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>ChangeFlow</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full font-medium">AI</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'text-white/60 hover:text-white hover:bg-white/10' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className={`p-2 rounded-lg ${darkMode ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Dashboard</h1>
          <p className={`mt-1 ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>3 active projects • Real-time insights</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className={`backdrop-blur-xl rounded-2xl border p-5 transition-all ${
            darkMode ? 'bg-white/10 border-white/20 hover:bg-white/15' : 'bg-white border-slate-200 hover:shadow-lg'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>Total CO Exposure</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>$603K</p>
            <p className="text-emerald-500 text-sm mt-1">↑ 12.4% vs last month</p>
          </div>

          <div className={`backdrop-blur-xl rounded-2xl border p-5 transition-all ${
            darkMode ? 'bg-white/10 border-white/20 hover:bg-white/15' : 'bg-white border-slate-200 hover:shadow-lg'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>Approved (MTD)</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>$108K</p>
            <p className="text-emerald-500 text-sm mt-1">↑ 8.2% vs last month</p>
          </div>

          <div className={`backdrop-blur-xl rounded-2xl border p-5 transition-all ${
            darkMode ? 'bg-white/10 border-white/20 hover:bg-white/15' : 'bg-white border-slate-200 hover:shadow-lg'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>Avg. Approval Time</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>14 days</p>
            <p className="text-emerald-500 text-sm mt-1">↓ 3 days vs benchmark</p>
          </div>

          <div className={`backdrop-blur-xl rounded-2xl border p-5 transition-all ${
            darkMode ? 'bg-white/10 border-white/20 hover:bg-white/15' : 'bg-white border-slate-200 hover:shadow-lg'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>T&M Capture Rate</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>100%</p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>0 tickets lost</p>
          </div>
        </div>

        {/* Chart Section */}
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
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={waterfallData} layout="vertical">
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
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
                labelStyle={{ color: darkMode ? 'white' : '#1e293b', fontWeight: 600 }}
                formatter={(value) => [`$${value}K`, 'Amount']}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Summary */}
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

      </main>
    </div>
  )
}

export default App