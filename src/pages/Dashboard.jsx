import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { waterfallData, changeOrders, projects, warnings } from '../data/mockData'
import { getRecentTickets, getTicketStats, deleteTicket } from '../services/ticketService'
import KPICard from '../components/KPICard'
import WarningAlerts from '../components/WarningAlerts'
import GettingStarted from '../components/GettingStarted'
import ChangeOrdersTable from '../components/ChangeOrdersTable'
import ProjectHealth from '../components/ProjectHealth'
import BudgetChart from '../components/BudgetChart'
import TicketModal from '../components/TicketModal'
import ValueAtRisk from '../components/ValueAtRisk'
import { FileText, Clock, DollarSign, CheckCircle, Loader2, Trash2, AlertCircle, Edit3 } from 'lucide-react'
import { parseLocalDate } from '../utils/validation'

export default function Dashboard() {
  const { darkMode } = useTheme()
  const { company, userProfile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Real data state
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // Modal state
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Redirect to onboarding if no company
  useEffect(() => {
    if (!authLoading && userProfile && !company) {
      navigate('/onboarding')
    }
  }, [authLoading, userProfile, company, navigate])

  // Fetch real data on component mount
  useEffect(() => {
    if (company) {
      fetchData()
    }
  }, [company])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [ticketsData, statsData] = await Promise.all([
        getRecentTickets(10),
        getTicketStats()
      ])
      setTickets(ticketsData)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTicket = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this ticket?')) return

    try {
      setDeletingId(id)
      await deleteTicket(id)
      await fetchData()
    } catch (err) {
      console.error('Failed to delete ticket:', err)
      alert('Failed to delete ticket')
    } finally {
      setDeletingId(null)
    }
  }

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket)
    setIsModalOpen(true)
  }

  // Show loading if auth is still loading or no company yet
  if (authLoading || (!company && userProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  const kpiData = stats ? [
    { 
      title: 'Total T&M Tickets', 
      value: stats.total.toString(), 
      sub: `${stats.thisMonthCount} this month`,
      icon: FileText,
      color: 'blue'
    },
    { 
      title: 'Pending Review', 
      value: (stats.pending || 0).toString(), 
      sub: `$${((stats.pendingValue || 0) / 1000).toFixed(0)}K value`,
      icon: Clock,
      color: 'orange'
    },
    { 
      title: 'Approved', 
      value: (stats.approved || 0).toString(), 
      sub: `$${((stats.approvedValue || 0) / 1000).toFixed(0)}K total`,
      icon: CheckCircle,
      color: 'green'
    },
    { 
      title: 'Total Value', 
      value: `$${(stats.totalValue / 1000).toFixed(0)}K`,
      sub: 'All tickets',
      icon: DollarSign,
      color: 'purple'
    }
  ] : []

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Dashboard
        </h1>
        <p className={`mt-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
          {stats?.total || 0} T&M tickets • Real-time insights
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-500">{error}</p>
          <button onClick={fetchData} className="ml-auto text-red-500 hover:text-red-400">
            Retry
          </button>
        </div>
      )}

      {/* Getting Started */}
      <GettingStarted />

      {/* Warning Alerts */}
      <WarningAlerts warnings={warnings} />

      {/* KPI Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>
      )}

      {/* Value at Risk */}
      <ValueAtRisk />

      {/* Recent T&M Tickets */}
      <div className={`rounded-2xl p-6 mb-8 ${
        darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'
      }`}>
        <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Recent T&M Tickets
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : tickets.length === 0 ? (
          <p className={`text-center py-8 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
            No tickets yet. Create your first T&M ticket!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-left text-sm ${darkMode ? 'text-white/40' : 'text-slate-500'}`}>
                  <th className="pb-3 font-medium">Ticket #</th>
                  <th className="pb-3 font-medium">Project</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className={`text-sm ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>
                {tickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    onClick={() => handleTicketClick(ticket)}
                    className={`border-t cursor-pointer transition-colors ${
                      darkMode 
                        ? 'border-white/5 hover:bg-white/5' 
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 font-mono text-amber-500">{ticket.ticket_number}</td>
                    <td className="py-3">{ticket.projects?.name || 'Unknown'}</td>
                    <td className="py-3 max-w-xs truncate">{ticket.description}</td>
                    <td className="py-3 font-semibold">
                      ${(ticket.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.status === 'approved' 
                          ? 'bg-green-500/20 text-green-500'
                          : ticket.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-500'
                          : ticket.status === 'rejected'
                          ? 'bg-red-500/20 text-red-500'
                          : 'bg-slate-500/20 text-slate-500'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">
                      {parseLocalDate(ticket.work_date).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={(e) => handleDeleteTicket(e, ticket.id)}
                        disabled={deletingId === ticket.id}
                        className={`p-1 rounded transition-colors ${
                          darkMode
                            ? 'hover:bg-red-500/20 text-white/40 hover:text-red-500'
                            : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                        }`}
                      >
                        {deletingId === ticket.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProjectHealth projects={projects} />
        <BudgetChart data={waterfallData} />
      </div>

      {/* Ticket Modal */}
      <TicketModal
        ticket={selectedTicket}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTicket(null)
        }}
      />
    </main>
  )
}



