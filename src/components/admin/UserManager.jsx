import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { adminFetch } from '../../lib/api'
import StatusBadge from '../StatusBadge'

export default function UserManager() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ email: '', password: '', isAdmin: false, isPowerUser: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      setUsers(
        snap.docs.map(d => ({ uid: d.id, ...d.data() }))
          .sort((a, b) => (a.email || '').localeCompare(b.email || ''))
      )
      setLoading(false)
    })
    return unsub
  }, [])

  async function handleAddUser(e) {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Email and password are required.'); return }
    setSaving(true); setError('')
    try {
      await adminFetch('/api/create-user', currentUser, form)
      setForm({ email: '', password: '', isAdmin: false, isPowerUser: false })
      setSuccess('User created.')
      setTimeout(() => setSuccess(''), 2000)
    } catch (e) { setError(e.message || 'Failed to create user.') }
    setSaving(false)
  }

  async function handleUpdateRole(uid, field, value) {
    try {
      const user = users.find(u => u.uid === uid)
      await adminFetch('/api/update-user', currentUser, {
        uid, isAdmin: user.isAdmin, isPowerUser: user.isPowerUser, [field]: value,
      })
    } catch { alert('Failed to update user.') }
  }

  async function handleDelete(uid, email) {
    if (!confirm(`Delete "${email}"? This cannot be undone.`)) return
    try {
      await adminFetch('/api/delete-user', currentUser, { uid })
    } catch (e) { alert(e.message || 'Failed to delete user.') }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg p-5" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div className="text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--text3)' }}>Add user</div>
        <form onSubmit={handleAddUser} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Email</label>
              <input
                type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="user@company.com" className="cm-input w-full rounded px-3 py-2 text-sm outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Password</label>
              <input
                type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 6 characters" className="cm-input w-full rounded px-3 py-2 text-sm outline-none transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-5">
            {[['isPowerUser', 'Power user'], ['isAdmin', 'Admin']].map(([field, label]) => (
              <label key={field} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text2)' }}>
                <input
                  type="checkbox" checked={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.checked }))}
                  className="accent-[#38bdf8]"
                />
                {label}
              </label>
            ))}
          </div>
          {error && <div className="text-xs font-mono" style={{ color: 'var(--danger)' }}>{error}</div>}
          {success && <div className="text-xs font-mono" style={{ color: '#5fbb87' }}>{success}</div>}
          <button
            type="submit" disabled={saving}
            className="cm-btn-primary text-sm font-medium px-4 py-2 rounded transition-colors disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Add user'}
          </button>
        </form>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 text-xs uppercase tracking-wider"
          style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
          All users ({users.length})
        </div>
        {loading ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text3)' }}>Loading...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Email', 'Status', 'Power user', 'Admin', ''].map((h, i) => (
                  <th key={i} className="text-left text-xs uppercase tracking-wider px-4 py-3"
                    style={{ color: 'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr
                  key={u.uid}
                  className="cm-row last:border-0 transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {u.email || <span className="italic text-xs" style={{ color: 'var(--text3)' }}>no email</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status || 'approved'} />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox" checked={u.isPowerUser || false}
                      onChange={e => handleUpdateRole(u.uid, 'isPowerUser', e.target.checked)}
                      className="accent-[#38bdf8]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox" checked={u.isAdmin || false}
                      onChange={e => handleUpdateRole(u.uid, 'isAdmin', e.target.checked)}
                      disabled={u.uid === currentUser?.uid}
                      className="accent-[#38bdf8] disabled:opacity-40"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(u.uid, u.email)}
                      disabled={u.uid === currentUser?.uid}
                      className="text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ color: 'var(--danger)' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
