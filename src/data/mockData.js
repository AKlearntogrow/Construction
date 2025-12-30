// Mock data for the dashboard
// Later this will come from your database/API

export const waterfallData = [
  { name: 'Original Contract', value: 4200, color: '#64748b' },
  { name: 'Approved COs', value: 380, color: '#10b981' },
  { name: 'Pending COs', value: 156, color: '#f59e0b' },
  { name: 'Disputed', value: 67, color: '#ef4444' },
]

export const changeOrders = [
  { id: 'CO-2024-0156', project: 'Metro Center Tower', description: 'MEP clash resolution', amount: 45600, status: 'pending_owner', daysOpen: 18 },
  { id: 'CO-2024-0155', project: 'Harbor View Medical', description: 'Additional circuits - OR Suite', amount: 28400, status: 'approved', daysOpen: 12 },
  { id: 'CO-2024-0154', project: 'Metro Center Tower', description: 'Emergency lighting revision', amount: 12800, status: 'pending_gc', daysOpen: 8 },
  { id: 'CO-2024-0153', project: 'Riverside Commons', description: 'Scope gap - basement feeders', amount: 67200, status: 'disputed', daysOpen: 34 },
]

export const projects = [
  { name: 'Metro Center Tower', gc: 'Turner Construction', health: 72, pending: 380000, phase: 'MEP Rough-in' },
  { name: 'Harbor View Medical', gc: 'Skanska USA', health: 85, pending: 156000, phase: 'Above Ceiling' },
  { name: 'Riverside Commons', gc: 'Webcor Builders', health: 91, pending: 89000, phase: 'Finish' },
]

export const warnings = [
  { severity: 'high', message: 'RFI velocity 2.8x above average', detail: 'Metro Center Tower • 12 RFIs in 7 days', iconType: 'activity' },
  { severity: 'medium', message: 'Owner response time slowing', detail: 'Harbor View Medical • 18 days avg vs 8 days', iconType: 'clock' },
  { severity: 'medium', message: 'T&M tracking 40% above contract', detail: 'Metro Center Tower • $380K pending', iconType: 'trending' },
]

export const kpiData = [
  { title: 'Total CO Exposure', value: '$603K', change: '↑ 12.4% vs last month', positive: true, color: 'violet' },
  { title: 'Approved (MTD)', value: '$108K', change: '↑ 8.2% vs last month', positive: true, color: 'emerald' },
  { title: 'Avg. Approval Time', value: '14 days', change: '↓ 3 days vs benchmark', positive: true, color: 'blue' },
  { title: 'T&M Capture Rate', value: '100%', change: '0 tickets lost', positive: null, color: 'amber' },
]