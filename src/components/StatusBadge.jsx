const LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  on_hold: 'On Hold',
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
}

export default function StatusBadge({ status }) {
  const key = LABELS[status] ? status : 'active'
  return (
    <span className={`cm-badge-${key} inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {LABELS[key]}
    </span>
  )
}
