import { useState, useEffect } from 'react'
import { 
  Mic, 
  MicOff, 
  FileText, 
  Clock, 
  MapPin, 
  Loader2, 
  Users, 
  Package, 
  Wrench,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  DollarSign,
  Building2,
  FolderPlus
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { createTicket } from '../services/ticketService'
import { getActiveProjects } from '../services/projectService'
import { getAllChangeOrders, createChangeOrder, addTicketsToChangeOrder } from '../services/changeOrderService'
import { sanitizeCurrency, formatCurrency } from '../utils/validation'
import { CONSTRUCTION_TRADES, matchTrade, getTradeLabel } from '../data/trades'

export default function Capture() {
  const { darkMode } = useTheme()
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState(null)
  const [error, setError] = useState(null)
  
  // Save state
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Projects & Change Orders
  const [projects, setProjects] = useState([])
  const [changeOrders, setChangeOrders] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [coOption, setCoOption] = useState('none') // 'none' | 'existing' | 'new'
  const [selectedCoId, setSelectedCoId] = useState('')
  const [newCoTitle, setNewCoTitle] = useState('')
  
  // Editable labor & materials
  const [laborEntries, setLaborEntries] = useState([])
  const [materialEntries, setMaterialEntries] = useState([])

  // Load projects and change orders on mount
  useEffect(() => {
    loadProjects()
  }, [])

  // Load change orders when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      loadChangeOrders()
    } else {
      setChangeOrders([])
    }
  }, [selectedProjectId])

  const loadProjects = async () => {
    try {
      const data = await getActiveProjects()
      setProjects(data)
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }

  const loadChangeOrders = async () => {
    try {
      const data = await getAllChangeOrders()
      // Filter to only show draft COs for the selected project
      const filtered = data.filter(co => 
        co.project_id === selectedProjectId && co.status === 'draft'
      )
      setChangeOrders(filtered)
    } catch (err) {
      console.error('Failed to load change orders:', err)
    }
  }

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser. Try Chrome!')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let finalTranscript = ''
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript
      }
      setTranscript(finalTranscript)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.start()
    setIsRecording(true)
    setExtractedData(null)
    setError(null)
    setLaborEntries([])
    setMaterialEntries([])
    window.currentRecognition = recognition
  }

  const stopRecording = () => {
    if (window.currentRecognition) {
      window.currentRecognition.stop()
    }
    setIsRecording(false)
  }

  const clearAll = () => {
    setTranscript('')
    setExtractedData(null)
    setError(null)
    setSaveError(null)
    setSaveSuccess(false)
    setLaborEntries([])
    setMaterialEntries([])
    setCoOption('none')
    setSelectedCoId('')
    setNewCoTitle('')
  }

  const processWithAI = async () => {
    if (!transcript) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      })

      if (!response.ok) {
        throw new Error('Failed to process transcript')
      }

      const data = await response.json()
      setExtractedData(data)
      
      // Initialize editable labor entries from AI extraction
      if (data.labor && Array.isArray(data.labor)) {
        setLaborEntries(data.labor.map(l => ({
          trade: matchTrade(l.trade || l.role),
          workers: l.workers || 1,
          hours: l.hours || l.hours_total || 0,
          rate: l.rate || 0,
        })))
      } else if (data.labor && typeof data.labor === 'object') {
        // Single labor object
        setLaborEntries([{
          trade: matchTrade(data.labor.trade || data.labor.role),
          workers: data.labor.workers || 1,
          hours: data.labor.hours || data.labor.hours_total || 0,
          rate: data.labor.rate || 0,
        }])
      } else {
        setLaborEntries([])
      }
      
      // Initialize editable material entries from AI extraction
      if (data.materials && Array.isArray(data.materials)) {
        setMaterialEntries(data.materials.map(m => ({
          item: m.item || '',
          quantity: m.quantity || 0,
          unit: m.unit || 'each',
          unit_cost: m.unit_cost || 0,
        })))
      } else {
        setMaterialEntries([])
      }
      
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to process. Make sure you have set up the API key.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Labor entry handlers
  const addLaborEntry = () => {
    setLaborEntries([...laborEntries, { trade: 'laborer', workers: 1, hours: 0, rate: 0 }])
  }

  const updateLaborEntry = (index, field, value) => {
    const updated = [...laborEntries]
    updated[index][field] = value
    setLaborEntries(updated)
  }

  const removeLaborEntry = (index) => {
    setLaborEntries(laborEntries.filter((_, i) => i !== index))
  }

  // Material entry handlers
  const addMaterialEntry = () => {
    setMaterialEntries([...materialEntries, { item: '', quantity: 0, unit: 'each', unit_cost: 0 }])
  }

  const updateMaterialEntry = (index, field, value) => {
    const updated = [...materialEntries]
    updated[index][field] = value
    setMaterialEntries(updated)
  }

  const removeMaterialEntry = (index) => {
    setMaterialEntries(materialEntries.filter((_, i) => i !== index))
  }

  // Calculate totals
  const laborTotal = laborEntries.reduce((sum, entry) => {
    const workers = parseFloat(entry.workers) || 0
    const hours = parseFloat(entry.hours) || 0
    const rate = parseFloat(entry.rate) || 0
    return sum + (workers * hours * rate)
  }, 0)

  const materialsTotal = materialEntries.reduce((sum, entry) => {
    const quantity = parseFloat(entry.quantity) || 0
    const unitCost = parseFloat(entry.unit_cost) || 0
    return sum + (quantity * unitCost)
  }, 0)

  const grandTotal = laborTotal + materialsTotal

  const handleSaveTicket = async () => {
    // Validation
    if (!selectedProjectId) {
      setSaveError('Please select a project')
      return
    }

    if (laborEntries.length === 0 && materialEntries.length === 0) {
      setSaveError('Please add at least one labor entry or material')
      return
    }

    if (grandTotal === 0) {
      setSaveError('Total amount cannot be zero. Please add rates/costs.')
      return
    }

    if (coOption === 'new' && !newCoTitle.trim()) {
      setSaveError('Please enter a title for the new Change Order')
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // Prepare labor data with calculated totals
      const validatedLabor = laborEntries.map(entry => ({
        trade: getTradeLabel(entry.trade),
        workers: parseFloat(entry.workers) || 0,
        hours: parseFloat(entry.hours) || 0,
        rate: sanitizeCurrency(entry.rate),
        total: (parseFloat(entry.workers) || 0) * (parseFloat(entry.hours) || 0) * sanitizeCurrency(entry.rate)
      }))

      // Prepare materials data with calculated totals
      const validatedMaterials = materialEntries.map(entry => ({
        item: entry.item || 'Item',
        quantity: parseFloat(entry.quantity) || 0,
        unit: entry.unit || 'each',
        unit_cost: sanitizeCurrency(entry.unit_cost),
        total: (parseFloat(entry.quantity) || 0) * sanitizeCurrency(entry.unit_cost)
      }))

      // Build ticket data
      const ticketData = {
        project_id: selectedProjectId,
        description: extractedData?.description || '',
        location: extractedData?.location || '',
        cost_code: extractedData?.cost_code_suggestion || '',
        labor: validatedLabor,
        materials: validatedMaterials,
        labor_total: laborTotal,
        materials_total: materialsTotal,
        total_amount: grandTotal,
        original_transcript: transcript,
        compliance_notes: extractedData?.compliance || '',
        status: 'pending',
      }

      // Create the ticket
      const savedTicket = await createTicket(ticketData)
      console.log('Ticket saved:', savedTicket)

      // Handle Change Order assignment
      if (coOption === 'existing' && selectedCoId) {
        await addTicketsToChangeOrder(selectedCoId, [savedTicket.id])
      } else if (coOption === 'new' && newCoTitle.trim()) {
        const newCO = await createChangeOrder({
          title: newCoTitle.trim(),
          project_id: selectedProjectId,
        })
        await addTicketsToChangeOrder(newCO.id, [savedTicket.id])
      }

      setSaveSuccess(true)
      
      // Reset form after 2 seconds
      setTimeout(() => {
        clearAll()
        setTranscript('')
      }, 2000)

    } catch (err) {
      console.error('Failed to save ticket:', err)
      setSaveError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const inputStyles = `w-full px-3 py-2 rounded-lg border transition-colors ${
    darkMode 
      ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500/50' 
      : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
  } outline-none`

  const smallInputStyles = `px-2 py-1.5 rounded-lg border text-sm transition-colors ${
    darkMode 
      ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500/50' 
      : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
  } outline-none`

  const selectStyles = `px-2 py-1.5 rounded-lg border text-sm transition-colors ${
    darkMode 
      ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500/50' 
      : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
  } outline-none`

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          Capture T&M Ticket
        </h1>
        <p className={`mt-1 ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>
          Record work, add costs, and save to a project
        </p>
      </div>

      {/* Project Selection - Required first step */}
      <div className={`rounded-2xl border p-6 mb-6 ${
        darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-emerald-500" />
          <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Select Project *
          </h2>
        </div>
        
        {projects.length === 0 ? (
          <div className={`text-center py-4 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
            <p>No active projects. Create a project first.</p>
          </div>
        ) : (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={inputStyles}
          >
            <option value="">Choose a project...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.project_code} - {project.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Main capture area - only show if project selected */}
      {selectedProjectId && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Voice Recording */}
          <div className={`backdrop-blur-xl rounded-2xl border p-6 ${
            darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'
          }`}>
            
            <div className="flex flex-col items-center mb-6">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-gradient-to-br from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600'
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>
              <p className={`mt-3 text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                {isRecording ? 'Tap to stop' : 'Tap to record'}
              </p>
              {isRecording && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-500 text-sm font-medium">Recording...</span>
                </div>
              )}
            </div>

            <div className={`rounded-xl p-4 min-h-[120px] ${
              darkMode ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <FileText className={`w-4 h-4 ${darkMode ? 'text-white/40' : 'text-slate-400'}`} />
                <span className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>TRANSCRIPT</span>
              </div>
              {transcript ? (
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  {transcript}
                </p>
              ) : (
                <p className={`text-sm italic ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>
                  Your speech will appear here...
                </p>
              )}
            </div>

            {transcript && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={clearAll}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode 
                      ? 'bg-white/10 text-white hover:bg-white/20' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Clear
                </button>
                <button
                  onClick={processWithAI}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Extract with AI →'
                  )}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right: Extracted Data & Costs */}
          <div className={`backdrop-blur-xl rounded-2xl border p-6 ${
            darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'
          }`}>
            <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              T&M Ticket Details
            </h3>

            {extractedData ? (
              <div className="space-y-4">
                {/* Description & Location */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>DESCRIPTION</p>
                  <p className={`text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {extractedData.description || 'N/A'}
                  </p>
                  {extractedData.location && (
                    <div className="mt-2 flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-violet-500" />
                      <span className={`text-xs ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                        {extractedData.location}
                      </span>
                    </div>
                  )}
                </div>

                {/* Labor Entries */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>LABOR</span>
                    </div>
                    <button
                      onClick={addLaborEntry}
                      className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  
                  {laborEntries.length === 0 ? (
                    <p className={`text-sm italic ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>
                      No labor entries. Click Add to create one.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {laborEntries.map((entry, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-white'}`}>
                          <div className="flex items-center justify-between mb-2">
                            {/* Trade Dropdown */}
                            <select
                              value={entry.trade}
                              onChange={(e) => updateLaborEntry(idx, 'trade', e.target.value)}
                              className={`${selectStyles} flex-1 mr-2`}
                            >
                              {CONSTRUCTION_TRADES.map(trade => (
                                <option key={trade.value} value={trade.value}>
                                  {trade.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => removeLaborEntry(idx)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <label className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>Workers</label>
                              <input
                                type="number"
                                min="1"
                                value={entry.workers}
                                onChange={(e) => updateLaborEntry(idx, 'workers', e.target.value)}
                                className={smallInputStyles + ' w-full'}
                              />
                            </div>
                            <div>
                              <label className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>Hours</label>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={entry.hours}
                                onChange={(e) => updateLaborEntry(idx, 'hours', e.target.value)}
                                className={smallInputStyles + ' w-full'}
                              />
                            </div>
                            <div>
                              <label className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>$/Hour</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={entry.rate}
                                onChange={(e) => updateLaborEntry(idx, 'rate', e.target.value)}
                                className={smallInputStyles + ' w-full'}
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>Total</label>
                              <div className={`text-sm font-medium py-1.5 text-emerald-500`}>
                                {formatCurrency((entry.workers || 0) * (entry.hours || 0) * (entry.rate || 0))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="text-right">
                        <span className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Labor Total: </span>
                        <span className="text-lg font-bold text-emerald-500">{formatCurrency(laborTotal)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Material Entries */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-500" />
                      <span className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>MATERIALS</span>
                    </div>
                    <button
                      onClick={addMaterialEntry}
                      className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  
                  {materialEntries.length === 0 ? (
                    <p className={`text-sm italic ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>
                      No materials. Click Add to create one.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {materialEntries.map((entry, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-white'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <input
                              type="text"
                              value={entry.item}
                              onChange={(e) => updateMaterialEntry(idx, 'item', e.target.value)}
                              placeholder="Item name"
                              className={`${smallInputStyles} flex-1 mr-2`}
                            />
                            <button
                              onClick={() => removeMaterialEntry(idx)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <label className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>Qty</label>
                              <input
                                type="number"
                                min="0"
                                value={entry.quantity}
                                onChange={(e) => updateMaterialEntry(idx, 'quantity', e.target.value)}
                                className={smallInputStyles + ' w-full'}
                              />
                            </div>
                            <div>
                              <label className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>Unit</label>
                              <input
                                type="text"
                                value={entry.unit}
                                onChange={(e) => updateMaterialEntry(idx, 'unit', e.target.value)}
                                className={smallInputStyles + ' w-full'}
                                placeholder="each"
                              />
                            </div>
                            <div>
                              <label className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>$/Unit</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={entry.unit_cost}
                                onChange={(e) => updateMaterialEntry(idx, 'unit_cost', e.target.value)}
                                className={smallInputStyles + ' w-full'}
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className={`text-xs ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>Total</label>
                              <div className={`text-sm font-medium py-1.5 text-emerald-500`}>
                                {formatCurrency((entry.quantity || 0) * (entry.unit_cost || 0))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="text-right">
                        <span className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>Materials Total: </span>
                        <span className="text-lg font-bold text-emerald-500">{formatCurrency(materialsTotal)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>Grand Total</span>
                    <span className="text-2xl font-bold text-emerald-500">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                {/* Change Order Assignment */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <FolderPlus className="w-4 h-4 text-violet-500" />
                    <span className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                      CHANGE ORDER (Optional)
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="coOption"
                        value="none"
                        checked={coOption === 'none'}
                        onChange={(e) => setCoOption(e.target.value)}
                        className="text-emerald-500"
                      />
                      <span className={`text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        Save without Change Order
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="coOption"
                        value="existing"
                        checked={coOption === 'existing'}
                        onChange={(e) => setCoOption(e.target.value)}
                        className="text-emerald-500"
                      />
                      <span className={`text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        Add to existing Change Order
                      </span>
                    </label>
                    
                    {coOption === 'existing' && (
                      <select
                        value={selectedCoId}
                        onChange={(e) => setSelectedCoId(e.target.value)}
                        className={`${inputStyles} ml-6`}
                      >
                        <option value="">Select a Change Order...</option>
                        {changeOrders.map(co => (
                          <option key={co.id} value={co.id}>
                            {co.co_number} - {co.title}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="coOption"
                        value="new"
                        checked={coOption === 'new'}
                        onChange={(e) => setCoOption(e.target.value)}
                        className="text-emerald-500"
                      />
                      <span className={`text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        Create new Change Order
                      </span>
                    </label>
                    
                    {coOption === 'new' && (
                      <input
                        type="text"
                        value={newCoTitle}
                        onChange={(e) => setNewCoTitle(e.target.value)}
                        placeholder="Change Order title..."
                        className={`${inputStyles} ml-6`}
                      />
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveTicket}
                  disabled={isSaving || saveSuccess}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    saveSuccess
                      ? 'bg-green-500 text-white'
                      : isSaving
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  }`}
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Ticket Saved!
                    </>
                  ) : isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5" />
                      Save T&M Ticket ({formatCurrency(grandTotal)})
                    </>
                  )}
                </button>

                {saveError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {saveError}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className={`h-64 flex flex-col items-center justify-center ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>
                <Wrench className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Record and process to see extracted data</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className={`mt-6 rounded-2xl border p-6 ${
        darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Tips for best results</h3>
        <div className={`grid md:grid-cols-3 gap-4 text-sm ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
            <span>Include time & rate: "Two plumbers at $60 per hour for 8 hours..."</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
            <span>Mention location: "...in Building A, Room 201..."</span>
          </div>
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
            <span>List materials with costs: "...used 20 outlets at $12 each..."</span>
          </div>
        </div>
      </div>
    </main>
  )
}
