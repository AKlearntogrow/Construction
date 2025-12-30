import { useState } from 'react'
import { 
  DollarSign, CheckCircle, Clock, Target, Zap, Bell, User, Sun, Moon,
  AlertTriangle, Activity, TrendingUp, Building2, FileText
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// Chart data
const waterfallData = [
  { name: 'Original Contract', value: 4200, color: '#64748b' },
  { name: 'Approved COs', value: 380, color: '#10b981' },
  { name: 'Pending COs', value: 156, color: '#f59e0b' },
  { name: 'Disputed', value: 67, color: '#ef4444' },
]

// Change Orders data
const changeOrders = [
  { id: 'CO-2024-0156', project: 'Metro Center Tower', description: 'MEP clash resolution', amount: 45600, status: 'pending_owner', daysOpen: 18 },
  { id: 'CO-2024-0155', project: 'Harbor View Medical', description: 'Additional circuits - OR Suite', amount: 28400, status: 'approved', daysOpen: 12 },
  { id: 'CO-2024-0154', project: 'Metro Center Tower', description: 'Emergency lighting revision', amount: 12800, status: 'pending_gc', daysOpen: 8 },
  { id: 'CO-2024-0153', project: 'Riverside Commons', description: 'Scope gap - basement feeders', amount: 67200, status: 'disputed', daysOpen: 34 },
]

// Project Health data
const projects = [
  { name: 'Metro Center Tower', gc: 'Turner Construction', health: 72, pending: 380000, phase: 'MEP Rough-in' },
  { name: 'Harbor View Medical', gc: 'Skanska USA', health: 85, pending: 156000, phase: 'Above Ceiling' },
  { name: 'Riverside Commons', gc: 'Webcor Builders', health: 91, pending: 89000, phase: 'Finish' },
]

// Warning Signals data
const warnings = [
  { severity: 'high', message: 'RFI velocity 2.8x above average', detail: 'Metro Center Tower • 12 RFIs in 7 days', icon: Activity },
  { severity: 'medium', message: 'Owner response time slowing', detail: 'Harbor View Medical • 18 days avg vs 8 days', icon: Clock },
  { severity: 'medium', message: 'T&M tracking 40% above contract', detail: 'Metro Center Tower • $380K pending', icon: TrendingUp },
]

// Status Badge Component
function StatusBadge({ status }) {
  const styles = {
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pending_gc: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pending_owner: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    disputed: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  const labels = {
    approved: 'Approved',
    pending_gc: 'With GC',
    pending_owner: 'With Owner',
    disputed: 'Disputed',
  }
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

// Health Bar Component
function HealthBar({ score }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-medium">{score}</span>
    </div>
  )
}

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
                darkMode ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className={`p-2 rounded-lg relative ${darkMode ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
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

        {/* Early Warning Alerts */}
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
            {warnings.map((warning, idx) => (
              <div key={idx} className={`rounded-xl p-3 border ${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-start gap-3">
                  <warning.icon className={`w-5 h-5 flex-shrink-0 ${
                    warning.severity === 'high' ? 'text-red-500' : 'text-amber-500'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>{warning.message}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>{warning.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          
          {/* Change Orders Table */}
          <div className={`lg:col-span-2 backdrop-blur-xl rounded-2xl border overflow-hidden ${
            darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'
          }`}>
            <div className="px-6 py-4 border-b flex items-center justify-between ${
              darkMode ? 'border-white/10' : 'border-slate-200'
            }">
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

          {/* Project Health */}
          <div className={`backdrop-blur-xl rounded-2xl border overflow-hidden ${
            darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              darkMode ? 'border-white/10' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <Building2 className={`w-5 h-5 ${darkMode ? 'text-white/60' : 'text-slate-500'}`} />
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Project Health</h3>
              </div>
            </div>
            <div className="divide-y ${darkMode ? 'divide-white/10' : 'divide-slate-100'}">
              {projects.map((project, idx) => (
                <div key={idx} className={`px-6 py-4 transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>{project.name}</p>
                    <div className={darkMode ? 'text-white' : 'text-slate-800'}>
                      <HealthBar score={project.health} />
                    </div>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>{project.gc}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>{project.phase}</span>
                    <span className="text-xs text-amber-500 font-medium">${(project.pending / 1000).toFixed(0)}K pending</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Budget Chart */}
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
                  borderRadius: '12px'
                }}
                formatter={(value) => [`$${value}K`, 'Amount']}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

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