import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Capture from './pages/Capture'
import ChangeOrders from './pages/ChangeOrders'
import DailyLogs from './pages/DailyLogs'
import RFIs from './pages/RFIs'
import Reports from './pages/Reports'
import Projects from './pages/Projects'
import Login from './pages/Login'
import Signup from './pages/Signup'

function AppLayout({ children }) {
  const { darkMode } = useTheme()
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        : 'bg-gradient-to-br from-slate-100 via-white to-slate-100'
    }`}>
      <Navbar />
      {children}
    </div>
  )
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  // Don't render routes until auth state is determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Login />
      } />
      <Route path="/signup" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Signup />
      } />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/capture" element={
        <ProtectedRoute>
          <AppLayout><Capture /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/change-orders" element={
        <ProtectedRoute>
          <AppLayout><ChangeOrders /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/projects" element={
        <ProtectedRoute>
          <AppLayout><Projects /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/daily-logs" element={
        <ProtectedRoute>
          <AppLayout><DailyLogs /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/rfis" element={
        <ProtectedRoute>
          <AppLayout><RFIs /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <AppLayout><Reports /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App
