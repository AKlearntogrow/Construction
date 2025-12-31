import { useState, useEffect } from 'react'
import {
  X,
  Save,
  Loader2,
  Plus,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Building2,
  Download
} from 'lucide-react'
import {
  createChangeOrder,
  updateChangeOrder,
  getChangeOrderById,
  submitChangeOrder,
  approveChangeOrder,
  rejectChangeOrder,
  addTicketsToChangeOrder,
  removeTicketFromChangeOrder,
  getUnassignedTickets,
  calculateVariance
} from '../services/changeOrderService'
import { exportChangeOrderPDF } from '../services/pdfService'

export default function ChangeOrderModal({
  changeOrder,
  isOpen,
  onClose,
  onSave,
  darkMode,
  projects = [],
  defaultProjectId = null
}) {
  const [formData, setFormData] = useState({
    title: '',
    project_id: '',
    notes: '',
  })
  const [tickets, setTickets] = useState([])
  const [unassignedTickets, setUnassignedTickets] = useState([])
  const [showAddTickets, setShowAddTickets] = useState(false)
  const [selectedTicketIds, setSelectedTicketIds] = useState([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [exportingPDF, setExportingPDF] = useState(false)

  const isNew = !changeOrder
  const isEditable = isNew || changeOrder?.status === 'draft'

  useEffect(() => {
    if (isOpen) {
      if (changeOrder) {
        loadChangeOrder()
      } else {
        setFormData({
          title: '',
          project_id: defaultProjectId || '',
          notes: ''
        })
        setTickets([])
        setHasChanges(false)
        setError(null)
      }
      loadUnassignedTickets()
    }
  }, [isOpen, changeOrder, defaultProjectId])

  const loadChangeOrder = async () => {
    try {
      setLoading(true)
      const data = await getChangeOrderById(changeOrder.id)
      setFormData({
        title: data.title || '',
        project_id: data.project_id || '',
        notes: data.notes || '',
      })
      setTickets(data.tickets || [])
      setHasChanges(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadUnassignedTickets = async () => {
    try {
      const data = await getUnassignedTickets()
      setUnassignedTickets(data)
    } catch (err) {
      console.error('Failed to load unassigned tickets:', err)
    }
  }

  const filteredUnassignedTickets = formData.project_id
    ? unassignedTickets.filter(t => t.project_id === formData.project_id)
    : unassignedTickets

  if (!isOpen) return null

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
    if (field === 'project_id') {
      setSelectedTicketIds([])
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }
    if (!formData.project_id) {
      setError('Project is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (isNew) {
        await createChangeOrder(formData)
      } else {
        await updateChangeOrder(changeOrder.id, formData)
      }
      setHasChanges(false)
      onSave()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!confirm('Submit this change order for approval? The original amount will be locked.')) return

    setActionLoading('submit')
    try {
      await submitChangeOrder(changeOrder.id)
      onSave()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = async () => {
    const approver = prompt('Enter approver name:')
    if (!approver) return

    setActionLoading('approve')
    try {
      await approveChangeOrder(changeOrder.id, approver)
      onSave()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    const rejector = prompt('Enter your name:')
    if (!rejector) return

    setActionLoading('reject')
    try {
      await rejectChangeOrder(changeOrder.id, rejector)
      onSave()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleExportPDF = async () => {
    setExportingPDF(true)
    try {
      const project = projects.find(p => p.id === changeOrder.project_id)
      await exportChangeOrderPDF(changeOrder, tickets, project)
    } catch (err) {
      console.error('Failed to export PDF:', err)
      alert('Failed to export PDF: ' + err.message)
    } finally {
      setExportingPDF(false)
    }
  }

  const handleAddTickets = async () => {
    if (selectedTicketIds.length === 0) return

    setSaving(true)
    try {
      const updated = await addTicketsToChangeOrder(changeOrder.id, selectedTicketIds)
      setTickets(updated.tickets)
      setSelectedTicketIds([])
      setShowAddTickets(false)
      loadUnassignedTickets()
      onSave()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveTicket = async (ticketId) => {
    if (!confirm('Remove this ticket from the change order?')) return

    try {
      const updated = await removeTicketFromChangeOrder(ticketId, changeOrder.id)
      setTickets(updated.tickets)
      loadUnassignedTickets()
      onSave()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleClose = () => {
    if (hasChanges && !confirm('Discard unsaved changes?')) return
    onClose()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose()
  }

  const toggleTicketSelection = (id) => {
    setSelectedTicketIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId)
    return project ? `${project.project_code} - ${project.name}` : 'Unknown Project'
  }

  const currentTotal = tickets.reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0)
  const variance = changeOrder ? calculateVariance({
    ...changeOrder,
    current_amount: currentTotal
  }) : null

  const inputStyles = `w-full px-3 py-2 rounded-lg border transition-colors ${
    darkMode
      ? 'bg-slate-700 border-white/10 text-white focus:border-emerald-500/50'
      : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
  } outline-none`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className={`w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          darkMode ? 'border-white/10' : 'border-slate-200'
        }`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {isNew ? 'New Change Order' : `${changeOrder.co_number}`}
          </h2>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-slate-100 text-slate-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Project Selection */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-white/60' : 'text-slate-600'
                }`}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Project *
                  </div>
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => handleChange('project_id', e.target.value)}
                  disabled={!isEditable || (!isNew && changeOrder?.project_id)}
                  className={`${inputStyles} ${!isEditable ? 'opacity-60' : ''}`}
                >
                  <option value="">Select a project...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.project_code} - {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-white/60' : 'text-slate-600'
                }`}>
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., Week 1 Electrical Work"
                  disabled={!isEditable}
                  className={`${inputStyles} ${!isEditable ? 'opacity-60' : ''}`}
                />
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-white/60' : 'text-slate-600'
                }`}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                  disabled={!isEditable}
                  className={`${inputStyles} resize-none ${!isEditable ? 'opacity-60' : ''}`}
                />
              </div>

              {/* Tickets Section */}
              {!isNew && (
                <div className={`rounded-xl p-4 ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-medium flex items-center gap-2 ${
                      darkMode ? 'text-white' : 'text-slate-800'
                    }`}>
                      <FileText className="w-4 h-4" />
                      Linked Tickets ({tickets.length})
                    </h4>
                    {isEditable && (
                      <button
                        onClick={() => setShowAddTickets(!showAddTickets)}
                        className="text-sm text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Tickets
                      </button>
                    )}
                  </div>

                  {/* Add Tickets Panel */}
                  {showAddTickets && (
                    <div className={`mb-4 p-3 rounded-lg border ${
                      darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
                    }`}>
                      <p className={`text-sm mb-2 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                        Select tickets to add:
                      </p>
                      {filteredUnassignedTickets.length === 0 ? (
                        <p className={`text-sm italic ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                          No unassigned tickets for this project
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {filteredUnassignedTickets.map(ticket => (
                            <label
                              key={ticket.id}
                              className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                                selectedTicketIds.includes(ticket.id)
                                  ? darkMode ? 'bg-emerald-500/20' : 'bg-emerald-50'
                                  : darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedTicketIds.includes(ticket.id)}
                                onChange={() => toggleTicketSelection(ticket.id)}
                                className="rounded border-slate-300"
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                  {ticket.description || 'No description'}
                                </p>
                              </div>
                              <span className="text-emerald-500 font-medium text-sm">
                                ${parseFloat(ticket.total_amount || 0).toLocaleString()}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                      {selectedTicketIds.length > 0 && (
                        <button
                          onClick={handleAddTickets}
                          disabled={saving}
                          className="w-full mt-2 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          Add Selected
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tickets List */}
                  {tickets.length === 0 ? (
                    <p className={`text-sm italic ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                      No tickets linked yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {tickets.map(ticket => (
                        <div
                          key={ticket.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            darkMode ? 'bg-white/5' : 'bg-white'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                              {ticket.description || 'No description'}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                              {ticket.location || 'No location'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-500 font-medium">
                              ${parseFloat(ticket.total_amount || 0).toLocaleString()}
                            </span>
                            {isEditable && (
                              <button
                                onClick={() => handleRemoveTicket(ticket.id)}
                                className={`p-1 rounded transition-colors ${
                                  darkMode ? 'text-red-400 hover:bg-red-500/20' : 'text-red-500 hover:bg-red-50'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Totals */}
              {!isNew && (
                <div className={`rounded-xl p-4 ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Original</p>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        ${parseFloat(changeOrder.original_amount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Current</p>
                      <p className="text-lg font-bold text-emerald-500">
                        ${currentTotal.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Variance</p>
                      {variance && parseFloat(changeOrder.original_amount) > 0 ? (
                        <p className={`text-lg font-bold flex items-center justify-center gap-1 ${
                          variance.isOverBudget ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {variance.isOverBudget ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {variance.isOverBudget ? '+' : ''}${Math.abs(variance.amount).toLocaleString()}
                        </p>
                      ) : (
                        <p className={`text-lg font-bold ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>—</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between p-4 border-t ${
              darkMode ? 'border-white/10' : 'border-slate-200'
            }`}>
              <button
                onClick={handleClose}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode ? 'text-white/60 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {isEditable ? 'Cancel' : 'Close'}
              </button>

              <div className="flex items-center gap-2">
                {/* Export PDF button */}
                {!isNew && tickets.length > 0 && (
                  <button
                    onClick={handleExportPDF}
                    disabled={exportingPDF}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      darkMode
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } disabled:opacity-50`}
                  >
                    {exportingPDF ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export PDF
                  </button>
                )}

                {/* Submit/Approve/Reject buttons */}
                {!isNew && changeOrder.status === 'draft' && tickets.length > 0 && (
                  <button
                    onClick={handleSubmit}
                    disabled={actionLoading === 'submit'}
                    className="px-4 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === 'submit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit
                  </button>
                )}

                {!isNew && changeOrder.status === 'submitted' && (
                  <>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading === 'reject'}
                      className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading === 'approve'}
                      className="px-4 py-2 rounded-lg font-medium bg-emerald-500 text-white hover:bg-emerald-600 flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Approve
                    </button>
                  </>
                )}

                {/* Save button */}
                {isEditable && (
                  <button
                    onClick={handleSave}
                    disabled={saving || (!isNew && !hasChanges)}
                    className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                      (isNew || hasChanges)
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600'
                        : darkMode
                          ? 'bg-white/10 text-white/30 cursor-not-allowed'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                    ) : (
                      <><Save className="w-4 h-4" />{isNew ? 'Create' : 'Save'}</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
