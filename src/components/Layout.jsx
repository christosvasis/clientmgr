import { useState, useEffect }  from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { signOut }              from 'firebase/auth'
import { auth }                 from '../firebase/config'
import { useAuth }              from '../context/AuthContext'
import { useTheme }             from '../context/ThemeContext'

const GLYPH_SIZE = '1.25rem' // consistent size for all glyphs

const NAV = [
  { to: '/',         label: 'Dashboard', icon: '⊞', end: true  },
  { to: '/notes',    label: 'Notes',     icon: '≡', end: false },
  { to: '/settings', label: 'Settings',  icon: '⊙', end: false },
]

export default function Layout({ children }) {
  const { user, isAdmin }      = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate               = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const savedZoom = parseInt(localStorage.getItem('uiZoom') || '100', 10)
    const root = document.getElementById('zoom-root')
    if (root && savedZoom !== 100) {
      const scale = savedZoom / 100
      root.style.transform       = `scale(${scale})`
      root.style.transformOrigin = 'top left'
      root.style.width           = `${100 / scale}%`
      root.style.height          = `${100 / scale}vh`
    }
  }, [])

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() || '??'

  return (
    <div className="overflow-hidden" style={{ width: '100vw', height: '100vh', background: 'var(--bg)' }}>
      <div id="zoom-root" className="flex w-full h-full overflow-hidden" style={{ transformOrigin: 'top left' }}>

        {/* Sidebar */}
        <aside
          className={`flex flex-col flex-shrink-0 transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'}`}
          style={{ height: '100%', background: 'var(--bg2)', borderRight: '1px solid var(--border)' }}
        >
          {/* Logo */}
          <div
            className="flex items-center justify-between px-4 flex-shrink-0"
            style={{ height: '52px', borderBottom: '1px solid var(--border)' }}
          >
            {!collapsed && (
              <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--accent)' }}>
                CLIENT<span style={{ color: 'var(--text3)', fontWeight: 400 }}>mgr</span>
              </span>
            )}
            <button
              onClick={() => setCollapsed(c => !c)}
              className="transition-colors ml-auto"
              style={{ color: 'var(--text3)', fontSize: GLYPH_SIZE, lineHeight: 1 }}
              onMouseOver={e => e.target.style.color = 'var(--text)'}
              onMouseOut={e  => e.target.style.color = 'var(--text3)'}
            >
              {collapsed ? '›' : '‹'}
            </button>
          </div>

          {/* Nav — top items */}
          <nav className="flex-1 py-3 overflow-hidden">
            {!collapsed && (
              <div
                className="px-4 mb-1 text-[10px] uppercase tracking-widest font-medium"
                style={{ color: 'var(--text3)' }}
              >
                Menu
              </div>
            )}
            {NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-2 cursor-pointer whitespace-nowrap overflow-hidden"
                style={({ isActive }) => ({
                  color:           isActive ? 'var(--accent)' : 'var(--text2)',
                  background:      isActive ? 'var(--bg3)'    : 'transparent',
                  borderLeftColor: isActive ? 'var(--accent)' : 'transparent',
                })}
              >
                <span
                  className="flex-shrink-0"
                  style={{ fontSize: GLYPH_SIZE, color: 'var(--text3)', lineHeight: 1, width: '1.25rem', textAlign: 'center' }}
                >
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Bottom — admin + logout */}
          <div className="py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            {!collapsed && (
              <div
                className="px-4 mb-1 text-[10px] uppercase tracking-widest font-medium"
                style={{ color: 'var(--text3)' }}
              >
                System
              </div>
            )}

            {/* Admin — only for admins, above logout */}
            {isAdmin && (
              <NavLink
                to="/admin"
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-2 cursor-pointer whitespace-nowrap overflow-hidden"
                style={({ isActive }) => ({
                  color:           isActive ? 'var(--accent)' : 'var(--text2)',
                  background:      isActive ? 'var(--bg3)'    : 'transparent',
                  borderLeftColor: isActive ? 'var(--accent)' : 'transparent',
                })}
              >
                <span
                  className="flex-shrink-0"
                  style={{ fontSize: GLYPH_SIZE, color: 'var(--text3)', lineHeight: 1, width: '1.25rem', textAlign: 'center' }}
                >
                  ◈
                </span>
                {!collapsed && <span className="truncate">Admin</span>}
              </NavLink>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors w-full border-l-2 border-transparent whitespace-nowrap overflow-hidden"
              style={{ color: 'var(--danger)' }}
            >
              <span
                className="flex-shrink-0"
                style={{ fontSize: GLYPH_SIZE, lineHeight: 1, width: '1.25rem', textAlign: 'center' }}
              >
                ⏻
              </span>
              {!collapsed && <span className="truncate">Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Topbar */}
          <header
            className="flex items-center justify-between px-6 flex-shrink-0"
            style={{ height: '52px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}
          >
            <div className="text-sm font-mono" style={{ color: 'var(--text3)' }}>
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </div>
            <div className="flex items-center gap-3">

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  background:  'var(--btn-bg)',
                  color:       'var(--text2)',
                  border:      '1px solid var(--border)',
                  fontSize:    GLYPH_SIZE,
                  lineHeight:  1,
                }}
              >
                {theme === 'dark' ? '☀' : '☽'}
              </button>

              <span
                className="text-xs font-mono hidden sm:block truncate"
                style={{ maxWidth: '200px', color: 'var(--text3)' }}
              >
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
          <main
            className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
            style={{ background: 'var(--bg)' }}
          >
            {children}
          </main>

        </div>
      </div>
    </div>
  )
}
