import { useState } from 'react'
import { Pen, CheckCircle, Clock, User } from 'lucide-react'
import SignaturePad from './SignaturePad'

export default function SignatureSection({ signatures = {}, onSign, editable = true, darkMode }) {
  const [signingRole, setSigningRole] = useState(null)

  const signatureRoles = [
    { key: 'foreman', label: 'Foreman', description: 'Field supervisor' },
    { key: 'gc_rep', label: 'GC Representative', description: 'General contractor' },
    { key: 'owner_rep', label: 'Owner Representative', description: 'Owner/client' }
  ]

  const handleSaveSignature = (signatureData) => {
    onSign(signingRole, signatureData)
    setSigningRole(null)
  }

  const formatDate = (isoString) => {
    if (!isoString) return ''
    return new Date(isoString).toLocaleString()
  }

  return (
    <div className="space-y-3">
      <h4 className={`text-sm font-medium flex items-center gap-2 ${
        darkMode ? 'text-white/60' : 'text-slate-600'
      }`}>
        <Pen className="w-4 h-4" />
        SIGNATURES
      </h4>

      {/* Signature pad modal */}
      {signingRole && (
        <SignaturePad
          signerRole={signingRole}
          onSave={handleSaveSignature}
          onCancel={() => setSigningRole(null)}
          darkMode={darkMode}
        />
      )}

      {/* Signature slots */}
      {!signingRole && (
        <div className="grid gap-3">
          {signatureRoles.map(({ key, label, description }) => {
            const sig = signatures[key]
            const isSigned = sig && sig.signature_data

            return (
              <div
                key={key}
                className={`p-3 rounded-lg border ${
                  darkMode
                    ? isSigned ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'
                    : isSigned ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isSigned ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Clock className={`w-4 h-4 ${darkMode ? 'text-white/40' : 'text-slate-400'}`} />
                      )}
                      <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {label}
                      </span>
                    </div>
                    
                    {isSigned ? (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <User className={`w-3 h-3 ${darkMode ? 'text-white/40' : 'text-slate-400'}`} />
                          <span className={`text-sm ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>
                            {sig.name}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                          Signed: {formatDate(sig.signed_at)}
                        </p>
                        {/* Signature preview */}
                        <div className={`mt-2 p-2 rounded border ${
                          darkMode ? 'bg-slate-700 border-white/10' : 'bg-white border-slate-200'
                        }`}>
                          <img 
                            src={sig.signature_data} 
                            alt={`${sig.name}'s signature`}
                            className="h-12 object-contain"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className={`text-xs mt-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                        {description} - Not signed
                      </p>
                    )}
                  </div>

                  {/* Sign button */}
                  {!isSigned && editable && (
                    <button
                      onClick={() => setSigningRole(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                        darkMode
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      <Pen className="w-3 h-3" />
                      Sign
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary */}
      {!signingRole && (
        <div className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
          {Object.keys(signatures).filter(k => signatures[k]?.signature_data).length} of {signatureRoles.length} signatures collected
        </div>
      )}
    </div>
  )
}
