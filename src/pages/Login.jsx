import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import AuthLayout from '../components/ui/AuthLayout'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    setError('')
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
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

  const inputBase = 'cm-input w-full rounded-md px-3 py-2.5 text-sm outline-none transition-colors'

  return (
    <AuthLayout>
      <div className="rounded-xl p-7" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div className="text-lg font-semibold mb-5" style={{ color: 'var(--text)' }}>Sign in</div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text3)' }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com" autoComplete="email"
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text3)' }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter password" autoComplete="current-password"
              className={inputBase}
            />
          </div>
          {error && (
            <div className="text-xs font-mono flex items-center gap-2" style={{ color: 'var(--danger)' }}>
              ! {error}
            </div>
          )}
          <button
            type="submit" disabled={loading}
            className="cm-btn-primary w-full font-medium text-sm py-2.5 rounded-md transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
      <div className="text-center mt-5 text-xs font-mono" style={{ color: 'var(--text3)' }}>
        clientmgr — internal use only
        <div className="mt-1">
          <Link to="/signup" className="cm-link-fade transition-colors">
            Request access
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
