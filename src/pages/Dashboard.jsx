import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { waterfallData, changeOrders, projects, warnings } from '../data/mockData'
import { getRecentTickets, getTicketStats, deleteTicket } from '../services/ticketService'
import KPICard from '../components/KPICard'
import WarningAlerts from '../components/WarningAlerts'
import ChangeOrdersTable from '../components/ChangeOrdersTable'
import ProjectHealth from '../components/ProjectHealth'
import BudgetChart from '../components/BudgetChart'
import TicketModal from '../components/TicketModal'
import ValueAtRisk from '../components/ValueAtRisk'
import { FileText, Clock, DollarSign, CheckCircle, Loader2, Trash2, AlertCircle, Edit3 } from 'lucide-react'

export default function Dashboard() {
  const { darkMode } = useTheme()
  
  // Real data state
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  
  // Modal state
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch real data on component mount
  useEffect(() => {
    fetchData()
  }, [])

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
    e.stopPropagation() // Prevent row click from firing
    if (!confirm('Are you sure you want to delete this ticket?')) return
    
    try {
      setDeletingId(id)
      await deleteTicket(id)
      await fetchData()
    } catch (err) {
      console.error('Failed to delete ticket:', err)
      alert('Failed to delete ticket: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleRowClick = (ticket) => {
    setSelectedTicket(ticket)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedTicket(null)
  }

  const handleTicketSaved = (updatedTicket) => {
    // Refresh data after edit
    fetchData()
  }

  // Build KPI data from real stats
  const kpiData = [
    {
      title: 'Total T&M Tickets',
      value: stats?.total || 0,
      change: `${stats?.thisMonthCount || 0} this month`,
      trend: 'up',
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Pending Review',
      value: stats?.pending || 0,
      change: `$${(stats?.pendingValue || 0).toLocaleString()} value`,
      trend: 'neutral',
      icon: Clock,
      color: 'amber'
    },
    {
      title: 'Approved',
      value: stats?.approved || 0,
      change: `$${(stats?.approvedValue || 0).toLocaleString()} total`,
      trend: 'up',
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      title: 'Total Value',
      value: `$${(stats?.totalValue || 0).toLocaleString()}`,
      change: 'All tickets',
      trend: 'up',
      icon: DollarSign,
      color: 'violet'
    }
  ]

  // Status badge component
  const StatusBadge = ({ status }) => {
    const styles = {
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      submitted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Dashboard</h1>
        <p className={`mt-1 ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>
          {stats?.total || 0} T&M tickets • Real-time insights
        </p>
      </div>

      {/* Early Warning Alerts */}
      <WarningAlerts warnings={warnings} />

      {/* KPI Cards - Now with real data */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className={`rounded-2xl p-6 ${darkMode ? 'bg-white/10' : 'bg-white'} animate-pulse`}>
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiData.map((kpi, idx) => (
            <KPICard key={idx} {...kpi} />
          ))}
        </div>
      )}

      {/* Value at Risk Dashboard */}
      <div className="mb-8">
        <ValueAtRisk darkMode={darkMode} />
      </div>

      {/* Recent T&M Tickets - NEW SECTION with real data */}
      <div className={`rounded-2xl border p-6 mb-8 ${
        darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Recent T&M Tickets
          </h2>
          <button 
            onClick={fetchData}
            className={`text-sm px-3 py-1 rounded-lg transition-colors ${
              darkMode ? 'text-white/60 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-red-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        ) : tickets.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No T&M tickets yet</p>
            <p className="text-sm mt-1">Create your first ticket from the Capture page</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-left text-sm border-b ${
                  darkMode ? 'text-white/40 border-white/10' : 'text-slate-400 border-slate-200'
                }`}>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    onClick={() => handleRowClick(ticket)}
                    className={`border-b transition-colors cursor-pointer ${
                      darkMode ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <td className={`py-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      <div className="flex items-center gap-2">
                        <Edit3 className={`w-3.5 h-3.5 ${darkMode ? 'text-white/30' : 'text-slate-300'}`} />
                        <span>
                          {ticket.description?.substring(0, 40) || 'No description'}
                          {ticket.description?.length > 40 ? '...' : ''}
                        </span>
                      </div>
                    </td>
                    <td className={`py-4 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                      {ticket.location || '—'}
                    </td>
                    <td className="py-4 text-emerald-500 font-medium">
                      ${parseFloat(ticket.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className={`py-4 text-sm ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <button
                        onClick={(e) => handleDeleteTicket(e, ticket.id)}
                        disabled={deletingId === ticket.id}
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode 
                            ? 'text-red-400 hover:bg-red-500/20' 
                            : 'text-red-500 hover:bg-red-50'
                        } disabled:opacity-50`}
                        title="Delete ticket"
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

      {/* Two Column Layout - Keep existing mock components */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ChangeOrdersTable changeOrders={changeOrders} />
        </div>
        <div>
          <ProjectHealth projects={projects} />
        </div>
      </div>

      {/* Budget Chart */}
      <BudgetChart data={waterfallData} />

      {/* Ticket Edit Modal */}
      <TicketModal
        ticket={selectedTicket}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleTicketSaved}
        darkMode={darkMode}
      />
    </main>
  )
}
