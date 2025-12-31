import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { getActiveProjects } from '../services/projectService'
import { 
  getDailyLogsByProject, 
  createDailyLog, 
  updateDailyLog,
  WEATHER_CONDITIONS 
} from '../services/dailyLogService'
import { CONSTRUCTION_TRADES } from '../data/trades'
import { supabase } from '../lib/supabase'
import { 
  Plus, 
  Loader2, 
  Calendar,
  AlertCircle, 
  Trash2, 
  X,
  Save,
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
  Users,
  FileText,
  Building2,
  Clipboard
} from 'lucide-react'

export default function DailyLogs() {
  const { darkMode } = useTheme()
  
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [dailyLogs, setDailyLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState([])
  
  const [formData, setFormData] = useState({
    log_date: new Date().toISOString().split('T')[0],
    weather_condition: 'clear',
    temperature_high: '',
    temperature_low: '',
    weather_delay_hours: '0',
    site_conditions: '',
    work_performed: '',
    work_planned_tomorrow: '',
    delays: '',
    safety_incidents: '',
    visitors: '',
    deliveries: '',
    notes: '',
  })
  
  const [laborEntries, setLaborEntries] = useState([])

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      loadDailyLogs()
    } else {
      setDailyLogs([])
    }
  }, [selectedProjectId])

  const loadProjects = async () => {
    try {
      const data = await getActiveProjects()
      setProjects(data)
      if (data.length > 0) {
        setSelectedProjectId(data[0].id)
      }
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }

  const loadDailyLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getDailyLogsByProject(selectedProjectId)
      setDailyLogs(data)
    } catch (err) {
      console.error('Failed to load daily logs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingLog(null)
    setFormData({
      log_date: new Date().toISOString().split('T')[0],
      weather_condition: 'clear',
      temperature_high: '',
      temperature_low: '',
      weather_delay_hours: '0',
      site_conditions: '',
      work_performed: '',
      work_planned_tomorrow: '',
      delays: '',
      safety_incidents: '',
      visitors: '',
      deliveries: '',
      notes: '',
    })
    setLaborEntries([{ trade: '', worker_count: 1, regular_hours: 8, overtime_hours: 0, work_description: '' }])
    setFormErrors([])
    setIsModalOpen(true)
  }

  const handleEdit = (log) => {
    setEditingLog(log)
    setFormData({
      log_date: log.log_date || '',
      weather_condition: log.weather_condition || 'clear',
      temperature_high: log.temperature_high || '',
      temperature_low: log.temperature_low || '',
      weather_delay_hours: log.weather_delay_hours || '0',
      site_conditions: log.site_conditions || '',
      work_performed: log.work_performed || '',
      work_planned_tomorrow: log.work_planned_tomorrow || '',
      delays: log.delays || '',
      safety_incidents: log.safety_incidents || '',
      visitors: log.visitors || '',
      deliveries: log.deliveries || '',
      notes: log.notes || '',
    })
    setLaborEntries(log.labor?.length > 0 
      ? log.labor.map(l => ({
          trade: l.trade || '',
          worker_count: l.worker_count || 1,
          regular_hours: l.regular_hours || 8,
          overtime_hours: l.overtime_hours || 0,
          work_description: l.work_description || ''
        }))
      : [{ trade: '', worker_count: 1, regular_hours: 8, overtime_hours: 0, work_description: '' }]
    )
    setFormErrors([])
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormErrors([])

    if (!formData.log_date) {
      setFormErrors(['Date is required'])
      return
    }

    const validLabor = laborEntries.filter(l => l.trade && l.worker_count > 0)
    const totalWorkers = validLabor.reduce((sum, l) => sum + parseInt(l.worker_count || 0), 0)
    const totalHours = validLabor.reduce((sum, l) => {
      const workers = parseInt(l.worker_count || 0)
      const regular = parseFloat(l.regular_hours || 0)
      const overtime = parseFloat(l.overtime_hours || 0)
      return sum + (workers * (regular + overtime))
    }, 0)

    const saveData = {
      project_id: selectedProjectId,
      log_date: formData.log_date,
      weather_condition: formData.weather_condition,
      temperature_high: formData.temperature_high ? parseInt(formData.temperature_high) : null,
      temperature_low: formData.temperature_low ? parseInt(formData.temperature_low) : null,
      weather_delay_hours: parseFloat(formData.weather_delay_hours) || 0,
      site_conditions: formData.site_conditions || null,
      work_performed: formData.work_performed || null,
      work_planned_tomorrow: formData.work_planned_tomorrow || null,
      delays: formData.delays || null,
      safety_incidents: formData.safety_incidents || null,
      visitors: formData.visitors || null,
      deliveries: formData.deliveries || null,
      notes: formData.notes || null,
      total_workers: totalWorkers,
      total_hours: totalHours,
    }

    setSaving(true)
    try {
      let logId
      if (editingLog) {
        await updateDailyLog(editingLog.id, saveData)
        logId = editingLog.id
      } else {
        const newLog = await createDailyLog(saveData)
        logId = newLog.id
      }

      if (logId && validLabor.length > 0) {
        if (editingLog) {
          await supabase.from('daily_log_labor').delete().eq('daily_log_id', logId)
        }
        
        const laborToInsert = validLabor.map(l => ({
          daily_log_id: logId,
          trade: l.trade,
          worker_count: parseInt(l.worker_count),
          regular_hours: parseFloat(l.regular_hours) || 0,
          overtime_hours: parseFloat(l.overtime_hours) || 0,
          work_description: l.work_description || null,
        }))
        
        await supabase.from('daily_log_labor').insert(laborToInsert)
      }

      setIsModalOpen(false)
      await loadDailyLogs()
    } catch (err) {
      console.error('Failed to save:', err)
      setFormErrors([err.message])
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLaborChange = (index, field, value) => {
    setLaborEntries(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addLaborEntry = () => {
    setLaborEntries(prev => [...prev, { trade: '', worker_count: 1, regular_hours: 8, overtime_hours: 0, work_description: '' }])
  }

  const removeLaborEntry = (index) => {
    setLaborEntries(prev => prev.filter((_, i) => i !== index))
  }

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'clear': return <Sun className="w-5 h-5 text-yellow-400" />
      case 'partly_cloudy': return <Cloud className="w-5 h-5 text-slate-400" />
      case 'cloudy': return <Cloud className="w-5 h-5 text-slate-500" />
      case 'rain': return <CloudRain className="w-5 h-5 text-blue-400" />
      case 'snow': return <Cloud className="w-5 h-5 text-blue-200" />
      case 'wind': return <Wind className="w-5 h-5 text-slate-400" />
      case 'storm': return <CloudRain className="w-5 h-5 text-purple-400" />
      default: return <Sun className="w-5 h-5 text-yellow-400" />
    }
  }

  const StatusBadge = ({ status }) => {
    const config = {
      draft: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Draft' },
      submitted: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Submitted' },
      approved: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Approved' },
    }
    const { bg, text, label } = config[status] || config.draft
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>{label}</span>
  }

  const inputStyles = `w-full px-3 py-2 rounded-lg border transition-colors ${
    darkMode ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500/50' : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
  } outline-none`

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Daily Logs</h1>
          <p className={`mt-1 ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>Track daily site activity, weather, and manpower</p>
        </div>
        <button onClick={handleCreateNew} disabled={!selectedProjectId}
          className="px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center gap-2 disabled:opacity-50">
          <Plus className="w-5 h-5" /> New Daily Log
        </button>
      </div>

      {/* Project Selector */}
      <div className={`rounded-2xl border p-4 mb-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <Building2 className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
          <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}
            className={`flex-1 px-3 py-2 rounded-lg border ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <option value="">Select a project...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.project_code} - {project.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Daily Logs List */}
      {!selectedProjectId ? (
        <div className={`text-center py-12 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <Building2 className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-white/30' : 'text-slate-300'}`} />
          <p className={darkMode ? 'text-white/40' : 'text-slate-400'}>Select a project to view daily logs</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-400"><AlertCircle className="w-5 h-5 mr-2" />{error}</div>
      ) : dailyLogs.length === 0 ? (
        <div className={`text-center py-12 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <Clipboard className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-white/30' : 'text-slate-300'}`} />
          <p className={darkMode ? 'text-white/40' : 'text-slate-400'}>No daily logs yet</p>
          <button onClick={handleCreateNew} className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
            Create first daily log
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {dailyLogs.map((log) => (
            <div key={log.id} onClick={() => handleEdit(log)}
              className={`rounded-2xl border p-6 cursor-pointer transition-all hover:shadow-lg ${darkMode ? 'bg-white/10 border-white/20 hover:bg-white/15' : 'bg-white border-slate-200 hover:shadow-slate-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`}>
                    <Calendar className={`w-6 h-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      {new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <div className={`flex items-center gap-4 mt-1 text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                      <span className="flex items-center gap-1">
                        {getWeatherIcon(log.weather_condition)}
                        {WEATHER_CONDITIONS.find(w => w.value === log.weather_condition)?.label || 'Clear'}
                      </span>
                      {(log.temperature_high || log.temperature_low) && (
                        <span className="flex items-center gap-1">
                          <Thermometer className="w-4 h-4" />
                          {log.temperature_low && `${log.temperature_low}°`}{log.temperature_high && log.temperature_low && ' - '}{log.temperature_high && `${log.temperature_high}°F`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{log.total_workers || 0}</p>
                    <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Workers</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{log.total_hours || 0}</p>
                    <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Hours</p>
                  </div>
                  <StatusBadge status={log.status} />
                </div>
              </div>
              {log.work_performed && (
                <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
                  <p className={`text-sm ${darkMode ? 'text-white/70' : 'text-slate-600'}`}>
                    <span className={`font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Work Performed: </span>
                    {log.work_performed.length > 200 ? log.work_performed.substring(0, 200) + '...' : log.work_performed}
                  </p>
                </div>
              )}
              {log.delays && (
                <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-amber-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />Delays: {log.delays.length > 100 ? log.delays.substring(0, 100) + '...' : log.delays}</p>
                </div>
              )}
              {log.safety_incidents && (
                <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />Safety Incident Reported</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 border-b sticky top-0 z-10 ${darkMode ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-white'}`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{editingLog ? 'Edit Daily Log' : 'New Daily Log'}</h2>
              <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-slate-100 text-slate-400'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Date & Weather */}
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <Cloud className="w-5 h-5 text-blue-400" /> Date & Weather
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Date *</label>
                    <input type="date" value={formData.log_date} onChange={(e) => handleChange('log_date', e.target.value)} className={inputStyles} required />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Weather</label>
                    <select value={formData.weather_condition} onChange={(e) => handleChange('weather_condition', e.target.value)} className={inputStyles}>
                      {WEATHER_CONDITIONS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>High °F</label>
                    <input type="number" value={formData.temperature_high} onChange={(e) => handleChange('temperature_high', e.target.value)} placeholder="75" className={inputStyles} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Low °F</label>
                    <input type="number" value={formData.temperature_low} onChange={(e) => handleChange('temperature_low', e.target.value)} placeholder="55" className={inputStyles} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Weather Delay (hrs)</label>
                    <input type="number" step="0.5" value={formData.weather_delay_hours} onChange={(e) => handleChange('weather_delay_hours', e.target.value)} className={inputStyles} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Site Conditions</label>
                    <input type="text" value={formData.site_conditions} onChange={(e) => handleChange('site_conditions', e.target.value)} placeholder="Dry, muddy..." className={inputStyles} />
                  </div>
                </div>
              </div>

              {/* Manpower */}
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    <Users className="w-5 h-5 text-emerald-400" /> Manpower
                  </h3>
                  <button type="button" onClick={addLaborEntry} className="px-3 py-1 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Trade
                  </button>
                </div>
                <div className="space-y-3">
                  {laborEntries.map((entry, index) => (
                    <div key={index} className={`p-3 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-white'}`}>
                      <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-3">
                          <label className={`block text-xs mb-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Trade</label>
                          <select value={entry.trade} onChange={(e) => handleLaborChange(index, 'trade', e.target.value)} className={`${inputStyles} text-sm`}>
                            <option value="">Select...</option>
                            {CONSTRUCTION_TRADES.map(trade => <option key={trade.value} value={trade.value}>{trade.label}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className={`block text-xs mb-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Workers</label>
                          <input type="number" min="1" value={entry.worker_count} onChange={(e) => handleLaborChange(index, 'worker_count', e.target.value)} className={`${inputStyles} text-sm`} />
                        </div>
                        <div className="col-span-2">
                          <label className={`block text-xs mb-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Reg Hrs</label>
                          <input type="number" step="0.5" value={entry.regular_hours} onChange={(e) => handleLaborChange(index, 'regular_hours', e.target.value)} className={`${inputStyles} text-sm`} />
                        </div>
                        <div className="col-span-2">
                          <label className={`block text-xs mb-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>OT Hrs</label>
                          <input type="number" step="0.5" value={entry.overtime_hours} onChange={(e) => handleLaborChange(index, 'overtime_hours', e.target.value)} className={`${inputStyles} text-sm`} />
                        </div>
                        <div className="col-span-2">
                          <label className={`block text-xs mb-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Area</label>
                          <input type="text" value={entry.work_description} onChange={(e) => handleLaborChange(index, 'work_description', e.target.value)} placeholder="Floor 2" className={`${inputStyles} text-sm`} />
                        </div>
                        <div className="col-span-1">
                          {laborEntries.length > 1 && (
                            <button type="button" onClick={() => removeLaborEntry(index)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/20">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`flex items-center gap-6 mt-4 pt-4 border-t ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                  <div>
                    <span className={`text-sm ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Total Workers: </span>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{laborEntries.reduce((sum, l) => sum + parseInt(l.worker_count || 0), 0)}</span>
                  </div>
                  <div>
                    <span className={`text-sm ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Total Hours: </span>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      {laborEntries.reduce((sum, l) => sum + (parseInt(l.worker_count || 0) * (parseFloat(l.regular_hours || 0) + parseFloat(l.overtime_hours || 0))), 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Work Summary */}
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <FileText className="w-5 h-5 text-purple-400" /> Work Summary
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Work Performed Today</label>
                    <textarea value={formData.work_performed} onChange={(e) => handleChange('work_performed', e.target.value)} placeholder="Describe work completed..." rows={3} className={`${inputStyles} resize-none`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Work Planned Tomorrow</label>
                    <textarea value={formData.work_planned_tomorrow} onChange={(e) => handleChange('work_planned_tomorrow', e.target.value)} placeholder="Planned work..." rows={2} className={`${inputStyles} resize-none`} />
                  </div>
                </div>
              </div>

              {/* Issues */}
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <AlertCircle className="w-5 h-5 text-amber-400" /> Issues & Notes
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Delays</label>
                    <textarea value={formData.delays} onChange={(e) => handleChange('delays', e.target.value)} placeholder="Any delays..." rows={2} className={`${inputStyles} resize-none`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 text-red-400`}>Safety Incidents</label>
                    <textarea value={formData.safety_incidents} onChange={(e) => handleChange('safety_incidents', e.target.value)} placeholder="Safety incidents..." rows={2} className={`${inputStyles} resize-none border-red-500/30`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Visitors</label>
                    <input type="text" value={formData.visitors} onChange={(e) => handleChange('visitors', e.target.value)} placeholder="Site visitors..." className={inputStyles} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Deliveries</label>
                    <input type="text" value={formData.deliveries} onChange={(e) => handleChange('deliveries', e.target.value)} placeholder="Materials delivered..." className={inputStyles} />
                  </div>
                </div>
                <div className="mt-4">
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Notes</label>
                  <textarea value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Other notes..." rows={2} className={`${inputStyles} resize-none`} />
                </div>
              </div>

              {/* Errors */}
              {formErrors.length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {formErrors.map((err, i) => <p key={i} className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{err}</p>)}
                </div>
              )}

              {/* Footer */}
              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={`px-4 py-2 rounded-lg font-medium ${darkMode ? 'text-white/60 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'}`}>Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2 rounded-lg font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 flex items-center gap-2 disabled:opacity-50">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />{editingLog ? 'Save' : 'Create'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
