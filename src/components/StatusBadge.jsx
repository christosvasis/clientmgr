import { useTheme } from '../context/ThemeContext'

const STATUS_DARK = {
  active:   { label: 'Active',   style: { background: '#1a3d28', color: '#5fbb87', border: '1px solid #2e6644' } },
  inactive: { label: 'Inactive', style: { background: '#2d2316', color: '#c0894a', border: '1px solid #5a3e1a' } },
  on_hold:  { label: 'On Hold',  style: { background: '#1e2e3d', color: '#5b9bd5', border: '1px solid #2a4a6a' } },
}

const STATUS_LIGHT = {
  active:   { label: 'Active',   style: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' } },
  inactive: { label: 'Inactive', style: { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' } },
  on_hold:  { label: 'On Hold',  style: { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' } },
}

export default function StatusBadge({ status }) {
  const { theme } = useTheme()
  const map = theme === 'light' ? STATUS_LIGHT : STATUS_DARK
  const s   = map[status] || map.active
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded"
      style={s.style}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  )
}