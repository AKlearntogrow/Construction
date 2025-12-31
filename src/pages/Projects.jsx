import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { 
  getAllProjects, 
  createProject, 
  updateProject,
  deleteProject,
  PROJECT_TYPES,
  PROJECT_STATUSES,
  getProjectStatusColor,
  getProjectStatusLabel
} from '../services/projectService'
import { formatCurrency } from '../utils/validation'
import { 
  Plus, 
  Loader2, 
  Building2, 
  AlertCircle, 
  Trash2, 
  X,
  Save,
  DollarSign,
  Calendar,
  MapPin,
  Percent
} from 'lucide-react'

export default function Projects() {
  const { darkMode } = useTheme()
  
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: 'commercial',
    address: '',
    city: '',
    state: '',
    budget: '',
    original_contract_value: '',
    planned_start_date: '',
    planned_end_date: '',
    status: 'planning',
    default_labor_rate: '',
    markup_percent: '10',
    notes: '',
  })
  const [formErrors, setFormErrors] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllProjects()
      setProjects(data)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingProject(null)
    setFormData({
      name: '',
      description: '',
      project_type: 'commercial',
      address: '',
      city: '',
      state: '',
      budget: '',
      original_contract_value: '',
      planned_start_date: '',
      planned_end_date: '',
      status: 'planning',
      default_labor_rate: '',
      markup_percent: '10',
      notes: '',
    })
    setFormErrors([])
    setIsModalOpen(true)
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setFormData({
      name: project.name || '',
      description: project.description || '',
      project_type: project.project_type || 'commercial',
      address: project.address || '',
      city: project.city || '',
      state: project.state || '',
      budget: project.budget || '',
      original_contract_value: project.original_contract_value || '',
      planned_start_date: project.planned_start_date || '',
      planned_end_date: project.planned_end_date || '',
      status: project.status || 'planning',
      default_labor_rate: project.default_labor_rate || '',
      markup_percent: project.markup_percent || '10',
      notes: project.notes || '',
    })
    setFormErrors([])
    setIsModalOpen(true)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return
    
    try {
      setDeletingId(id)
      await deleteProject(id)
      await fetchProjects()
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormErrors([])

    if (!formData.name.trim()) {
      setFormErrors(['Project name is required'])
      return
    }

    const saveData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      project_type: formData.project_type,
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      state: formData.state.trim() || null,
      budget: formData.budget ? parseFloat(formData.budget) : 0,
      original_contract_value: formData.original_contract_value ? parseFloat(formData.original_contract_value) : 0,
      current_contract_value: formData.original_contract_value ? parseFloat(formData.original_contract_value) : 0,
      planned_start_date: formData.planned_start_date || null,
      planned_end_date: formData.planned_end_date || null,
      status: formData.status,
      default_labor_rate: formData.default_labor_rate ? parseFloat(formData.default_labor_rate) : null,
      markup_percent: formData.markup_percent ? parseFloat(formData.markup_percent) : 10,
      notes: formData.notes.trim() || null,
    }

    setSaving(true)
    try {
      if (editingProject) {
        await updateProject(editingProject.id, saveData)
      } else {
        await createProject(saveData)
      }
      setIsModalOpen(false)
      await fetchProjects()
    } catch (err) {
      setFormErrors([err.message])
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const StatusBadge = ({ status }) => {
    const color = getProjectStatusColor(status)
    const label = getProjectStatusLabel(status)
    
    const colorClasses = {
      slate: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      red: 'bg-red-500/20 text-red-400 border-red-500/30',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colorClasses[color] || colorClasses.slate}`}>
        {label}
      </span>
    )
  }

  const inputStyles = `w-full px-3 py-2 rounded-lg border transition-colors ${
    darkMode 
      ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500/50' 
      : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
  } outline-none`

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Projects
          </h1>
          <p className={`mt-1 ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} • Manage your construction projects
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-400">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div className={`text-center py-12 rounded-2xl border ${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
        }`}>
          <Building2 className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-white/30' : 'text-slate-300'}`} />
          <p className={darkMode ? 'text-white/40' : 'text-slate-400'}>No projects yet</p>
          <button
            onClick={handleCreateNew}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`rounded-2xl border p-6 transition-all hover:shadow-lg cursor-pointer ${
                darkMode 
                  ? 'bg-white/10 border-white/20 hover:bg-white/15' 
                  : 'bg-white border-slate-200 hover:shadow-slate-200'
              }`}
              onClick={() => handleEdit(project)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className={`text-xs font-mono ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {project.project_code}
                  </p>
                  <h3 className={`text-lg font-semibold mt-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {project.name}
                  </h3>
                  {project.city && project.state && (
                    <p className={`text-sm flex items-center gap-1 ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>
                      <MapPin className="w-3 h-3" />
                      {project.city}, {project.state}
                    </p>
                  )}
                </div>
                <StatusBadge status={project.status} />
              </div>

              {/* Project Type */}
              {project.project_type && (
                <p className={`text-xs mb-3 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  {PROJECT_TYPES.find(t => t.value === project.project_type)?.label || project.project_type}
                </p>
              )}

              {/* Budget / Contract Value */}
              <div className={`p-3 rounded-xl mb-4 ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Contract Value</span>
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {formatCurrency(project.original_contract_value || project.budget || 0)}
                  </span>
                </div>
                {project.percent_complete > 0 && (
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-2 rounded-full ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                      <div 
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${project.percent_complete}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                      {project.percent_complete}%
                    </span>
                  </div>
                )}
              </div>

              {/* Dates */}
              {(project.planned_start_date || project.planned_end_date) && (
                <div className={`flex items-center gap-4 text-sm ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {project.planned_start_date 
                      ? new Date(project.planned_start_date).toLocaleDateString() 
                      : 'TBD'}
                  </div>
                  <span>→</span>
                  <div>
                    {project.planned_end_date 
                      ? new Date(project.planned_end_date).toLocaleDateString() 
                      : 'TBD'}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className={`flex items-center justify-end mt-4 pt-4 border-t ${
                darkMode ? 'border-white/10' : 'border-slate-100'
              }`}>
                <button
                  onClick={(e) => handleDelete(e, project.id)}
                  disabled={deletingId === project.id}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'text-red-400 hover:bg-red-500/20' 
                      : 'text-red-500 hover:bg-red-50'
                  } disabled:opacity-50`}
                  title="Delete"
                >
                  {deletingId === project.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              darkMode ? 'border-white/10' : 'border-slate-200'
            }`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {editingProject ? 'Edit Project' : 'New Project'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-slate-100 text-slate-400'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Project Name */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Downtown Office Tower"
                  className={inputStyles}
                  required
                />
              </div>

              {/* Project Type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                    Project Type
                  </label>
                  <select
                    value={formData.project_type}
                    onChange={(e) => handleChange('project_type', e.target.value)}
                    className={inputStyles}
                  >
                    {PROJECT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className={inputStyles}
                  >
                    {PROJECT_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Project description..."
                  rows={2}
                  className={`${inputStyles} resize-none`}
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 sm:col-span-1">
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="123 Main St"
                    className={inputStyles}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="City"
                    className={inputStyles}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="CA"
                    className={inputStyles}
                  />
                </div>
              </div>

              {/* Financials */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                    Contract Value
                  </label>
                  <div className="relative">
                    <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      darkMode ? 'text-white/30' : 'text-slate-400'
                    }`} />
                    <input
                      type="number"
                      value={formData.original_contract_value}
                      onChange={(e) => handleChange('original_contract_value', e.target.value)}
                      placeholder="0.00"
                      className={`${inputStyles} pl-9`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                    Budget
                  </label>
                  <div className="relative">
                    <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      darkMode ? 'text-white/30' : 'text-slate-400'
                    }`} />
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => handleChange('budget', e.target.value)}
                      placeholder="0.00"
                      className={`${inputStyles} pl-9`}
                    />
                  </div>
                </div>
              </div>

              {/* Default Rates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                    Default Labor Rate ($/hr)
                  </label>
                  <input
                    type="number"
                    value={formData.default_labor_rate}
                    onChange={(e) => handleChange('default_labor_rate', e.target.value)}
                    placeholder="65.00"
                    step="0.01"
                    className={inputStyles}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                    Default Markup %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.markup_percent}
                      onChange={(e) => handleChange('markup_percent', e.target.value)}
                      placeholder="10"
                      className={`${inputStyles} pr-8`}
                    />
                    <Percent className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      darkMode ? 'text-white/30' : 'text-slate-400'
                    }`} />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.planned_start_date}
                    onChange={(e) => handleChange('planned_start_date', e.target.value)}
                    className={inputStyles}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.planned_end_date}
                    onChange={(e) => handleChange('planned_end_date', e.target.value)}
                    className={inputStyles}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                  className={`${inputStyles} resize-none`}
                />
              </div>

              {/* Errors */}
              {formErrors.length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {formErrors.map((err, i) => (
                    <p key={i} className="text-red-400 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${
                darkMode ? 'border-white/10' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    darkMode ? 'text-white/60 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-lg font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingProject ? 'Save Changes' : 'Create Project'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
