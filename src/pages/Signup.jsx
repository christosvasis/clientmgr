import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const ALLOWED_DOMAIN = '@mymail.mail'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    if (!email || !password || !confirm) { setError('Please fill in all fields.'); return }
    if (!email.endsWith(ALLOWED_DOMAIN)) { setError(`Only ${ALLOWED_DOMAIN} addresses are allowed.`); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await setDoc(doc(db, 'users', cred.user.uid), {
        email, isAdmin: false, isPowerUser: false, status: 'pending',
        createdAt: new Date().toISOString()
      })
      await signOut(auth)
      setDone(true)
    } catch (err) {
      setLoading(false)
      switch (err.code) {
        case 'auth/email-already-in-use': setError('An account with this email already exists.'); break
        case 'auth/invalid-email': setError('Please enter a valid email address.'); break
        case 'auth/weak-password': setError('Password must be at least 6 characters.'); break
        default: setError('Something went wrong. Please try again.')
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
          {!done ? (
            <>
              <div className="text-lg font-semibold mb-1" style={{ color: '#e0f2fe' }}>Request access</div>
              <div className="text-xs font-mono mb-5 leading-relaxed" style={{ color: '#3d6480' }}>
                Only {ALLOWED_DOMAIN} addresses are allowed.<br />
                Your account will be reviewed before activation.
              </div>
              <form onSubmit={handleSignup} className="space-y-4">
                {[
                  { label: 'Email', id: 'email', type: 'email', val: email, set: setEmail, ph: `you${ALLOWED_DOMAIN}` },
                  { label: 'Password', id: 'password', type: 'password', val: password, set: setPassword, ph: 'Min. 6 characters' },
                  { label: 'Confirm password', id: 'confirm', type: 'password', val: confirm, set: setConfirm, ph: 'Repeat password' },
                ].map(f => (
                  <div key={f.id}>
                    <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: '#3d6480' }}>{f.label}</label>
                    <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                      className="w-full rounded-md px-3 py-2.5 text-sm outline-none transition-colors"
                      style={{ background: '#1a2540', border: '1px solid #1e3a52', color: '#e0f2fe' }}
                      onFocus={e => e.target.style.borderColor = '#0284c7'}
                      onBlur={e => e.target.style.borderColor = '#1e3a52'} />
                  </div>
                ))}
                {error && <div className="text-xs font-mono" style={{ color: '#f87171' }}>! {error}</div>}
                <button type="submit" disabled={loading}
                  className="w-full font-medium text-sm py-2.5 rounded-md transition-colors disabled:opacity-50 mt-2 text-white"
                  style={{ background: '#0284c7' }}
                  onMouseOver={e => e.currentTarget.style.background = '#38bdf8'}
                  onMouseOut={e => e.currentTarget.style.background = '#0284c7'}>
                  {loading ? 'Submitting...' : 'Request access'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-4 font-mono" style={{ color: '#38bdf8' }}>[ok]</div>
              <div className="text-base font-semibold mb-2" style={{ color: '#e0f2fe' }}>Request submitted</div>
              <div className="text-xs font-mono leading-relaxed" style={{ color: '#3d6480' }}>
                Your account is pending approval.<br />
                An admin will review your request.<br />
                You will be able to log in once approved.
              </div>
            </div>
          )}
        </div>
        <div className="text-center mt-5 text-xs font-mono" style={{ color: '#3d6480' }}>
          Already have an account?{' '}
          <Link to="/login" className="transition-colors" style={{ color: '#7da8c4' }}
            onMouseOver={e => e.target.style.color = '#38bdf8'}
            onMouseOut={e => e.target.style.color = '#7da8c4'}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
