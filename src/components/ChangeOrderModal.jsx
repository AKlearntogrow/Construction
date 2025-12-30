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
  TrendingDown
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

export default function ChangeOrderModal({ changeOrder, isOpen, onClose, onSave, darkMode }) {
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    project_name: '',
    notes: '',
  })
  const [tickets, setTickets] = useState([])
  const [unassignedTickets, setUnassignedTickets] = useState([])
  const [showAddTickets, setShowAddTickets] = useState(false)
  const [selectedTicketIds, setSelectedTicketIds] = useState([])
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [actionLoading, setActionLoading] = useState(null) // 'submit' | 'approve' | 'reject'

  const isNew = !changeOrder
  const isEditable = isNew || changeOrder?.status === 'draft'

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (changeOrder) {
        loadChangeOrder()
      } else {
        // Reset for new CO
        setFormData({ title: '', project_name: '', notes: '' })
        setTickets([])
        setHasChanges(false)
        setError(null)
      }
      loadUnassignedTickets()
    }
  }, [isOpen, changeOrder])

  const loadChangeOrder = async () => {
    try {
      setLoading(true)
      const data = await getChangeOrderById(changeOrder.id)
      setFormData({
        title: data.title || '',
        project_name: data.project_name || '',
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

  if (!isOpen) return null

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required')
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

  // Calculate totals
  const currentTotal = tickets.reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0)
  const variance = changeOrder ? calculateVariance({ 
    ...changeOrder, 
    current_amount: currentTotal 
  }) : null

  const inputStyles = `w-full px-3 py-2 rounded-lg border transition-colors ${
    darkMode 
      ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500/50' 
      : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
  } outline-none`

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${
        darkMode ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${
          darkMode ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              {isNew ? 'New Change Order' : changeOrder.co_number}
            </h2>
            {!isNew && (
              <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                Status: {changeOrder.status?.toUpperCase()}
              </p>
            )}
          </div>
          <button 
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-slate-100 text-slate-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  TITLE *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  disabled={!isEditable}
                  className={inputStyles}
                  placeholder="e.g., Week 1 Electrical Extras"
                />
              </div>

              {/* Project */}
              <div>
                <label className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  PROJECT
                </label>
                <input
                  type="text"
                  value={formData.project_name}
                  onChange={(e) => handleChange('project_name', e.target.value)}
                  disabled={!isEditable}
                  className={inputStyles}
                  placeholder="Project name"
                />
              </div>

              {/* Notes */}
              <div>
                <label className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  NOTES
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  disabled={!isEditable}
                  rows={2}
                  className={inputStyles}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Linked Tickets Section (only for existing COs) */}
              {!isNew && (
                <div className={`rounded-xl border p-4 ${
                  darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      Linked Tickets ({tickets.length})
                    </h3>
                    {isEditable && (
                      <button
                        onClick={() => setShowAddTickets(!showAddTickets)}
                        className="px-3 py-1 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
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
                        Select unassigned tickets to add:
                      </p>
                      {unassignedTickets.length === 0 ? (
                        <p className={`text-sm italic ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                          No unassigned tickets available
                        </p>
                      ) : (
                        <>
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {unassignedTickets.map(ticket => (
                              <label 
                                key={ticket.id}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                  selectedTicketIds.includes(ticket.id)
                                    ? 'bg-emerald-500/20'
                                    : darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedTicketIds.includes(ticket.id)}
                                  onChange={() => toggleTicketSelection(ticket.id)}
                                  className="rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                    {ticket.description || 'No description'}
                                  </p>
                                  <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                                    {ticket.location || 'No location'}
                                  </p>
                                </div>
                                <span className="text-emerald-500 font-medium">
                                  ${parseFloat(ticket.total_amount || 0).toLocaleString()}
                                </span>
                              </label>
                            ))}
                          </div>
                          <button
                            onClick={handleAddTickets}
                            disabled={selectedTicketIds.length === 0 || saving}
                            className="mt-3 w-full py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                          >
                            {saving ? 'Adding...' : `Add ${selectedTicketIds.length} Ticket(s)`}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Tickets List */}
                  {tickets.length === 0 ? (
                    <p className={`text-sm italic ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                      No tickets linked yet. Add tickets to calculate the total.
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
                              {ticket.location || 'No location'} • {new Date(ticket.created_at).toLocaleDateString()}
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

              {/* Totals & Variance (only for existing COs) */}
              {!isNew && (
                <div className={`rounded-xl p-4 ${
                  darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'
                }`}>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Original</p>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        ${parseFloat(changeOrder.original_amount || 0).toLocaleString()}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>
                        {parseFloat(changeOrder.original_amount) > 0 ? 'Locked' : 'Set on submit'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Current</p>
                      <p className="text-lg font-bold text-emerald-500">
                        ${currentTotal.toLocaleString()}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>
                        {tickets.length} ticket(s)
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Variance</p>
                      {variance && parseFloat(changeOrder.original_amount) > 0 ? (
                        <>
                          <p className={`text-lg font-bold flex items-center justify-center gap-1 ${
                            variance.isOverBudget ? 'text-red-400' : 'text-emerald-400'
                          }`}>
                            {variance.isOverBudget ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {variance.isOverBudget ? '+' : ''}${Math.abs(variance.amount).toLocaleString()}
                          </p>
                          <p className={`text-xs ${variance.isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
                            {variance.isOverBudget ? '+' : ''}{variance.percent}%
                          </p>
                        </>
                      ) : (
                        <p className={`text-lg font-bold ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>—</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Approval Info (for submitted/approved/rejected) */}
              {!isNew && changeOrder.status !== 'draft' && (
                <div className={`rounded-xl p-4 ${
                  darkMode ? 'bg-white/5' : 'bg-slate-50'
                }`}>
                  <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                    Approval History
                  </h4>
                  <div className={`text-sm ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>
                    {changeOrder.submitted_at && (
                      <p>Submitted: {new Date(changeOrder.submitted_at).toLocaleString()}</p>
                    )}
                    {changeOrder.approved_at && (
                      <p>
                        {changeOrder.status === 'approved' ? 'Approved' : 'Rejected'} by {changeOrder.approved_by} on {new Date(changeOrder.approved_at).toLocaleString()}
                      </p>
                    )}
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
            <div className={`sticky bottom-0 flex items-center justify-between p-4 border-t ${
              darkMode ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'
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
                {/* Action buttons based on status */}
                {!isNew && changeOrder.status === 'draft' && tickets.length > 0 && (
                  <button
                    onClick={handleSubmit}
                    disabled={actionLoading === 'submit'}
                    className="px-4 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === 'submit' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Submit for Approval
                  </button>
                )}

                {!isNew && changeOrder.status === 'submitted' && (
                  <>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading === 'reject'}
                      className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading === 'reject' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading === 'approve'}
                      className="px-4 py-2 rounded-lg font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading === 'approve' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                  </>
                )}

                {/* Save button (for new or draft) */}
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
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {isNew ? 'Create' : 'Save Changes'}
                      </>
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
