import { useState }                            from 'react'
import { Link, useNavigate }                   from 'react-router-dom'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc }                         from 'firebase/firestore'
import { auth, db }                            from '../firebase/config'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    setError('')
    try {
      const cred   = await signInWithEmailAndPassword(auth, email, password)
      const snap   = await getDoc(doc(db, 'users', cred.user.uid))
      const status = snap.exists() ? snap.data().status : null
      if (status === 'pending') {
        await signOut(auth); setError('Your account is pending approval by an admin.'); setLoading(false); return
      }
      if (status === 'rejected') {
        await signOut(auth); setError('Your access request was not approved.'); setLoading(false); return
      }
      navigate('/')
    } catch (err) {
      setLoading(false)
      setPassword('')
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password.'); break
        case 'auth/too-many-requests':
          setError('Too many attempts. Try again later.'); break
        default:
          setError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0d1321' }}>
      <div className="fixed inset-0 opacity-20" style={{
        backgroundImage: 'linear-gradient(#1e3a52 1px, transparent 1px), linear-gradient(90deg, #1e3a52 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />
      <div className="relative z-10 w-full" style={{ maxWidth: '360px' }}>
        <div className="text-center mb-8">
          <div className="text-2xl font-semibold tracking-wide" style={{ color: '#38bdf8' }}>
            CLIENT<span style={{ color: '#3d6480', fontWeight: 400 }}>mgr</span>
          </div>
          <div className="text-xs font-mono mt-1" style={{ color: '#3d6480' }}>internal tool</div>
        </div>
        <div className="rounded-xl p-7" style={{ background: '#111827', border: '1px solid #1e3a52' }}>
          <div className="text-lg font-semibold mb-5" style={{ color: '#e0f2fe' }}>Sign in</div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: '#3d6480' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" autoComplete="email"
                className="w-full rounded-md px-3 py-2.5 text-sm outline-none transition-colors"
                style={{ background: '#1a2540', border: '1px solid #1e3a52', color: '#e0f2fe' }}
                onFocus={e => e.target.style.borderColor = '#0284c7'}
                onBlur={e  => e.target.style.borderColor = '#1e3a52'} />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: '#3d6480' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter password" autoComplete="current-password"
                className="w-full rounded-md px-3 py-2.5 text-sm outline-none transition-colors"
                style={{ background: '#1a2540', border: '1px solid #1e3a52', color: '#e0f2fe' }}
                onFocus={e => e.target.style.borderColor = '#0284c7'}
                onBlur={e  => e.target.style.borderColor = '#1e3a52'} />
            </div>
            {error && (
              <div className="text-xs font-mono flex items-center gap-2" style={{ color: '#f87171' }}>
                ! {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full font-medium text-sm py-2.5 rounded-md transition-colors disabled:opacity-50 mt-2 text-white"
              style={{ background: '#0284c7' }}
              onMouseOver={e => e.currentTarget.style.background = '#38bdf8'}
              onMouseOut={e  => e.currentTarget.style.background = '#0284c7'}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        <div className="text-center mt-5 text-xs font-mono" style={{ color: '#3d6480' }}>
          clientmgr — internal use only
          <div className="mt-1">
            <Link to="/signup" className="transition-colors" style={{ color: '#3d6480', opacity: 0.6 }}
              onMouseOver={e => e.target.style.opacity = '1'}
              onMouseOut={e  => e.target.style.opacity = '0.6'}>
              Request access
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
