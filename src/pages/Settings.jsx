import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { applyZoom } from '../utils/zoom'

export default function Settings() {
  const { user, profile } = useAuth()
  const [basePath, setBasePath] = useState(() => localStorage.getItem('basePath') || '/project/')
  const [zoom, setZoom] = useState(() => parseInt(localStorage.getItem('uiZoom') || '100', 10))
  const [saved, setSaved] = useState(false)

  function changeZoom(val) {
    const z = Math.min(130, Math.max(80, val))
    setZoom(z)
    applyZoom(z)
    localStorage.setItem('uiZoom', z)
  }

  function saveSettings() {
    localStorage.setItem('basePath', basePath)
    localStorage.setItem('uiZoom', zoom)
    applyZoom(zoom)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const roleLabel = profile?.isAdmin ? 'Admin' : profile?.isPowerUser ? 'Power user' : 'User'

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: '480px' }}>

        <div className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>Settings</div>
        <div className="text-xs font-mono mb-6" style={{ color: 'var(--text3)' }}>Configure your workspace</div>

        {/* Account */}
        <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>Account</div>
        <div className="rounded-lg p-4 mb-6" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
              style={{ background: 'var(--accent2)' }}
            >
              {user?.email?.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm truncate" style={{ color: 'var(--text)' }}>{user?.email}</div>
              <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text3)' }}>{roleLabel}</div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>Appearance</div>
        <div className="rounded-lg p-4 mb-6" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
          <div className="text-xs mb-3" style={{ color: 'var(--text3)' }}>Interface zoom</div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => changeZoom(zoom - 5)}
              className="w-8 h-8 rounded text-sm font-mono transition-colors"
              style={{ background: 'var(--btn-bg)', border: '1px solid var(--border)', color: 'var(--text2)' }}
            >
              -
            </button>
            <span className="text-sm font-mono w-12 text-center" style={{ color: 'var(--text)' }}>{zoom}%</span>
            <button
              onClick={() => changeZoom(zoom + 5)}
              className="w-8 h-8 rounded text-sm font-mono transition-colors"
              style={{ background: 'var(--btn-bg)', border: '1px solid var(--border)', color: 'var(--text2)' }}
            >
              +
            </button>
            <button onClick={() => changeZoom(100)} className="cm-hover-text2 text-xs transition-colors ml-1 font-mono">
              Reset
            </button>
          </div>
          <div className="text-xs font-mono mt-2" style={{ color: 'var(--text3)' }}>
            Range: 80% - 130%. Saved between sessions.
          </div>
        </div>

        {/* Paths */}
        <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>Paths</div>
        <div className="rounded-lg p-4 mb-6" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
          <div className="text-xs mb-1.5" style={{ color: 'var(--text3)' }}>Base path</div>
          <input
            value={basePath} onChange={e => setBasePath(e.target.value)}
            placeholder="/project/"
            className="cm-input w-full rounded px-3 py-2 text-sm font-mono outline-none transition-colors"
          />
          <div className="text-xs font-mono mt-2" style={{ color: 'var(--text3)' }}>
            Clients launch from this folder — e.g. /project/client_a/app.exe
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button onClick={saveSettings} className="cm-btn-save text-sm font-medium px-5 py-2 rounded transition-colors">
            Save changes
          </button>
          {saved && <span className="text-xs font-mono" style={{ color: '#5fbb87' }}>Saved</span>}
        </div>

      </div>
    </div>
  )
}
