import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { applyZoom } from '../utils/zoom'
import Sidebar from './Sidebar'

const GLYPH = '1.25rem'

export default function Layout({ children }) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const savedZoom = parseInt(localStorage.getItem('uiZoom') || '100', 10)
    if (savedZoom !== 100) applyZoom(savedZoom)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const initials = user?.email?.slice(0, 2).toUpperCase() || '??'

  return (
    <div className="overflow-hidden" style={{ width: '100vw', height: '100vh', background: 'var(--bg)' }}>
      <div id="zoom-root" className="flex w-full h-full overflow-hidden" style={{ transformOrigin: 'top left' }}>

        {/* Desktop sidebar */}
        <aside
          className={`hidden sm:flex flex-col flex-shrink-0 transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'}`}
          style={{ height: '100%', background: 'var(--bg2)', borderRight: '1px solid var(--border)' }}
        >
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobile={false} onClose={() => setMobileOpen(false)} />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 sm:hidden"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setMobileOpen(false)}
            />
            <div
              className="fixed top-0 left-0 h-full z-50 flex flex-col sm:hidden"
              style={{ width: '280px', background: 'var(--bg2)', borderRight: '1px solid var(--border)' }}
            >
              <Sidebar collapsed={false} setCollapsed={setCollapsed} mobile={true} onClose={() => setMobileOpen(false)} />
            </div>
          </>
        )}

        {/* Main */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Topbar */}
          <header
            className="flex items-center justify-between px-4 sm:px-6 flex-shrink-0"
            style={{ height: '52px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              {/* Hamburger — mobile only */}
              <button
                className="sm:hidden flex flex-col justify-center gap-1.5 p-1"
                onClick={() => setMobileOpen(true)}
                style={{ color: 'var(--text2)' }}
              >
                <span className="block w-5 h-0.5 rounded" style={{ background: 'var(--text2)' }} />
                <span className="block w-5 h-0.5 rounded" style={{ background: 'var(--text2)' }} />
                <span className="block w-5 h-0.5 rounded" style={{ background: 'var(--text2)' }} />
              </button>

              {/* Logo — mobile only */}
              <span className="sm:hidden text-sm font-semibold tracking-wide" style={{ color: 'var(--accent)' }}>
                CLIENT<span style={{ color: 'var(--text3)', fontWeight: 400 }}>mgr</span>
              </span>

              {/* Date — desktop only */}
              <div className="hidden sm:block text-sm font-mono" style={{ color: 'var(--text3)' }}>
                {new Date().toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  background: 'var(--btn-bg)',
                  color: 'var(--text2)',
                  border: '1px solid var(--border)',
                  fontSize: GLYPH,
                  lineHeight: 1,
                }}
              >
                {theme === 'dark' ? '☀' : '☽'}
              </button>
              <span className="hidden sm:block text-xs font-mono truncate" style={{ maxWidth: '200px', color: 'var(--text3)' }}>
                {user?.email}
              </span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                style={{ background: 'var(--accent2)' }}
              >
                {initials}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ background: 'var(--bg)' }}>
            {children}
          </main>

        </div>
      </div>
    </div>
  )
}
