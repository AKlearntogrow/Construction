import { Zap, Bell, User, Sun, Moon, LayoutDashboard, FileText, Clipboard, FileQuestion, BarChart3, Mic, Building2 } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Navbar({ currentPage, setCurrentPage }) {
  const { darkMode, toggleTheme } = useTheme()

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Building2 },
    { id: 'change-orders', label: 'Change Orders', icon: FileText },
    { id: 'daily-logs', label: 'Daily Logs', icon: Clipboard },
    { id: 'rfis', label: 'RFIs', icon: FileQuestion },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'capture', label: 'Capture', icon: Mic },
  ]

  return (
    <nav className={`border-b px-6 py-4 ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>ChangeFlow</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full font-medium">AI</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? darkMode 
                      ? 'bg-white/10 text-white' 
                      : 'bg-slate-100 text-slate-900'
                    : darkMode
                      ? 'text-white/60 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
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
  )
}






