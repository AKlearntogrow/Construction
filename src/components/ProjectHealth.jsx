import { Building2 } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import HealthBar from './HealthBar'

export default function ProjectHealth({ projects }) {
  const { darkMode } = useTheme()

  return (
    <div className={`backdrop-blur-xl rounded-2xl border overflow-hidden ${
      darkMode ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'
    }`}>
      <div className={`px-6 py-4 border-b flex items-center justify-between ${
        darkMode ? 'border-white/10' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Building2 className={`w-5 h-5 ${darkMode ? 'text-white/60' : 'text-slate-500'}`} />
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Project Health</h3>
        </div>
      </div>
      <div className={`divide-y ${darkMode ? 'divide-white/10' : 'divide-slate-100'}`}>
        {projects.map((project, idx) => (
          <div key={idx} className={`px-6 py-4 transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>{project.name}</p>
              <div className={darkMode ? 'text-white' : 'text-slate-800'}>
                <HealthBar score={project.health} />
              </div>
            </div>
            <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>{project.gc}</p>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>{project.phase}</span>
              <span className="text-xs text-amber-500 font-medium">${(project.pending / 1000).toFixed(0)}K pending</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}