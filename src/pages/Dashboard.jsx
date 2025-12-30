import { useTheme } from '../context/ThemeContext'
import { waterfallData, changeOrders, projects, warnings, kpiData } from '../data/mockData'
import KPICard from '../components/KPICard'
import WarningAlerts from '../components/WarningAlerts'
import ChangeOrdersTable from '../components/ChangeOrdersTable'
import ProjectHealth from '../components/ProjectHealth'
import BudgetChart from '../components/BudgetChart'

export default function Dashboard() {
  const { darkMode } = useTheme()

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Dashboard</h1>
        <p className={`mt-1 ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>3 active projects • Real-time insights</p>
      </div>

      {/* Early Warning Alerts */}
      <WarningAlerts warnings={warnings} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiData.map((kpi, idx) => (
          <KPICard key={idx} {...kpi} />
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ChangeOrdersTable changeOrders={changeOrders} />
        </div>
        <div>
          <ProjectHealth projects={projects} />
        </div>
      </div>

      {/* Budget Chart */}
      <BudgetChart data={waterfallData} />
    </main>
  )
}