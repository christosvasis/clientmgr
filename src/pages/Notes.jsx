import { useState, useEffect } from 'react'
import {
  collection, query,
  orderBy, onSnapshot,
  doc, updateDoc
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'

function NoteModal({ client, onClose, onSaved, canEdit }) {
  const [notes, setNotes] = useState(client.notes || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'clients', client.id), { notes })
      onSaved({ ...client, notes })
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-6"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="w-full sm:rounded-xl shadow-2xl flex flex-col"
          style={{
            maxWidth: '560px',
            height: 'calc(100vh - 48px)',
            maxHeight: '80vh',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{client.name}</div>
              <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text3)' }}>Notes</div>
            </div>
            <button
              onClick={onClose}
              className="text-lg transition-colors font-mono"
              style={{ color: 'var(--text3)' }}
              onMouseOver={e => e.target.style.color = 'var(--text)'}
              onMouseOut={e => e.target.style.color = 'var(--text3)'}
            >
              x
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {canEdit ? (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about this client..."
                className="w-full rounded-md px-3 py-2 text-sm font-mono outline-none transition-colors resize-none"
                style={{
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  minHeight: '200px',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent2)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                autoFocus
              />
            ) : (
              <div
                className="text-sm font-mono leading-relaxed whitespace-pre-wrap"
                style={{ color: 'var(--text2)', minHeight: '200px' }}
              >
                {notes || <span style={{ color: 'var(--text3)' }}>No notes.</span>}
              </div>
            )}
          </div>

          {/* Footer */}
          {canEdit && (
            <div
              className="px-5 py-4 flex-shrink-0 flex items-center justify-end gap-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <button
                onClick={onClose}
                className="text-sm px-4 py-2 transition-colors"
                style={{ color: 'var(--text2)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm font-medium px-5 py-2 rounded-md transition-colors disabled:opacity-50 text-white"
                style={{ background: 'var(--accent2)' }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'var(--bg)' }}
                onMouseOut={e => { e.currentTarget.style.background = 'var(--accent2)'; e.currentTarget.style.color = '#ffffff' }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function Notes() {
  const { isAdmin, isPowerUser } = useAuth()
  const canEdit = isAdmin || isPowerUser

  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [openClient, setOpenClient] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('name'))
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

  // All clients for "no notes yet" state (to show empty cards)
  const allFiltered = search
    ? clients.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.notes || '').toLowerCase().includes(search.toLowerCase())
    )
    : clients

  function handleSaved(updated) {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
    setOpenClient(updated)
  }

  // Truncate note preview
  function preview(text, max = 80) {
    if (!text) return ''
    return text.length > max ? text.slice(0, max) + '...' : text
  }

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ background: 'var(--bg)' }}>
      <div className="w-full mx-auto" style={{ maxWidth: '640px' }}>

        <div className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>Notes</div>
        <div className="text-xs font-mono mb-6" style={{ color: 'var(--text3)' }}>
          All client notes in one place — click a card to open
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client name or note content..."
            className="w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent2)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-sm font-mono"
              style={{ color: 'var(--text3)' }}
              onMouseOver={e => e.target.style.color = 'var(--text)'}
              onMouseOut={e => e.target.style.color = 'var(--text3)'}
            >
              x
            </button>
          )}
        </div>

        {/* Notes grid */}
        {loading ? (
          <div className="text-center text-sm py-12" style={{ color: 'var(--text3)' }}>Loading...</div>
        ) : withNotes.length === 0 ? (
          <div className="text-center text-sm py-12" style={{ color: 'var(--text3)' }}>
            {search ? `No notes match "${search}"` : 'No client notes yet.'}
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {withNotes.map(c => (
              <button
                key={c.id}
                onClick={() => setOpenClient(c)}
                className="text-left rounded-lg p-4 transition-colors"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent2)'; e.currentTarget.style.background = 'var(--bg3)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg2)' }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {c.name}
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                {/* Note preview */}
                <div
                  className="text-xs font-mono leading-relaxed"
                  style={{ color: 'var(--text3)', whiteSpace: 'pre-wrap' }}
                >
                  {preview(c.notes)}
                </div>

                {/* Expand hint */}
                <div className="mt-2 text-[10px] font-mono" style={{ color: 'var(--accent)' }}>
                  {canEdit ? 'Click to edit' : 'Click to read'}
                </div>
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Note modal */}
      {openClient && (
        <NoteModal
          client={openClient}
          onClose={() => setOpenClient(null)}
          onSaved={handleSaved}
          canEdit={canEdit}
        />
      )}
    </div>
  )
}
