import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import { searchCostCodes, getGlobalCostCodes } from '../services/costCodeService'
import { Search, X, Tag, ChevronDown } from 'lucide-react'

export default function CostCodeSelect({ value, onChange, projectId, placeholder = "Select cost code..." }) {
  const { darkMode } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [costCodes, setCostCodes] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCode, setSelectedCode] = useState(null)
  const dropdownRef = useRef(null)

  useEffect(() => { loadCostCodes() }, [projectId])

  useEffect(() => {
    if (value && costCodes.length > 0) {
      const found = costCodes.find(c => c.id === value)
      setSelectedCode(found || null)
    } else if (!value) { setSelectedCode(null) }
  }, [value, costCodes])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) { setIsOpen(false) }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadCostCodes = async () => {
    try {
      setLoading(true)
      const data = await getGlobalCostCodes()
      setCostCodes(data || [])
    } catch (err) { console.error('Failed to load cost codes:', err); setCostCodes([]) }
    finally { setLoading(false) }
  }

  const handleSearch = async (query) => {
    setSearch(query)
    if (query.length < 2) { loadCostCodes(); return }
    try {
      setLoading(true)
      const data = await searchCostCodes(query, projectId)
      setCostCodes(data || [])
    } catch (err) { console.error('Search failed:', err) }
    finally { setLoading(false) }
  }

  const handleSelect = (code) => { setSelectedCode(code); onChange(code.id); setIsOpen(false); setSearch('') }
  const handleClear = (e) => { e.stopPropagation(); setSelectedCode(null); onChange(null) }

  const groupedCodes = costCodes.reduce((acc, code) => {
    const division = code.code?.substring(0, 2) || '00'
    if (!acc[division]) { acc[division] = [] }
    acc[division].push(code)
    return acc
  }, {})

  const inputStyles = `w-full px-3 py-2 rounded-lg border transition-colors ${darkMode ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500/50' : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'} outline-none`

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className={`${inputStyles} cursor-pointer flex items-center justify-between`}>
        {selectedCode ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Tag className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className="font-mono text-sm">{selectedCode.code}</span>
            <span className={`truncate ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>{selectedCode.name}</span>
          </div>
        ) : (<span className={darkMode ? 'text-white/40' : 'text-slate-400'}>{placeholder}</span>)}
        <div className="flex items-center gap-1">
          {selectedCode && (<button onClick={handleClear} className={`p-1 rounded hover:bg-white/10 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}><X className="w-4 h-4" /></button>)}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-white/40' : 'text-slate-400'}`} />
        </div>
      </div>
      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 rounded-lg border shadow-lg max-h-80 overflow-hidden ${darkMode ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className={`p-2 border-b ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-white/30' : 'text-slate-400'}`} />
              <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search codes..." className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-white/5 text-white placeholder-white/30' : 'bg-slate-50 text-slate-800 placeholder-slate-400'} outline-none`} autoFocus />
            </div>
          </div>
          <div className="overflow-y-auto max-h-60">
            {loading ? (<div className={`p-4 text-center text-sm ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Loading...</div>
            ) : costCodes.length === 0 ? (<div className={`p-4 text-center text-sm ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>No cost codes found</div>
            ) : (Object.entries(groupedCodes).map(([division, codes]) => (
              <div key={division}>
                <div className={`px-3 py-1.5 text-xs font-medium sticky top-0 ${darkMode ? 'bg-slate-700 text-white/50' : 'bg-slate-100 text-slate-500'}`}>Division {division}</div>
                {codes.map((code) => (
                  <div key={code.id} onClick={() => handleSelect(code)} className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${darkMode ? 'hover:bg-white/10' : 'hover:bg-slate-50'} ${selectedCode?.id === code.id ? (darkMode ? 'bg-emerald-500/20' : 'bg-emerald-50') : ''}`}>
                    <span className={`font-mono text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{code.code}</span>
                    <span className={`text-sm truncate ${darkMode ? 'text-white/70' : 'text-slate-600'}`}>{code.name}</span>
                  </div>
                ))}
              </div>
            )))}
          </div>
        </div>
      )}
    </div>
  )
}
