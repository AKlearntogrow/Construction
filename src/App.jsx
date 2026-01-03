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
import Onboarding from './pages/Onboarding'

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

// Wrapper that checks for company and redirects to onboarding if needed
function RequireCompany({ children }) {
  const { userProfile, company, loading } = useAuth()
  
  // Still loading - show nothing
  if (loading) return null
  
  // User profile loaded but no company - redirect to onboarding
  if (userProfile && !company) {
    return <Navigate to="/onboarding" replace />
  }
  
  // Edge case: no profile yet (shouldn't happen after loading=false, but safety check)
  if (!userProfile) {
    return null
  }
  
  return children
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

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

      {/* Onboarding - requires auth but not company */}
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      } />

      {/* Protected routes - require auth AND company */}
      <Route path="/" element={
        <ProtectedRoute>
          <RequireCompany>
            <AppLayout><Dashboard /></AppLayout>
          </RequireCompany>
        </ProtectedRoute>
      } />
      <Route path="/capture" element={
        <ProtectedRoute>
          <RequireCompany>
            <AppLayout><Capture /></AppLayout>
          </RequireCompany>
        </ProtectedRoute>
      } />
      <Route path="/change-orders" element={
        <ProtectedRoute>
          <RequireCompany>
            <AppLayout><ChangeOrders /></AppLayout>
          </RequireCompany>
        </ProtectedRoute>
      } />
      <Route path="/projects" element={
        <ProtectedRoute>
          <RequireCompany>
            <AppLayout><Projects /></AppLayout>
          </RequireCompany>
        </ProtectedRoute>
      } />
      <Route path="/daily-logs" element={
        <ProtectedRoute>
          <RequireCompany>
            <AppLayout><DailyLogs /></AppLayout>
          </RequireCompany>
        </ProtectedRoute>
      } />
      <Route path="/rfis" element={
        <ProtectedRoute>
          <RequireCompany>
            <AppLayout><RFIs /></AppLayout>
          </RequireCompany>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <RequireCompany>
            <AppLayout><Reports /></AppLayout>
          </RequireCompany>
        </ProtectedRoute>
      } />

      {/* Catch all */}
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
