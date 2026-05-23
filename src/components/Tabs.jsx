export default function Tabs({ tabs, active, onChange, noMargin }) {
  return (
    <div
      className={`flex gap-1 rounded-lg p-1 w-fit ${noMargin ? '' : 'mb-6'}`}
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className="px-4 py-1.5 text-sm rounded-md transition-colors font-medium"
          style={{
            background: active === tab.value ? 'var(--accent2)' : 'transparent',
            color:      active === tab.value ? '#ffffff'        : 'var(--text2)',
          }}
        >
          {tab.label}
          {tab.count > 0 && (
            <span
              className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
              style={{
                background: active === tab.value ? 'rgba(255,255,255,0.2)' : 'var(--bg3)',
                color:      active === tab.value ? '#ffffff'               : 'var(--accent)',
              }}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
