const STATUS = {
  active:   { label: 'Active',   style: { background: '#1a3d28', color: '#5fbb87', border: '1px solid #2e6644' } },
  inactive: { label: 'Inactive', style: { background: '#2d2316', color: '#c0894a', border: '1px solid #5a3e1a' } },
  on_hold:  { label: 'On Hold',  style: { background: '#1e2e3d', color: '#5b9bd5', border: '1px solid #2a4a6a' } },
}

export default function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.active
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded" style={s.style}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  )
}
