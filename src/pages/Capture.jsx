import { useState } from 'react'
import { Mic, MicOff, FileText, Clock, MapPin } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Capture() {
  const { darkMode } = useTheme()
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')

  const startRecording = () => {
    // Check if browser supports speech recognition
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

    // Store recognition instance to stop later
    window.currentRecognition = recognition
  }

  const stopRecording = () => {
    if (window.currentRecognition) {
      window.currentRecognition.stop()
    }
    setIsRecording(false)
  }

  const clearTranscript = () => {
    setTranscript('')
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Capture T&M Ticket</h1>
        <p className={`mt-1 ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>Speak to create a new time & materials ticket</p>
      </div>

      {/* Recording Card */}
      <div className={`backdrop-blur-xl rounded-2xl border p-8 mb-6 ${
        darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'
      }`}>
        
        {/* Record Button */}
        <div className="flex flex-col items-center mb-8">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-gradient-to-br from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600'
            }`}
          >
            {isRecording ? (
              <MicOff className="w-10 h-10 text-white" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </button>
          <p className={`mt-4 text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
            {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
          </p>
          {isRecording && (
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 text-sm font-medium">Recording...</span>
            </div>
          )}
        </div>

        {/* Transcript Area */}
        <div className={`rounded-xl p-4 min-h-[150px] ${
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

        {/* Action Buttons */}
        {transcript && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={clearTranscript}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Clear
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-colors"
            >
              Process with AI →
            </button>
          </div>
        )}
      </div>

      {/* Tips Card */}
      <div className={`rounded-2xl border p-6 ${
        darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Tips for best results</h3>
        <ul className={`space-y-2 text-sm ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>
          <li className="flex items-start gap-2">
            <Clock className="w-4 h-4 mt-0.5 text-emerald-500" />
            Include dates and times: "Yesterday we worked 6 hours..."
          </li>
          <li className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-emerald-500" />
            Mention locations: "...in section B of the basement..."
          </li>
          <li className="flex items-start gap-2">
            <FileText className="w-4 h-4 mt-0.5 text-emerald-500" />
            Be specific about materials: "...200 feet of 2-inch EMT conduit..."
          </li>
        </ul>
      </div>
    </main>
  )
}