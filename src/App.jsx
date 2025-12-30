import { useState } from 'react'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Capture from './pages/Capture'
import ChangeOrders from './pages/ChangeOrders'

function AppContent() {
  const { darkMode } = useTheme()
  const [currentPage, setCurrentPage] = useState('dashboard')

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-100 via-white to-slate-100'
    }`}>
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'capture' && <Capture />}
      {currentPage === 'change-orders' && <ChangeOrders />}
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
