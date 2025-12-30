import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { 
  getAllChangeOrders, 
  createChangeOrder, 
  deleteChangeOrder,
  getChangeOrderStats,
  calculateVariance 
} from '../services/changeOrderService'
import { 
  Plus, 
  Loader2, 
  FileText, 
  AlertCircle, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  ChevronRight
} from 'lucide-react'
import ChangeOrderModal from '../components/ChangeOrderModal'

export default function ChangeOrders() {
  const { darkMode } = useTheme()
  
  const [changeOrders, setChangeOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCO, setSelectedCO] = useState(null)
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [coData, statsData] = await Promise.all([
        getAllChangeOrders(),
        getChangeOrderStats()
      ])
      
      setChangeOrders(coData)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to fetch change orders:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setSelectedCO(null)
    setIsModalOpen(true)
  }

  const handleRowClick = (co) => {
    setSelectedCO(co)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedCO(null)
  }

  const handleSaved = () => {
    fetchData()
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this change order?')) return
    
    try {
      setDeletingId(id)
      await deleteChangeOrder(id)
      await fetchData()
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  // Filter change orders
  const filteredCOs = statusFilter === 'all' 
    ? changeOrders 
    : changeOrders.filter(co => co.status === statusFilter)

  // Status badge component
  const StatusBadge = ({ status }) => {
    const config = {
      draft: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', icon: Edit3 },
      submitted: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: Clock },
      approved: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: CheckCircle },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: XCircle },
    }
    const { bg, text, border, icon: Icon } = config[status] || config.draft

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${bg} ${text} ${border}`}>
        <Icon className="w-3 h-3" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  // Variance badge
  const VarianceBadge = ({ changeOrder }) => {
    if (parseFloat(changeOrder.original_amount) === 0) {
      return <span className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>—</span>
    }
    
    const { amount, percent, isOverBudget } = calculateVariance(changeOrder)
    
    if (amount === 0) {
      return <span className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-500'}`}>No variance</span>
    }

    return (
      <span className={`flex items-center gap-1 text-xs font-medium ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
        {isOverBudget ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isOverBudget ? '+' : ''}{percent}%
        <span className="opacity-60">(${Math.abs(amount).toLocaleString()})</span>
      </span>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Change Orders
          </h1>
          <p className={`mt-1 ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>
            {stats?.total || 0} total • {stats?.submitted || 0} awaiting approval
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Change Order
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className={`rounded-xl p-4 ${darkMode ? 'bg-white/10' : 'bg-white border border-slate-200'}`}>
            <p className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>DRAFT</p>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{stats.draft}</p>
          </div>
          <div className={`rounded-xl p-4 ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50 border border-blue-200'}`}>
            <p className={`text-xs font-medium text-blue-500`}>SUBMITTED</p>
            <p className={`text-2xl font-bold text-blue-500`}>{stats.submitted}</p>
          </div>
          <div className={`rounded-xl p-4 ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50 border border-emerald-200'}`}>
            <p className={`text-xs font-medium text-emerald-500`}>APPROVED</p>
            <p className={`text-2xl font-bold text-emerald-500`}>{stats.approved}</p>
          </div>
          <div className={`rounded-xl p-4 ${darkMode ? 'bg-red-500/10' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-xs font-medium text-red-500`}>REJECTED</p>
            <p className={`text-2xl font-bold text-red-500`}>{stats.rejected}</p>
          </div>
        </div>
      )}

      {/* Variance Summary */}
      {stats && stats.totalOriginal > 0 && (
        <div className={`rounded-xl p-4 mb-8 ${
          darkMode ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                Total Variance (Original vs Current)
              </p>
              <div className="flex items-center gap-4 mt-1">
                <span className={`text-sm ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  Original: ${stats.totalOriginal.toLocaleString()}
                </span>
                <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-white/20' : 'text-slate-300'}`} />
                <span className={`text-sm ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  Current: ${stats.totalCurrent.toLocaleString()}
                </span>
              </div>
            </div>
            <div className={`text-right ${stats.totalVariance >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              <p className="text-2xl font-bold">
                {stats.totalVariance >= 0 ? '+' : ''}${stats.totalVariance.toLocaleString()}
              </p>
              <p className="text-sm">
                {stats.totalVariance >= 0 ? '+' : ''}{stats.variancePercent}% variance
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'draft', 'submitted', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-emerald-500 text-white'
                : darkMode
                  ? 'bg-white/10 text-white/60 hover:bg-white/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Change Orders Table */}
      <div className={`rounded-2xl border ${
        darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'
      }`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-red-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        ) : filteredCOs.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No change orders {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}</p>
            <button
              onClick={handleCreateNew}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            >
              Create your first Change Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-left text-sm border-b ${
                  darkMode ? 'text-white/40 border-white/10' : 'text-slate-400 border-slate-200'
                }`}>
                  <th className="p-4 font-medium">CO Number</th>
                  <th className="p-4 font-medium">Title</th>
                  <th className="p-4 font-medium">Project</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Current Amount</th>
                  <th className="p-4 font-medium">Variance</th>
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCOs.map((co) => (
                  <tr 
                    key={co.id}
                    onClick={() => handleRowClick(co)}
                    className={`border-b transition-colors cursor-pointer ${
                      darkMode ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <td className={`p-4 font-mono font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {co.co_number}
                    </td>
                    <td className={`p-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      {co.title || 'Untitled'}
                    </td>
                    <td className={`p-4 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                      {co.project_name || '—'}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={co.status} />
                    </td>
                    <td className={`p-4 font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      ${parseFloat(co.current_amount || 0).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <VarianceBadge changeOrder={co} />
                    </td>
                    <td className={`p-4 text-sm ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                      {new Date(co.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {co.status === 'draft' && (
                        <button
                          onClick={(e) => handleDelete(e, co.id)}
                          disabled={deletingId === co.id}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode 
                              ? 'text-red-400 hover:bg-red-500/20' 
                              : 'text-red-500 hover:bg-red-50'
                          } disabled:opacity-50`}
                          title="Delete"
                        >
                          {deletingId === co.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Order Modal */}
      <ChangeOrderModal
        changeOrder={selectedCO}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaved}
        darkMode={darkMode}
      />
    </main>
  )
}
