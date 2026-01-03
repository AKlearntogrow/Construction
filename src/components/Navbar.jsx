import { useNavigate, useLocation } from 'react-router-dom'
import { Zap, Bell, User, Sun, Moon, LayoutDashboard, FileText, Clipboard, FileQuestion, BarChart3, Mic, Building2, LogOut } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { darkMode, toggleTheme } = useTheme()
  const { userProfile, company, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navItems = [
    { id: '/', label: 'Dashboard', icon: LayoutDashboard },
    { id: '/projects', label: 'Projects', icon: Building2 },
    { id: '/change-orders', label: 'Change Orders', icon: FileText },
    { id: '/daily-logs', label: 'Daily Logs', icon: Clipboard },
    { id: '/rfis', label: 'RFIs', icon: FileQuestion },
    { id: '/reports', label: 'Reports', icon: BarChart3 },
    { id: '/capture', label: 'Capture', icon: Mic },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const getUserInitials = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name[0]}${userProfile.last_name[0]}`.toUpperCase()
    }
    return 'U'
  }

  return (
    <nav className={`border-b px-6 py-4 ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
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
                onClick={() => navigate(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.id
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
          {/* Company name */}
          {company && (
            <span className={`text-sm hidden lg:block ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
              {company.name}
            </span>
          )}

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

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{getUserInitials()}</span>
              </div>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg z-20 overflow-hidden ${
                  darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
                }`}>
                  <div className={`px-4 py-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {userProfile?.first_name} {userProfile?.last_name}
                    </p>
                    <p className={`text-sm truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {userProfile?.email}
                    </p>
                    {company && (
                      <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {company.name} • {company.plan} plan
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className={`w-full px-4 py-3 text-left flex items-center gap-2 transition-colors ${
                      darkMode 
                        ? 'text-red-400 hover:bg-slate-700' 
                        : 'text-red-600 hover:bg-slate-50'
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
