import { useState, useEffect } from 'react'
import { collection, query,
         orderBy, onSnapshot } from 'firebase/firestore'
import { db }                  from '../firebase/config'

export default function Notes() {
  const [clients, setClients] = useState([])
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q     = query(collection(db, 'clients'), orderBy('name'))
    const unsub = onSnapshot(q, snap => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const withNotes = clients.filter(c =>
    c.notes?.trim() &&
    (search
      ? c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.notes.toLowerCase().includes(search.toLowerCase())
      : true
    )
  )

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: '720px' }}>
        <div className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>Notes</div>
        <div className="text-xs font-mono mb-6" style={{ color: 'var(--text3)' }}>
          All client notes in one place
        </div>

        <div className="relative mb-6">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by client name or note content..."
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent2)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-sm"
              style={{ color: 'var(--text3)' }}
              onMouseOver={e => e.target.style.color = 'var(--text)'}
              onMouseOut={e  => e.target.style.color = 'var(--text3)'}>
              x
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center text-sm py-12" style={{ color: 'var(--text3)' }}>Loading...</div>
        ) : withNotes.length === 0 ? (
          <div className="text-center text-sm py-12" style={{ color: 'var(--text3)' }}>
            <div className="text-2xl mb-3 font-mono">[ ]</div>
            {search ? `No notes match "${search}"` : 'No client notes yet.'}
          </div>
        ) : (
          <div className="space-y-3">
            {withNotes.map(c => (
              <div key={c.id} className="rounded-lg p-4"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{c.name}</div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{
                    background: c.status === 'active' ? '#1a3d28' : c.status === 'inactive' ? '#2d2316' : '#1e2e3d',
                    color:      c.status === 'active' ? '#5fbb87' : c.status === 'inactive' ? '#c0894a' : '#5b9bd5',
                    border: `1px solid ${c.status === 'active' ? '#2e6644' : c.status === 'inactive' ? '#5a3e1a' : '#2a4a6a'}`,
                  }}>
                    {c.status || 'active'}
                  </span>
                </div>
                <div className="text-sm font-mono leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text2)' }}>
                  {c.notes}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
