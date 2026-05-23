export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div
        className="fixed inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative z-10 w-full" style={{ maxWidth: '360px' }}>
        <div className="text-center mb-8">
          <div className="text-2xl font-semibold tracking-wide" style={{ color: 'var(--accent)' }}>
            CLIENT<span style={{ color: 'var(--text3)', fontWeight: 400 }}>mgr</span>
          </div>
          <div className="text-xs font-mono mt-1" style={{ color: 'var(--text3)' }}>internal tool</div>
        </div>
        {children}
      </div>
    </div>
  )
}
