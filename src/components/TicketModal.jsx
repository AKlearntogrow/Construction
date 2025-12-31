import { useState, useEffect } from 'react'
import { X, Save, Loader2, MapPin, FileText, Users, Package, Wrench, AlertCircle, ImageIcon } from 'lucide-react'
import { updateTicket } from '../services/ticketService'
import { getActiveProjects } from '../services/projectService'
import { getGlobalCostCodes } from '../services/costCodeService'
import { getTicketAttachments } from '../services/attachmentService'
import FileUpload from './FileUpload'
import AttachmentGallery from './AttachmentGallery'

export default function TicketModal({ ticket, isOpen, onClose, onSave, darkMode }) {
  const [formData, setFormData] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Dropdown data
  const [projects, setProjects] = useState([])
  const [costCodes, setCostCodes] = useState([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(true)
  
  // Attachments state
  const [attachments, setAttachments] = useState([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)

  // Load dropdown data on mount
  useEffect(() => {
    loadDropdownData()
  }, [])

  const loadDropdownData = async () => {
    setLoadingDropdowns(true)
    try {
      const [projectsData, costCodesData] = await Promise.all([
        getActiveProjects(),
        getGlobalCostCodes()
      ])
      setProjects(projectsData || [])
      setCostCodes(costCodesData || [])
    } catch (err) {
      console.error('Failed to load dropdown data:', err)
    } finally {
      setLoadingDropdowns(false)
    }
  }

  // Initialize form when ticket changes
  useEffect(() => {
    if (ticket) {
      setFormData({
        description: ticket.description || '',
        location: ticket.location || '',
        project_id: ticket.project_id || '',
        cost_code_id: ticket.cost_code_id || '',
        status: ticket.status || 'draft',
        compliance_notes: ticket.compliance_notes || '',
      })
      setHasChanges(false)
      setError(null)
      loadAttachments()
    }
  }, [ticket])

  const loadAttachments = async () => {
    if (!ticket?.id) return
    setLoadingAttachments(true)
    const { data } = await getTicketAttachments(ticket.id)
    setAttachments(data || [])
    setLoadingAttachments(false)
  }

  const handleUploadComplete = (newAttachments) => {
    setAttachments(prev => [...newAttachments, ...prev])
  }

  const handleDeleteAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId))
  }

  if (!isOpen || !ticket) return null

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // Build update object with only changed fields
      const updates = {
        description: formData.description,
        location: formData.location,
        status: formData.status,
        compliance_notes: formData.compliance_notes,
      }
      
      // Only include project_id if selected
      if (formData.project_id) {
        updates.project_id = formData.project_id
      }
      
      // Only include cost_code_id if selected
      if (formData.cost_code_id) {
        updates.cost_code_id = formData.cost_code_id
      }

      const updatedTicket = await updateTicket(ticket.id, updates)
      setHasChanges(false)
      onSave(updatedTicket)
      onClose()
    } catch (err) {
      console.error('Failed to save ticket:', err)
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Discard them?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const Field = ({ label, icon: Icon, children }) => (
    <div className="space-y-1">
      <label className={`text-xs font-medium flex items-center gap-1.5 ${
        darkMode ? 'text-white/40' : 'text-slate-400'
      }`}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </label>
      {children}
    </div>
  )

  const inputStyles = `w-full px-3 py-2 rounded-lg border transition-colors ${
    darkMode
      ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500/50 focus:bg-white/10'
      : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
  } outline-none`

  const selectStyles = `w-full px-3 py-2 rounded-lg border transition-colors appearance-none ${
    darkMode
      ? 'bg-slate-700 border-white/10 text-white focus:border-emerald-500/50'
      : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
  } outline-none`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${
        darkMode ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 flex items-center justify-between p-4 border-b ${
          darkMode ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Edit T&M Ticket
            </h2>
            <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
              Created {new Date(ticket.created_at).toLocaleString()}
            </p>
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

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Status */}
          <Field label="STATUS" icon={AlertCircle}>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className={selectStyles}
            >
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="billed">Billed</option>
              <option value="paid">Paid</option>
            </select>
          </Field>

          {/* Project Dropdown */}
          <Field label="PROJECT" icon={Package}>
            <select
              value={formData.project_id}
              onChange={(e) => handleChange('project_id', e.target.value)}
              className={selectStyles}
              disabled={loadingDropdowns}
            >
              <option value="">Select a project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.project_code} - {project.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Description */}
          <Field label="DESCRIPTION" icon={FileText}>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={inputStyles}
              placeholder="Describe the work performed..."
            />
          </Field>

          {/* Two columns */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="LOCATION" icon={MapPin}>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className={inputStyles}
                placeholder="Building, floor, room..."
              />
            </Field>

            {/* Cost Code Dropdown */}
            <Field label="COST CODE" icon={Wrench}>
              <select
                value={formData.cost_code_id}
                onChange={(e) => handleChange('cost_code_id', e.target.value)}
                className={selectStyles}
                disabled={loadingDropdowns}
              >
                <option value="">Select cost code...</option>
                {costCodes.map(cc => (
                  <option key={cc.id} value={cc.id}>
                    {cc.code} - {cc.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Labor Summary */}
          {ticket.labor && ticket.labor.length > 0 && (
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  LABOR (from AI extraction)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {ticket.labor.map((item, idx) => (
                  <div key={idx} className={`text-sm ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>
                    <span className="font-medium">{item.trade || item.workers}</span>
                    <span className="text-emerald-500 ml-2">{item.hours || item.hours_total}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materials Summary */}
          {ticket.materials && ticket.materials.length > 0 && (
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-amber-500" />
                <span className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  MATERIALS (from AI extraction)
                </span>
              </div>
              <div className="space-y-1">
                {ticket.materials.map((item, idx) => (
                  <div key={idx} className={`flex justify-between text-sm ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>
                    <span>{item.item}</span>
                    <span className="text-emerald-500">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Labor</p>
                <p className="text-lg font-bold text-emerald-500">
                  ${parseFloat(ticket.labor_total || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Materials</p>
                <p className="text-lg font-bold text-emerald-500">
                  ${parseFloat(ticket.materials_total || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Total</p>
                <p className="text-xl font-bold text-emerald-500">
                  ${parseFloat(ticket.total_amount || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4 text-blue-500" />
              <span className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                PHOTOS & VIDEOS
              </span>
              {loadingAttachments && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
            </div>
            
            {attachments.length > 0 && (
              <div className="mb-4">
                <AttachmentGallery
                  attachments={attachments}
                  onDelete={handleDeleteAttachment}
                  editable={true}
                />
              </div>
            )}
            
            <FileUpload
              ticketId={ticket.id}
              onUploadComplete={handleUploadComplete}
              disabled={false}
            />
          </div>

          {/* Compliance Notes */}
          <Field label="COMPLIANCE NOTES" icon={AlertCircle}>
            <textarea
              value={formData.compliance_notes}
              onChange={(e) => handleChange('compliance_notes', e.target.value)}
              rows={2}
              className={inputStyles}
              placeholder="Any compliance or contract notes..."
            />
          </Field>

          {/* Original Transcript */}
          {ticket.original_transcript && (
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
              <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                ORIGINAL TRANSCRIPT
              </p>
              <p className={`text-sm italic ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                "{ticket.original_transcript}"
              </p>
            </div>
          )}

          {/* Error message */}
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
              darkMode
                ? 'text-white/60 hover:bg-white/10'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
              hasChanges
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600'
                : darkMode
                  ? 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
