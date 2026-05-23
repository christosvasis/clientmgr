import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuth } from '../context/AuthContext'

const GLYPH = '1.25rem'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '⊞', end: true },
  { to: '/notes', label: 'Notes', icon: '≡', end: false },
  { to: '/settings', label: 'Settings', icon: '⊙', end: false },
]

function NavItem({ to, label, icon, end, showLabel, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-2 cursor-pointer whitespace-nowrap overflow-hidden"
      style={({ isActive }) => ({
        color: isActive ? 'var(--accent)' : 'var(--text2)',
        background: isActive ? 'var(--bg3)' : 'transparent',
        borderLeftColor: isActive ? 'var(--accent)' : 'transparent',
      })}
    >
      <span
        className="flex-shrink-0"
        style={{ fontSize: GLYPH, color: 'var(--text3)', lineHeight: 1, width: '1.25rem', textAlign: 'center' }}
      >
        {icon}
      </span>
      {showLabel && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

export default function Sidebar({ collapsed, setCollapsed, mobile, onClose }) {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const showLabel = !collapsed || mobile

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <>
      {/* Logo row */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{ height: '52px', borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--accent)' }}>
          CLIENT<span style={{ color: 'var(--text3)', fontWeight: 400 }}>mgr</span>
        </span>
        {mobile ? (
          <button
            onClick={onClose}
            className="transition-colors ml-auto"
            style={{ color: 'var(--text3)', fontSize: GLYPH, lineHeight: 1 }}
          >
            ✕
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="cm-hover-text transition-colors ml-auto"
            style={{ fontSize: GLYPH, lineHeight: 1 }}
          >
            {collapsed ? '›' : '‹'}
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 overflow-hidden">
        {showLabel && (
          <div className="px-4 mb-1 text-[10px] uppercase tracking-widest font-medium" style={{ color: 'var(--text3)' }}>
            Menu
          </div>
        )}
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.to}
            {...item}
            showLabel={showLabel}
            onClick={() => mobile && onClose()}
          />
        ))}
      </nav>

      {/* Bottom — admin + logout */}
      <div className="py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        {showLabel && (
          <div className="px-4 mb-1 text-[10px] uppercase tracking-widest font-medium" style={{ color: 'var(--text3)' }}>
            System
          </div>
        )}
        {isAdmin && (
          <NavItem
            to="/admin"
            label="Admin"
            icon="◈"
            end={false}
            showLabel={showLabel}
            onClick={() => mobile && onClose()}
          />
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-sm transition-colors w-full border-l-2 border-transparent whitespace-nowrap overflow-hidden"
          style={{ color: 'var(--danger)' }}
        >
          <span
            className="flex-shrink-0"
            style={{ fontSize: GLYPH, lineHeight: 1, width: '1.25rem', textAlign: 'center' }}
          >
            ⏻
          </span>
          {showLabel && <span className="truncate">Logout</span>}
        </button>
      </div>
    </>
  )
}
