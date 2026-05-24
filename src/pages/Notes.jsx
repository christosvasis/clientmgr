import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { useClients } from '../hooks/useClients'
import StatusBadge from '../components/StatusBadge'
import SearchInput from '../components/ui/SearchInput'

function NoteModal({ client, onClose, onSaved, canEdit }) {
  const [notes, setNotes] = useState(client.notes || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSave() {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'clients', client.id), { notes })
      onSaved({ ...client, notes })
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${client.name} notes`}
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
          <button onClick={onClose} className="cm-hover-text text-lg transition-colors font-mono">
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
              className="cm-input w-full rounded-md px-3 py-2 text-sm font-mono outline-none transition-colors resize-none"
              style={{ minHeight: '200px' }}
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
            <button onClick={onClose} className="text-sm px-4 py-2 transition-colors" style={{ color: 'var(--text2)' }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="cm-btn-save text-sm font-medium px-5 py-2 rounded-md transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function preview(text, max = 80) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '...' : text
}

export default function Notes() {
  const { isAdmin, isPowerUser } = useAuth()
  const canEdit = isAdmin || isPowerUser
  const { clients, setClients, loading } = useClients()
  const [search, setSearch] = useState('')
  const [openClient, setOpenClient] = useState(null)

  const withNotes = clients.filter(c =>
    c.notes?.trim() &&
    (search
      ? c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.notes.toLowerCase().includes(search.toLowerCase())
      : true
    )
  )

  function handleSaved(updated) {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
    setOpenClient(updated)
  }

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ background: 'var(--bg)' }}>
      <div className="w-full mx-auto" style={{ maxWidth: '640px' }}>

        <div className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>Notes</div>
        <div className="text-xs font-mono mb-6" style={{ color: 'var(--text3)' }}>
          All client notes in one place — click a card to open
        </div>

        <div className="mb-6">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by client name or note content..."
          />
        </div>

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
                className="cm-card text-left rounded-lg p-4 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{c.name}</div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="text-xs font-mono leading-relaxed" style={{ color: 'var(--text3)', whiteSpace: 'pre-wrap' }}>
                  {preview(c.notes)}
                </div>
                <div className="mt-2 text-[10px] font-mono" style={{ color: 'var(--accent)' }}>
                  {canEdit ? 'Click to edit' : 'Click to read'}
                </div>
              </button>
            ))}
          </div>
        )}

      </div>

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
