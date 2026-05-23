import { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'

export default function PendingRequests({ onCountChange }) {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      const p = snap.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter(u => u.status === 'pending')
        .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
      setPending(p)
      onCountChange(p.length)
      setLoading(false)
    })
    return unsub
  }, [])

  async function resolve(uid, status) {
    const action = status === 'approved' ? 'Approve' : 'Reject'
    if (!confirm(`${action} this user?`)) return
    await updateDoc(doc(db, 'users', uid), { status })
  }

  if (loading) return (
    <div className="py-8 text-center text-sm" style={{ color: 'var(--text3)' }}>Loading...</div>
  )

  if (!pending.length) return (
    <div className="rounded-lg py-12 text-center text-sm"
      style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text3)' }}>
      No pending requests
    </div>
  )

  return (
    <div className="rounded-lg overflow-hidden"
      style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Email', 'Requested', 'Actions'].map(h => (
              <th key={h} className="text-left text-xs uppercase tracking-wider px-4 py-3"
                style={{ color: 'var(--text3)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pending.map(u => (
            <tr key={u.uid} className="last:border-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text)' }}>{u.email}</td>
              <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text3)' }}>
                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '-'}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button onClick={() => resolve(u.uid, 'approved')}
                    className="text-xs px-3 py-1.5 rounded transition-colors"
                    style={{ background: '#1a3d28', color: '#5fbb87', border: '1px solid #2e6644' }}>
                    Approve
                  </button>
                  <button onClick={() => resolve(u.uid, 'rejected')}
                    className="text-xs px-3 py-1.5 rounded transition-colors"
                    style={{ background: '#2d1616', color: '#f87171', border: '1px solid #5a1a1a' }}>
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
