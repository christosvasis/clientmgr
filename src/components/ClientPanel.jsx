import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import StatusBadge from './StatusBadge'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_hold', label: 'On Hold' },
]

export default function ClientPanel({ client, onClose, onUpdated }) {
  const { isAdmin, isPowerUser } = useAuth()
  const canEdit = isAdmin || isPowerUser

  const [notes, setNotes] = useState(client?.notes || '')
  const [status, setStatus] = useState(client?.status || 'active')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (client) {
      setNotes(client.notes || '')
      setStatus(client.status || 'active')
    }
  }, [client?.id])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!client) return null

  async function handleSave() {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'clients', client.id), { notes, status })
      onUpdated({ ...client, notes, status })
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  function copyPath() {
    navigator.clipboard.writeText(client.path)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function launch(software) {
    const url = `clientmgr://launch/${client.path}/${software.key}`
    const a = document.createElement('a')
    a.href = url
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <>
      <div className="fixed inset-0 z-20" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${client.name} details`}
        className="fixed right-0 top-0 h-full z-30 flex flex-col shadow-2xl w-full sm:w-[440px]"
        style={{ background: 'var(--bg2)', borderLeft: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{client.name}</div>
            <div className="mt-1"><StatusBadge status={status} /></div>
          </div>
          <button onClick={onClose} className="cm-hover-text text-lg transition-colors font-mono">
            x
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Path */}
          <div>
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>Path</div>
            <div
              className="flex items-center gap-2 rounded-md px-3 py-2"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
            >
              <span className="text-xs font-mono flex-1 truncate" style={{ color: 'var(--text3)' }}>
                {client.path}
              </span>
              <button onClick={copyPath} className="text-xs flex-shrink-0 transition-colors font-mono" style={{ color: 'var(--accent)' }}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Status */}
          {canEdit && (
            <div>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>Status</div>
              <select
                value={status} onChange={e => setStatus(e.target.value)}
                className="cm-input w-full rounded-md px-3 py-2 text-sm outline-none transition-colors"
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Software */}
          <div>
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>Software</div>
            {client.software?.length > 0 ? (
              <div className="space-y-2">
                {client.software.map(sw => (
                  <div
                    key={sw.key}
                    className="flex items-center justify-between rounded-md px-3 py-2.5"
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
                  >
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{sw.label}</div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text3)' }}>{sw.exe}</div>
                    </div>
                    <button onClick={() => launch(sw)} className="cm-btn-launch text-xs px-3 py-1.5 rounded transition-colors">
                      Launch
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs font-mono" style={{ color: 'var(--text3)' }}>No software configured.</div>
            )}
          </div>

          {/* Notes */}
          <div>
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>Notes</div>
            {canEdit ? (
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about this client..." rows={4}
                className="cm-input w-full rounded-md px-3 py-2 text-sm font-mono outline-none transition-colors resize-none"
              />
            ) : (
              <div
                className="text-sm font-mono rounded-md px-3 py-2 min-h-[80px]"
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)' }}
              >
                {notes || <span style={{ color: 'var(--text3)' }}>No notes.</span>}
              </div>
            )}
          </div>
        </div>

        {/* Save */}
        {canEdit && (
          <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={handleSave} disabled={saving}
              className="cm-btn-save w-full text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
