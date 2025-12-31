import { useRef, useState, useEffect } from 'react'
import { Pen, Eraser, Check, X } from 'lucide-react'

export default function SignaturePad({ onSave, onCancel, signerRole, darkMode }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signerName, setSignerName] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Set canvas size
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)
    
    // Set drawing style
    ctx.strokeStyle = darkMode ? '#10b981' : '#047857'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    // Fill background
    ctx.fillStyle = darkMode ? '#1e293b' : '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [darkMode])

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    const { x, y } = getCoordinates(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    const { x, y } = getCoordinates(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = darkMode ? '#1e293b' : '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const saveSignature = () => {
    if (!signerName.trim()) {
      alert('Please enter your name')
      return
    }
    if (!hasSignature) {
      alert('Please sign before saving')
      return
    }

    const canvas = canvasRef.current
    const signatureData = canvas.toDataURL('image/png')
    
    onSave({
      name: signerName.trim(),
      signed_at: new Date().toISOString(),
      signature_data: signatureData
    })
  }

  const roleLabels = {
    foreman: 'Foreman',
    gc_rep: 'GC Representative',
    owner_rep: 'Owner Representative'
  }

  return (
    <div className={`rounded-xl p-4 border ${darkMode ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}>
      <h4 className={`font-medium mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
        <Pen className="w-4 h-4" />
        Sign as {roleLabels[signerRole] || signerRole}
      </h4>

      {/* Signer name input */}
      <div className="mb-3">
        <input
          type="text"
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          placeholder="Enter your full name"
          className={`w-full px-3 py-2 rounded-lg border text-sm ${
            darkMode
              ? 'bg-slate-700 border-white/10 text-white placeholder-white/40'
              : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
          }`}
        />
      </div>

      {/* Signature canvas */}
      <div className={`relative rounded-lg border-2 border-dashed ${
        darkMode ? 'border-white/20' : 'border-slate-300'
      }`}>
        <canvas
          ref={canvasRef}
          className="w-full h-32 rounded-lg cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
            darkMode ? 'text-white/20' : 'text-slate-300'
          }`}>
            <span className="text-sm">Sign here</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={clearSignature}
          className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${
            darkMode
              ? 'text-white/60 hover:bg-white/10'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Eraser className="w-4 h-4" />
          Clear
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              darkMode
                ? 'text-white/60 hover:bg-white/10'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={saveSignature}
            disabled={!hasSignature || !signerName.trim()}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Save Signature
          </button>
        </div>
      </div>
    </div>
  )
}
