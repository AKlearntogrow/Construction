import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { 
  getAllProjects, 
  createProject, 
  updateProject,
  deleteProject,
  getProjectStats
} from '../services/projectService'
import { validateProject, formatCurrency } from '../utils/validation'
import { 
  Plus, 
  Loader2, 
  Building2, 
  AlertCircle, 
  Trash2, 
  Edit3,
  X,
  Save,
  DollarSign,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp
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
    client_name: '',
    original_budget: '',
    start_date: '',
    end_date: '',
    status: 'active',
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
      const data = await getAllProjects({ includeStats: true })
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
      client_name: '',
      original_budget: '',
      start_date: '',
      end_date: '',
      status: 'active',
      notes: '',
    })
    setFormErrors([])
    setIsModalOpen(true)
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setFormData({
      name: project.name || '',
      client_name: project.client_name || '',
      original_budget: project.original_budget || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      status: project.status || 'active',
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

    // Validate
    const validation = validateProject(formData)
    if (!validation.valid) {
      setFormErrors(validation.errors)
      return
    }

    setSaving(true)
    try {
      if (editingProject) {
        await updateProject(editingProject.id, validation.value)
      } else {
        await createProject(validation.value)
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
    const config = {
      active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      completed: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
      'on-hold': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
      cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    }
    const { bg, text, border } = config[status] || config.active

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${bg} ${text} ${border}`}>
        {status?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                  {project.client_name && (
                    <p className={`text-sm ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>
                      {project.client_name}
                    </p>
                  )}
                </div>
                <StatusBadge status={project.status} />
              </div>

              {/* Budget */}
              <div className={`p-3 rounded-xl mb-4 ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Budget</span>
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {formatCurrency(project.original_budget)}
                  </span>
                </div>
              </div>

              {/* Stats */}
              {project.stats && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className={`text-center p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      {project.stats.ticketCount}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Tickets</p>
                  </div>
                  <div className={`text-center p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      {project.stats.coCount}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>COs</p>
                  </div>
                  <div className={`text-center p-2 rounded-lg ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                    <p className="text-lg font-bold text-emerald-500">
                      {project.stats.coApproved}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Approved</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>
                  {project.start_date && `Started ${new Date(project.start_date).toLocaleDateString()}`}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(project); }}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode ? 'text-white/60 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {project.stats?.ticketCount === 0 && project.stats?.coCount === 0 && (
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      disabled={deletingId === project.id}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode ? 'text-red-400 hover:bg-red-500/20' : 'text-red-500 hover:bg-red-50'
                      } disabled:opacity-50`}
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl ${
            darkMode ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              darkMode ? 'border-white/10' : 'border-slate-200'
            }`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Project Name */}
              <div>
                <label className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  PROJECT NAME *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={inputStyles}
                  placeholder="e.g., Lincoln Elementary Renovation"
                  required
                />
              </div>

              {/* Client Name */}
              <div>
                <label className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  CLIENT NAME
                </label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => handleChange('client_name', e.target.value)}
                  className={inputStyles}
                  placeholder="e.g., ABC School District"
                />
              </div>

              {/* Budget */}
              <div>
                <label className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  ORIGINAL BUDGET ($)
                </label>
                <div className="relative">
                  <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    darkMode ? 'text-white/30' : 'text-slate-400'
                  }`} />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.original_budget}
                    onChange={(e) => handleChange('original_budget', e.target.value)}
                    className={`${inputStyles} pl-9`}
                    placeholder="500000.00"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                    START DATE
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    className={inputStyles}
                  />
                </div>
                <div>
                  <label className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                    END DATE
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    className={inputStyles}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  STATUS
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className={inputStyles}
                >
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  NOTES
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={2}
                  className={inputStyles}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Errors */}
              {formErrors.length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {formErrors.map((err, idx) => (
                    <p key={idx} className="text-red-400 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
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
