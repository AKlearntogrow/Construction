import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { getActiveProjects } from '../services/projectService'
import { 
  getRFIsByProject, 
  createRFI, 
  updateRFI,
  respondToRFI,
  RFI_STATUSES,
  RFI_PRIORITIES 
} from '../services/rfiService'
import { 
  Plus, 
  Loader2, 
  AlertCircle, 
  X,
  Save,
  Building2,
  MessageSquare,
  Clock,
  CheckCircle,
  FileQuestion,
  Send,
  DollarSign,
  Calendar,
  MapPin,
  FileText,
  AlertTriangle
} from 'lucide-react'

export default function RFIs() {
  const { darkMode } = useTheme()
  
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [rfis, setRFIs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isResponseModal, setIsResponseModal] = useState(false)
  const [editingRFI, setEditingRFI] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState([])
  
  const [formData, setFormData] = useState({
    title: '',
    question: '',
    suggestion: '',
    drawing_number: '',
    spec_section: '',
    location: '',
    priority: 'normal',
    date_required: '',
    has_cost_impact: false,
    estimated_cost_impact: '',
    has_schedule_impact: false,
    estimated_schedule_impact: '',
  })
  
  const [responseText, setResponseText] = useState('')

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      loadRFIs()
    } else {
      setRFIs([])
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

  const loadRFIs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getRFIsByProject(selectedProjectId)
      setRFIs(data)
    } catch (err) {
      console.error('Failed to load RFIs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingRFI(null)
    setFormData({
      title: '',
      question: '',
      suggestion: '',
      drawing_number: '',
      spec_section: '',
      location: '',
      priority: 'normal',
      date_required: '',
      has_cost_impact: false,
      estimated_cost_impact: '',
      has_schedule_impact: false,
      estimated_schedule_impact: '',
    })
    setFormErrors([])
    setIsModalOpen(true)
  }

  const handleEdit = (rfi) => {
    setEditingRFI(rfi)
    setFormData({
      title: rfi.title || '',
      question: rfi.question || '',
      suggestion: rfi.suggestion || '',
      drawing_number: rfi.drawing_number || '',
      spec_section: rfi.spec_section || '',
      location: rfi.location || '',
      priority: rfi.priority || 'normal',
      date_required: rfi.date_required || '',
      has_cost_impact: rfi.has_cost_impact || false,
      estimated_cost_impact: rfi.estimated_cost_impact || '',
      has_schedule_impact: rfi.has_schedule_impact || false,
      estimated_schedule_impact: rfi.estimated_schedule_impact || '',
    })
    setFormErrors([])
    setIsModalOpen(true)
  }

  const handleOpenResponse = (rfi) => {
    setEditingRFI(rfi)
    setResponseText(rfi.response || '')
    setIsResponseModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormErrors([])

    if (!formData.title.trim()) {
      setFormErrors(['Title is required'])
      return
    }
    if (!formData.question.trim()) {
      setFormErrors(['Question is required'])
      return
    }

    const saveData = {
      project_id: selectedProjectId,
      title: formData.title.trim(),
      question: formData.question.trim(),
      suggestion: formData.suggestion.trim() || null,
      drawing_number: formData.drawing_number.trim() || null,
      spec_section: formData.spec_section.trim() || null,
      location: formData.location.trim() || null,
      priority: formData.priority,
      date_required: formData.date_required || null,
      has_cost_impact: formData.has_cost_impact,
      estimated_cost_impact: formData.has_cost_impact ? parseFloat(formData.estimated_cost_impact) || 0 : null,
      has_schedule_impact: formData.has_schedule_impact,
      estimated_schedule_impact: formData.has_schedule_impact ? parseInt(formData.estimated_schedule_impact) || 0 : null,
    }

    setSaving(true)
    try {
      if (editingRFI) {
        await updateRFI(editingRFI.id, saveData)
      } else {
        await createRFI(saveData)
      }
      setIsModalOpen(false)
      await loadRFIs()
    } catch (err) {
      console.error('Failed to save:', err)
      setFormErrors([err.message])
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitResponse = async (e) => {
    e.preventDefault()
    if (!responseText.trim()) {
      return
    }

    setSaving(true)
    try {
      await respondToRFI(editingRFI.id, responseText.trim())
      setIsResponseModal(false)
      await loadRFIs()
    } catch (err) {
      console.error('Failed to respond:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getStatusBadge = (status) => {
    const config = {
      draft: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Draft' },
      submitted: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Submitted' },
      under_review: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Under Review' },
      responded: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Responded' },
      closed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Closed' },
    }
    const { bg, text, label } = config[status] || config.draft
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>{label}</span>
  }

  const getPriorityBadge = (priority) => {
    const config = {
      low: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
      normal: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      high: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
      urgent: { bg: 'bg-red-500/20', text: 'text-red-400' },
    }
    const { bg, text } = config[priority] || config.normal
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>{priority}</span>
  }

  const inputStyles = `w-full px-3 py-2 rounded-lg border transition-colors ${
    darkMode ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500/50' : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
  } outline-none`

  // Stats
  const openRFIs = rfis.filter(r => !['closed', 'responded'].includes(r.status)).length
  const respondedRFIs = rfis.filter(r => r.status === 'responded').length
  const withCostImpact = rfis.filter(r => r.has_cost_impact).length

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>RFIs</h1>
          <p className={`mt-1 ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>Requests for Information</p>
        </div>
        <button onClick={handleCreateNew} disabled={!selectedProjectId}
          className="px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center gap-2 disabled:opacity-50">
          <Plus className="w-5 h-5" /> New RFI
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

      {/* Stats */}
      {selectedProjectId && rfis.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white border border-slate-200'}`}>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{rfis.length}</p>
            <p className={`text-sm ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>Total RFIs</p>
          </div>
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50 border border-blue-200'}`}>
            <p className={`text-2xl font-bold text-blue-400`}>{openRFIs}</p>
            <p className={`text-sm ${darkMode ? 'text-blue-400/70' : 'text-blue-600'}`}>Open</p>
          </div>
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-amber-500/10' : 'bg-amber-50 border border-amber-200'}`}>
            <p className={`text-2xl font-bold text-amber-400`}>{respondedRFIs}</p>
            <p className={`text-sm ${darkMode ? 'text-amber-400/70' : 'text-amber-600'}`}>Responded</p>
          </div>
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-red-500/10' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-2xl font-bold text-red-400`}>{withCostImpact}</p>
            <p className={`text-sm ${darkMode ? 'text-red-400/70' : 'text-red-600'}`}>Cost Impact</p>
          </div>
        </div>
      )}

      {/* RFIs List */}
      {!selectedProjectId ? (
        <div className={`text-center py-12 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <Building2 className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-white/30' : 'text-slate-300'}`} />
          <p className={darkMode ? 'text-white/40' : 'text-slate-400'}>Select a project to view RFIs</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-400"><AlertCircle className="w-5 h-5 mr-2" />{error}</div>
      ) : rfis.length === 0 ? (
        <div className={`text-center py-12 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <FileQuestion className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-white/30' : 'text-slate-300'}`} />
          <p className={darkMode ? 'text-white/40' : 'text-slate-400'}>No RFIs yet</p>
          <button onClick={handleCreateNew} className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
            Create first RFI
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rfis.map((rfi) => (
            <div key={rfi.id}
              className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${darkMode ? 'bg-white/10 border-white/20 hover:bg-white/15' : 'bg-white border-slate-200 hover:shadow-slate-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`}>
                    <FileQuestion className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-mono ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{rfi.rfi_number}</span>
                      {getStatusBadge(rfi.status)}
                      {getPriorityBadge(rfi.priority)}
                    </div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{rfi.title}</h3>
                    <p className={`mt-2 text-sm ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>{rfi.question}</p>
                    
                    {/* Meta info */}
                    <div className={`flex items-center gap-4 mt-3 text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                      {rfi.drawing_number && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{rfi.drawing_number}</span>}
                      {rfi.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{rfi.location}</span>}
                      {rfi.date_required && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due: {new Date(rfi.date_required).toLocaleDateString()}</span>}
                    </div>

                    {/* Impact warnings */}
                    <div className="flex items-center gap-3 mt-3">
                      {rfi.has_cost_impact && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400">
                          <DollarSign className="w-3 h-3" />
                          ${rfi.estimated_cost_impact?.toLocaleString() || '0'} impact
                        </span>
                      )}
                      {rfi.has_schedule_impact && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400">
                          <Clock className="w-3 h-3" />
                          {rfi.estimated_schedule_impact || 0} days impact
                        </span>
                      )}
                    </div>

                    {/* Response */}
                    {rfi.response && (
                      <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                        <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Response:</p>
                        <p className={`text-sm ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>{rfi.response}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {rfi.status !== 'closed' && !rfi.response && (
                    <button onClick={() => handleOpenResponse(rfi)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex items-center gap-1">
                      <Send className="w-4 h-4" /> Respond
                    </button>
                  )}
                  <button onClick={() => handleEdit(rfi)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${darkMode ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 border-b sticky top-0 z-10 ${darkMode ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-white'}`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{editingRFI ? 'Edit RFI' : 'New RFI'}</h2>
              <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-slate-100 text-slate-400'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Title *</label>
                <input type="text" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Brief description of the question" className={inputStyles} required />
              </div>

              {/* Question */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Question *</label>
                <textarea value={formData.question} onChange={(e) => handleChange('question', e.target.value)} placeholder="Detailed question requiring clarification..." rows={4} className={`${inputStyles} resize-none`} required />
              </div>

              {/* Suggestion */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Suggested Answer</label>
                <textarea value={formData.suggestion} onChange={(e) => handleChange('suggestion', e.target.value)} placeholder="Your suggested solution..." rows={2} className={`${inputStyles} resize-none`} />
              </div>

              {/* Reference Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Drawing #</label>
                  <input type="text" value={formData.drawing_number} onChange={(e) => handleChange('drawing_number', e.target.value)} placeholder="A-101" className={inputStyles} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Spec Section</label>
                  <input type="text" value={formData.spec_section} onChange={(e) => handleChange('spec_section', e.target.value)} placeholder="03 30 00" className={inputStyles} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Location</label>
                  <input type="text" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="Floor 2, Grid B-4" className={inputStyles} />
                </div>
              </div>

              {/* Priority & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Priority</label>
                  <select value={formData.priority} onChange={(e) => handleChange('priority', e.target.value)} className={inputStyles}>
                    {RFI_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Date Required</label>
                  <input type="date" value={formData.date_required} onChange={(e) => handleChange('date_required', e.target.value)} className={inputStyles} />
                </div>
              </div>

              {/* Impact Section */}
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Impact Assessment
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input type="checkbox" checked={formData.has_cost_impact} onChange={(e) => handleChange('has_cost_impact', e.target.checked)} className="rounded" />
                      <span className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Has Cost Impact</span>
                    </label>
                    {formData.has_cost_impact && (
                      <div className="relative">
                        <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-white/30' : 'text-slate-400'}`} />
                        <input type="number" value={formData.estimated_cost_impact} onChange={(e) => handleChange('estimated_cost_impact', e.target.value)} placeholder="0.00" className={`${inputStyles} pl-9`} />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input type="checkbox" checked={formData.has_schedule_impact} onChange={(e) => handleChange('has_schedule_impact', e.target.checked)} className="rounded" />
                      <span className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Has Schedule Impact</span>
                    </label>
                    {formData.has_schedule_impact && (
                      <div className="relative">
                        <input type="number" value={formData.estimated_schedule_impact} onChange={(e) => handleChange('estimated_schedule_impact', e.target.value)} placeholder="Days" className={inputStyles} />
                      </div>
                    )}
                  </div>
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
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />{editingRFI ? 'Save' : 'Create'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {isResponseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && setIsResponseModal(false)}>
          <div className={`w-full max-w-xl rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Respond to RFI</h2>
              <button onClick={() => setIsResponseModal(false)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-slate-100 text-slate-400'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResponse} className="p-6 space-y-4">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                <p className={`text-sm font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Question:</p>
                <p className={`mt-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{editingRFI?.question}</p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Response *</label>
                <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Enter your response..." rows={4} className={`${inputStyles} resize-none`} required />
              </div>

              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                <button type="button" onClick={() => setIsResponseModal(false)} className={`px-4 py-2 rounded-lg font-medium ${darkMode ? 'text-white/60 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'}`}>Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 flex items-center gap-2 disabled:opacity-50">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send Response</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
