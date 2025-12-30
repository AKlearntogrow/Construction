export default function StatusBadge({ status }) {
  const styles = {
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pending_gc: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pending_owner: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    disputed: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  const labels = {
    approved: 'Approved',
    pending_gc: 'With GC',
    pending_owner: 'With Owner',
    disputed: 'Disputed',
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}