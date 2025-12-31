import { useState, useEffect } from 'react'
import { DollarSign, Clock, AlertTriangle, TrendingUp, ChevronRight, Building2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ValueAtRisk({ darkMode }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('status') // 'status' or 'project'

  useEffect(() => {
    fetchValueAtRisk()
  }, [])

  const fetchValueAtRisk = async () => {
    try {
      // Fetch tickets with project info
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          id, status, total_amount, created_at,
          project:project_id(id, name, project_code)
        `)

      if (ticketsError) throw ticketsError

      // Fetch change orders
      const { data: changeOrders, error: coError } = await supabase
        .from('change_orders')
        .select(`
          id, status, current_amount, created_at, submitted_at,
          project:project_id(id, name, project_code)
        `)

      if (coError) throw coError

      const now = new Date()

      // Process tickets by status
      const statusBreakdown = {
        draft: { count: 0, value: 0, items: [], label: 'Draft', color: 'slate', avgDays: 0 },
        pending_review: { count: 0, value: 0, items: [], label: 'Pending Review', color: 'amber', avgDays: 0 },
        approved: { count: 0, value: 0, items: [], label: 'Approved', color: 'emerald', avgDays: 0 },
        rejected: { count: 0, value: 0, items: [], label: 'Rejected', color: 'red', avgDays: 0 },
        billed: { count: 0, value: 0, items: [], label: 'Billed', color: 'blue', avgDays: 0 },
        paid: { count: 0, value: 0, items: [], label: 'Paid', color: 'green', avgDays: 0 }
      }

      // Process tickets
      tickets?.forEach(ticket => {
        const status = ticket.status || 'draft'
        const amount = parseFloat(ticket.total_amount || 0)
        const daysOld = Math.floor((now - new Date(ticket.created_at)) / (1000 * 60 * 60 * 24))

        if (statusBreakdown[status]) {
          statusBreakdown[status].count++
          statusBreakdown[status].value += amount
          statusBreakdown[status].items.push({ ...ticket, daysOld })
        }
      })

      // Calculate average days for each status
      Object.keys(statusBreakdown).forEach(status => {
        const items = statusBreakdown[status].items
        if (items.length > 0) {
          statusBreakdown[status].avgDays = Math.round(
            items.reduce((sum, item) => sum + item.daysOld, 0) / items.length
          )
        }
      })

      // Process by project
      const projectBreakdown = {}
      tickets?.forEach(ticket => {
        const projectId = ticket.project?.id || 'unassigned'
        const projectName = ticket.project?.name || 'Unassigned'
        const projectCode = ticket.project?.project_code || ''

        if (!projectBreakdown[projectId]) {
          projectBreakdown[projectId] = {
            name: projectName,
            code: projectCode,
            draft: 0,
            pending: 0,
            approved: 0,
            total: 0
          }
        }

        const amount = parseFloat(ticket.total_amount || 0)
        projectBreakdown[projectId].total += amount

        if (ticket.status === 'draft') {
          projectBreakdown[projectId].draft += amount
        } else if (ticket.status === 'pending_review') {
          projectBreakdown[projectId].pending += amount
        } else if (ticket.status === 'approved') {
          projectBreakdown[projectId].approved += amount
        }
      })

      // CO stats
      const coStats = {
        draft: { count: 0, value: 0 },
        submitted: { count: 0, value: 0, avgDays: 0, items: [] },
        approved: { count: 0, value: 0 },
        rejected: { count: 0, value: 0 }
      }

      changeOrders?.forEach(co => {
        const status = co.status || 'draft'
        const amount = parseFloat(co.current_amount || 0)

        if (coStats[status]) {
          coStats[status].count++
          coStats[status].value += amount

          if (status === 'submitted' && co.submitted_at) {
            const daysWaiting = Math.floor((now - new Date(co.submitted_at)) / (1000 * 60 * 60 * 24))
            coStats[status].items.push({ ...co, daysWaiting })
          }
        }
      })

      // Calculate avg waiting days for submitted COs
      if (coStats.submitted.items.length > 0) {
        coStats.submitted.avgDays = Math.round(
          coStats.submitted.items.reduce((sum, item) => sum + item.daysWaiting, 0) / coStats.submitted.items.length
        )
      }

      // Identify overdue items (> 14 days in pending/submitted)
      const overdueTickets = statusBreakdown.pending_review.items.filter(t => t.daysOld > 14)
      const overdueCOs = coStats.submitted.items.filter(co => co.daysWaiting > 14)

      setData({
        statusBreakdown,
        projectBreakdown: Object.values(projectBreakdown).sort((a, b) => b.total - a.total),
        coStats,
        overdue: {
          tickets: overdueTickets,
          changeOrders: overdueCOs,
          totalValue: overdueTickets.reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0) +
                      overdueCOs.reduce((sum, co) => sum + parseFloat(co.current_amount || 0), 0)
        },
        totals: {
          atRisk: statusBreakdown.draft.value + statusBreakdown.pending_review.value + coStats.submitted.value,
          approved: statusBreakdown.approved.value + coStats.approved.value,
          all: tickets?.reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0) || 0
        }
      })
    } catch (err) {
      console.error('Failed to fetch value at risk:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`rounded-2xl p-6 ${darkMode ? 'bg-white/5' : 'bg-white border border-slate-200'}`}>
        <div className="animate-pulse space-y-4">
          <div className={`h-6 w-48 rounded ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-24 rounded-xl ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const StatusCard = ({ status, info }) => {
    const colorMap = {
      slate: { bg: darkMode ? 'bg-slate-500/20' : 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-500/30' },
      amber: { bg: darkMode ? 'bg-amber-500/20' : 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-500/30' },
      emerald: { bg: darkMode ? 'bg-emerald-500/20' : 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-500/30' },
      red: { bg: darkMode ? 'bg-red-500/20' : 'bg-red-50', text: 'text-red-500', border: 'border-red-500/30' },
      blue: { bg: darkMode ? 'bg-blue-500/20' : 'bg-blue-50', text: 'text-blue-500', border: 'border-blue-500/30' },
      green: { bg: darkMode ? 'bg-green-500/20' : 'bg-green-50', text: 'text-green-500', border: 'border-green-500/30' }
    }
    const colors = colorMap[info.color] || colorMap.slate

    return (
      <div className={`rounded-xl p-4 border ${colors.bg} ${colors.border}`}>
        <p className={`text-xs font-medium ${colors.text}`}>{info.label}</p>
        <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          ${info.value.toLocaleString()}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
            {info.count} ticket{info.count !== 1 ? 's' : ''}
          </span>
          {info.avgDays > 0 && (
            <span className={`text-xs flex items-center gap-1 ${info.avgDays > 14 ? 'text-red-400' : darkMode ? 'text-white/40' : 'text-slate-400'}`}>
              <Clock className="w-3 h-3" />
              {info.avgDays}d avg
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl p-6 ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Value at Risk
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>
            Money waiting for action at each stage
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('status')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'status'
                ? 'bg-emerald-500 text-white'
                : darkMode ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-600'
            }`}
          >
            By Status
          </button>
          <button
            onClick={() => setViewMode('project')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'project'
                ? 'bg-emerald-500 text-white'
                : darkMode ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-600'
            }`}
          >
            By Project
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      <div className={`rounded-xl p-4 mb-6 ${darkMode ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20' : 'bg-gradient-to-r from-amber-50 to-red-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Total at Risk (Draft + Pending)
              </p>
              <p className={`text-xs ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>
                Needs action to convert to revenue
              </p>
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-500">
            ${data.totals.atRisk.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Overdue Alert */}
      {data.overdue.totalValue > 0 && (
        <div className={`rounded-xl p-4 mb-6 border ${darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-red-500" />
            <div className="flex-1">
              <p className={`text-sm font-medium text-red-500`}>
                Overdue Items ({data.overdue.tickets.length + data.overdue.changeOrders.length})
              </p>
              <p className={`text-xs ${darkMode ? 'text-red-400/70' : 'text-red-400'}`}>
                Waiting more than 14 days for action
              </p>
            </div>
            <p className="text-xl font-bold text-red-500">
              ${data.overdue.totalValue.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Status View */}
      {viewMode === 'status' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(data.statusBreakdown).map(([status, info]) => (
            <StatusCard key={status} status={status} info={info} />
          ))}
        </div>
      )}

      {/* Project View */}
      {viewMode === 'project' && (
        <div className="space-y-3">
          {data.projectBreakdown.map((project, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-4 ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className={`w-4 h-4 ${darkMode ? 'text-white/40' : 'text-slate-400'}`} />
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {project.code ? `${project.code} - ` : ''}{project.name}
                  </span>
                </div>
                <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  ${project.total.toLocaleString()}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                {project.draft > 0 && (
                  <div
                    className="h-full bg-slate-400"
                    style={{ width: `${(project.draft / project.total) * 100}%` }}
                    title={`Draft: $${project.draft.toLocaleString()}`}
                  />
                )}
                {project.pending > 0 && (
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${(project.pending / project.total) * 100}%` }}
                    title={`Pending: $${project.pending.toLocaleString()}`}
                  />
                )}
                {project.approved > 0 && (
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${(project.approved / project.total) * 100}%` }}
                    title={`Approved: $${project.approved.toLocaleString()}`}
                  />
                )}
              </div>
              <div className="flex gap-4 mt-2 text-xs">
                <span className={`flex items-center gap-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  <span className="w-2 h-2 rounded-full bg-slate-400" /> Draft: ${project.draft.toLocaleString()}
                </span>
                <span className={`flex items-center gap-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending: ${project.pending.toLocaleString()}
                </span>
                <span className={`flex items-center gap-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Approved: ${project.approved.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
          {data.projectBreakdown.length === 0 && (
            <p className={`text-center py-8 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
              No project data available
            </p>
          )}
        </div>
      )}

      {/* Change Orders Summary */}
      <div className="mt-6 pt-6 border-t border-dashed dark:border-white/10">
        <h3 className={`text-sm font-medium mb-4 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
          Change Orders Pipeline
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`rounded-lg p-3 ${darkMode ? 'bg-slate-500/20' : 'bg-slate-100'}`}>
            <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Draft</p>
            <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              ${data.coStats.draft.value.toLocaleString()}
            </p>
            <p className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>{data.coStats.draft.count} COs</p>
          </div>
          <div className={`rounded-lg p-3 ${darkMode ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
            <p className="text-xs text-blue-500">Submitted</p>
            <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              ${data.coStats.submitted.value.toLocaleString()}
            </p>
            <p className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>
              {data.coStats.submitted.count} COs
              {data.coStats.submitted.avgDays > 0 && ` • ${data.coStats.submitted.avgDays}d avg`}
            </p>
          </div>
          <div className={`rounded-lg p-3 ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
            <p className="text-xs text-emerald-500">Approved</p>
            <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              ${data.coStats.approved.value.toLocaleString()}
            </p>
            <p className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>{data.coStats.approved.count} COs</p>
          </div>
          <div className={`rounded-lg p-3 ${darkMode ? 'bg-red-500/20' : 'bg-red-50'}`}>
            <p className="text-xs text-red-500">Rejected</p>
            <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              ${data.coStats.rejected.value.toLocaleString()}
            </p>
            <p className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>{data.coStats.rejected.count} COs</p>
          </div>
        </div>
      </div>
    </div>
  )
}
