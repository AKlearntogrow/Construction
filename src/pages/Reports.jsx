import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { getActiveProjects } from '../services/projectService'
import { supabase } from '../lib/supabase'
import { BarChart3, Download, FileJson, FileSpreadsheet, Building2, Loader2, Users, DollarSign, Clock, FileText, AlertCircle, Calendar } from 'lucide-react'

export default function Reports() {
  const { darkMode } = useTheme()
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  useEffect(() => { loadProjects() }, [])
  useEffect(() => { if (selectedProjectId) loadReportData() }, [selectedProjectId, dateRange])

  const loadProjects = async () => { try { const data = await getActiveProjects(); setProjects(data) } catch (err) { console.error(err) } }

  const loadReportData = async () => {
    if (!selectedProjectId) return
    setLoading(true)
    try {
      let ticketQuery = supabase.from('tickets').select('*, cost_code:cost_code_id(code, name)').eq('project_id', selectedProjectId)
      if (dateRange.start) ticketQuery = ticketQuery.gte('work_date', dateRange.start)
      if (dateRange.end) ticketQuery = ticketQuery.lte('work_date', dateRange.end)
      const { data: tickets } = await ticketQuery
      const { data: changeOrders } = await supabase.from('change_orders').select('*').eq('project_id', selectedProjectId)
      let logQuery = supabase.from('daily_logs').select('*, labor:daily_log_labor(*)').eq('project_id', selectedProjectId)
      if (dateRange.start) logQuery = logQuery.gte('log_date', dateRange.start)
      if (dateRange.end) logQuery = logQuery.lte('log_date', dateRange.end)
      const { data: dailyLogs } = await logQuery
      const { data: rfis } = await supabase.from('rfis').select('*').eq('project_id', selectedProjectId)
      setReportData(processData(tickets || [], changeOrders || [], dailyLogs || [], rfis || []))
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const processData = (tickets, cos, logs, rfis) => {
    const ticketsByCostCode = tickets.reduce((acc, t) => { const key = (t.cost_code?.code || 'Unassigned') + ' - ' + (t.cost_code?.name || 'No Code'); if (!acc[key]) acc[key] = { count: 0, total: 0 }; acc[key].count++; acc[key].total += parseFloat(t.total_amount) || 0; return acc }, {})
    const laborByTrade = {}
    logs.forEach(log => (log.labor || []).forEach(l => { if (l.trade) { if (!laborByTrade[l.trade]) laborByTrade[l.trade] = { workers: 0, hours: 0 }; laborByTrade[l.trade].workers += parseInt(l.worker_count) || 0; laborByTrade[l.trade].hours += (parseInt(l.worker_count) || 0) * ((parseFloat(l.regular_hours) || 0) + (parseFloat(l.overtime_hours) || 0)) } }))
    return {
      tickets: { total: tickets.length, totalValue: tickets.reduce((s, t) => s + (parseFloat(t.total_amount) || 0), 0), byCostCode: ticketsByCostCode, raw: tickets },
      changeOrders: { total: cos.length, totalValue: cos.reduce((s, c) => s + (parseFloat(c.current_amount) || 0), 0), approvedValue: cos.filter(c => c.status === 'approved').reduce((s, c) => s + (parseFloat(c.current_amount) || 0), 0), raw: cos },
      dailyLogs: { total: logs.length, totalManHours: logs.reduce((s, l) => s + (parseFloat(l.total_hours) || 0), 0), weatherDelayHours: logs.reduce((s, l) => s + (parseFloat(l.weather_delay_hours) || 0), 0), laborByTrade, raw: logs },
      rfis: { total: rfis.length, withCostImpact: rfis.filter(r => r.has_cost_impact).length, raw: rfis }
    }
  }

  const exportCSV = (type) => {
    if (!reportData) return
    let csv = '', fn = ''
    if (type === 'tickets') { csv = 'Ticket,Date,Description,Total,Status,CostCode\n'; reportData.tickets.raw.forEach(t => csv += `"${t.ticket_number || ''}","${t.work_date || ''}","${(t.description || '').replace(/"/g, '""')}","${t.total_amount || 0}","${t.status || ''}","${t.cost_code?.code || ''}"\n`); fn = 'tickets.csv' }
    if (type === 'labor') { csv = 'Trade,Workers,Hours\n'; Object.entries(reportData.dailyLogs.laborByTrade).forEach(([t, d]) => csv += `"${t}","${d.workers}","${d.hours}"\n`); fn = 'labor.csv' }
    if (type === 'costcodes') { csv = 'CostCode,Tickets,Total\n'; Object.entries(reportData.tickets.byCostCode).forEach(([c, d]) => csv += `"${c}","${d.count}","${d.total.toFixed(2)}"\n`); fn = 'costcodes.csv' }
    download(csv, fn, 'text/csv')
  }

  const exportJSON = () => { if (!reportData) return; download(JSON.stringify({ exportDate: new Date().toISOString(), summary: { tickets: reportData.tickets, changeOrders: reportData.changeOrders, labor: reportData.dailyLogs, rfis: reportData.rfis } }, null, 2), 'ml_data.json', 'application/json') }

  const download = (content, filename, mime) => { const b = new Blob([content], { type: mime }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u) }

  const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0)

  const StatCard = ({ icon: Icon, label, value, sub, color = 'emerald' }) => (<div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white border border-slate-200'}`}><Icon className={`w-5 h-5 text-${color}-500 mb-2`} /><p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{value}</p><p className={`text-sm ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>{label}</p>{sub && <p className={`text-xs mt-1 text-${color}-500`}>{sub}</p>}</div>)

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8"><div><h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Reports & Analytics</h1><p className={`mt-1 ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>ML-ready data exports</p></div></div>
      <div className={`rounded-2xl border p-4 mb-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}><div className="flex items-center gap-4 flex-wrap"><Building2 className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} /><select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'}`}><option value="">Select project...</option>{projects.map(p => <option key={p.id} value={p.id}>{p.project_code} - {p.name}</option>)}</select><Calendar className={`w-5 h-5 ${darkMode ? 'text-white/40' : 'text-slate-400'}`} /><input type="date" value={dateRange.start} onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'}`} /><span className={darkMode ? 'text-white/40' : 'text-slate-400'}>to</span><input type="date" value={dateRange.end} onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'}`} /></div></div>
      {!selectedProjectId ? (<div className={`text-center py-12 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}><BarChart3 className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-white/30' : 'text-slate-300'}`} /><p className={darkMode ? 'text-white/40' : 'text-slate-400'}>Select a project</p></div>
      ) : loading ? (<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : reportData && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"><StatCard icon={FileText} label="T&M Tickets" value={reportData.tickets.total} sub={fmt(reportData.tickets.totalValue)} /><StatCard icon={DollarSign} label="Change Orders" value={reportData.changeOrders.total} sub={fmt(reportData.changeOrders.approvedValue) + ' approved'} color="blue" /><StatCard icon={Clock} label="Man Hours" value={reportData.dailyLogs.totalManHours.toLocaleString()} sub={reportData.dailyLogs.weatherDelayHours + 'h delays'} color="purple" /><StatCard icon={AlertCircle} label="RFIs" value={reportData.rfis.total} sub={reportData.rfis.withCostImpact + ' cost impact'} color="amber" /></div>
        <div className={`rounded-2xl border p-6 mb-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}><h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}><Download className="w-5 h-5 text-emerald-500" />Export</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-3"><button onClick={() => exportCSV('tickets')} className={`p-3 rounded-xl flex flex-col items-center gap-2 ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'}`}><FileSpreadsheet className="w-6 h-6 text-green-500" /><span className={`text-sm ${darkMode ? 'text-white/70' : 'text-slate-600'}`}>Tickets</span></button><button onClick={() => exportCSV('labor')} className={`p-3 rounded-xl flex flex-col items-center gap-2 ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'}`}><FileSpreadsheet className="w-6 h-6 text-green-500" /><span className={`text-sm ${darkMode ? 'text-white/70' : 'text-slate-600'}`}>Labor</span></button><button onClick={() => exportCSV('costcodes')} className={`p-3 rounded-xl flex flex-col items-center gap-2 ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'}`}><FileSpreadsheet className="w-6 h-6 text-green-500" /><span className={`text-sm ${darkMode ? 'text-white/70' : 'text-slate-600'}`}>Cost Codes</span></button><button onClick={exportJSON} className={`p-3 rounded-xl flex flex-col items-center gap-2 ${darkMode ? 'bg-emerald-500/20 hover:bg-emerald-500/30' : 'bg-emerald-50 hover:bg-emerald-100'}`}><FileJson className="w-6 h-6 text-emerald-500" /><span className={`text-sm font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>ML JSON</span></button></div></div>
        {Object.keys(reportData.dailyLogs.laborByTrade).length > 0 && (<div className={`rounded-2xl border p-6 mb-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}><h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}><Users className="w-5 h-5 text-purple-500" />Labor by Trade</h2><div className="space-y-3">{Object.entries(reportData.dailyLogs.laborByTrade).sort((a, b) => b[1].hours - a[1].hours).map(([trade, data]) => { const max = Math.max(...Object.values(reportData.dailyLogs.laborByTrade).map(d => d.hours)); return (<div key={trade}><div className="flex justify-between mb-1"><span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-700'}`}>{trade}</span><span className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>{data.hours} hrs</span></div><div className={`h-2 rounded-full ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`}><div className="h-full rounded-full bg-purple-500" style={{ width: `${(data.hours / max) * 100}%` }} /></div></div>) })}</div></div>)}
        {Object.keys(reportData.tickets.byCostCode).length > 0 && (<div className={`rounded-2xl border p-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}><h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}><BarChart3 className="w-5 h-5 text-blue-500" />By Cost Code</h2><table className="w-full"><thead><tr className={`text-left text-sm ${darkMode ? 'text-white/40' : 'text-slate-400'}`}><th className="pb-2">Code</th><th className="pb-2 text-right">Tickets</th><th className="pb-2 text-right">Value</th></tr></thead><tbody>{Object.entries(reportData.tickets.byCostCode).sort((a, b) => b[1].total - a[1].total).map(([code, data]) => (<tr key={code} className={`border-t ${darkMode ? 'border-white/10' : 'border-slate-100'}`}><td className={`py-2 ${darkMode ? 'text-white' : 'text-slate-700'}`}>{code}</td><td className={`py-2 text-right ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>{data.count}</td><td className={`py-2 text-right font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{fmt(data.total)}</td></tr>))}</tbody></table></div>)}
      </>)}
    </main>
  )
}
