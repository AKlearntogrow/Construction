import { useState } from 'react'
import { Mic, MicOff, FileText, Clock, MapPin, Loader2, Users, Package, Wrench, CheckCircle, AlertCircle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { createTicket } from '../services/ticketService';

export default function Capture() {
  const { darkMode } = useTheme()
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState(null)
  const [error, setError] = useState(null)
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to process. Make sure you have set up the API key.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveTicket = async () => {
    console.log('Save button clicked!');
    if (!extractedData) {
      setSaveError('No ticket data to save');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Transform extractedData to match database schema
      const ticketData = {
        description: extractedData.description || extractedData.summary || '',
        location: extractedData.location || '',
        cost_code: extractedData.cost_code_suggestion || extractedData.costCode || '',
        project_name: extractedData.project || 'Default Project',
        labor: extractedData.labor ? [extractedData.labor] : [],
        materials: extractedData.materials || [],
        original_transcript: transcript,
        compliance_notes: extractedData.compliance || extractedData.complianceNotes || '',
        status: 'pending',
      };

      const savedTicket = await createTicket(ticketData);
      
      setSaveSuccess(true);
      console.log('Ticket saved:', savedTicket);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setTranscript('');
        setExtractedData(null);
        setSaveSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Failed to save ticket:', error);
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Capture T&M Ticket</h1>
        <p className={`mt-1 ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>Speak to create a new time & materials ticket</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
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
                  'Process with AI →'
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

        <div className={`backdrop-blur-xl rounded-2xl border p-6 ${
          darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'
        }`}>
          <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Extracted T&M Ticket
          </h3>

          {extractedData ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>DESCRIPTION</p>
                <p className={`text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  {extractedData.description || 'N/A'}
                </p>
              </div>

              {extractedData.labor && (
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <p className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>LABOR</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {extractedData.labor.workers || '—'}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Workers</p>
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {extractedData.labor.hours_total || '—'}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Hours</p>
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        extractedData.labor.rate_type === 'overtime' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {extractedData.labor.rate_type || '—'}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Rate Type</p>
                    </div>
                  </div>
                </div>
              )}

              {extractedData.materials && extractedData.materials.length > 0 && (
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-amber-500" />
                    <p className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>MATERIALS</p>
                  </div>
                  <div className="space-y-2">
                    {extractedData.materials.map((material, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className={`text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {material.item}
                        </span>
                        <span className={`text-sm font-medium ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
                          {material.quantity} {material.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-violet-500" />
                    <p className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>LOCATION</p>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {extractedData.location || 'N/A'}
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Wrench className="w-4 h-4 text-emerald-500" />
                    <p className={`text-xs font-medium ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>COST CODE</p>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {extractedData.cost_code_suggestion || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Save Button with loading/success states */}
              <button 
                onClick={handleSaveTicket}
                disabled={isSaving || saveSuccess}
                className={`w-full mt-4 px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  saveSuccess
                    ? 'bg-green-500 text-white'
                    : isSaving
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600'
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
                  'Save T&M Ticket'
                )}
              </button>

              {/* Error message */}
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

      <div className={`mt-6 rounded-2xl border p-6 ${
        darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Tips for best results</h3>
        <div className={`grid md:grid-cols-3 gap-4 text-sm ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
            <span>Include dates: "Yesterday we worked 6 hours..."</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
            <span>Mention locations: "...in section B..."</span>
          </div>
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
            <span>Be specific: "...200 feet of 2-inch EMT..."</span>
          </div>
        </div>
      </div>
    </main>
  )
}
