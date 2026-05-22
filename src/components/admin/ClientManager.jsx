import { useState, useEffect }             from 'react'
import { collection, onSnapshot, addDoc,
         deleteDoc, updateDoc, doc,
         orderBy, query }                  from 'firebase/firestore'
import { db }                              from '../../firebase/config'

const EMPTY_CLIENT = { name: '', path: '', status: 'active', notes: '', software: [] }
const EMPTY_SW     = { key: '', label: '', exe: '' }

export default function ClientManager() {
  const [clients,  setClients]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState(EMPTY_CLIENT)
  const [software, setSoftware] = useState([{ ...EMPTY_SW }])
  const [editing,  setEditing]  = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  useEffect(() => {
    const q     = query(collection(db, 'clients'), orderBy('name'))
    const unsub = onSnapshot(q, snap => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  function startEdit(client) {
    setEditing(client.id)
    setForm({ name: client.name, path: client.path, status: client.status || 'active', notes: client.notes || '' })
    setSoftware(client.software?.length ? client.software : [{ ...EMPTY_SW }])
    setError('')
  }

  function cancelEdit() {
    setEditing(null)
    setForm(EMPTY_CLIENT)
    setSoftware([{ ...EMPTY_SW }])
    setError('')
  }

  function updateSW(i, field, value) {
    setSoftware(prev => prev.map((sw, idx) => idx === i ? { ...sw, [field]: value } : sw))
  }

  function addSW()     { setSoftware(prev => [...prev, { ...EMPTY_SW }]) }
  function removeSW(i) { setSoftware(prev => prev.filter((_, idx) => idx !== i)) }

  function validate() {
    if (!form.name.trim()) return 'Client name is required.'
    if (!form.path.trim()) return 'Folder path is required.'
    for (const sw of software) {
      if (sw.label || sw.exe || sw.key) {
        if (!sw.label.trim()) return 'Software label is required.'
        if (!sw.exe.trim())   return 'Software exe is required.'
        if (!sw.key.trim())   return 'Software key is required.'
      }
    }
    return null
  }

  async function handleSave() {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true); setError('')
    const cleanSW = software.filter(sw => sw.label && sw.exe && sw.key)
    const data    = { ...form, software: cleanSW }
    try {
      if (editing) { await updateDoc(doc(db, 'clients', editing), data) }
      else         { await addDoc(collection(db, 'clients'), data) }
      setSuccess(editing ? 'Client updated.' : 'Client added.')
      setTimeout(() => setSuccess(''), 2000)
      cancelEdit()
    } catch { setError('Failed to save client.') }
    setSaving(false)
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await deleteDoc(doc(db, 'clients', id))
  }

  const inputStyle = { background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)' }
  const onFocus    = e => e.target.style.borderColor = 'var(--accent2)'
  const onBlur     = e => e.target.style.borderColor = 'var(--border)'
  const inputClass = "w-full rounded px-3 py-2 text-sm outline-none transition-colors"

  return (
    <div className="space-y-6">
      <div className="rounded-lg p-5" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div className="text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--text3)' }}>
          {editing ? 'Edit client' : 'Add client'}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Client name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Acme Corp" className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Folder path</label>
            <input value={form.path} onChange={e => setForm(f => ({ ...f, path: e.target.value }))}
              placeholder="acme_corp" className={`${inputClass} font-mono`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="rounded px-3 py-2 text-sm outline-none" style={inputStyle}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs" style={{ color: 'var(--text3)' }}>Software</label>
            <button onClick={addSW} className="text-xs transition-colors" style={{ color: 'var(--accent)' }}>
              + Add software
            </button>
          </div>
          <div className="space-y-2">
            {software.map((sw, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                <input value={sw.key}   onChange={e => updateSW(i, 'key',   e.target.value)}
                  placeholder="sw_1" className="rounded px-3 py-2 text-xs font-mono outline-none" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                <input value={sw.label} onChange={e => updateSW(i, 'label', e.target.value)}
                  placeholder="CRM Tool" className="rounded px-3 py-2 text-xs outline-none" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                <input value={sw.exe}   onChange={e => updateSW(i, 'exe',   e.target.value)}
                  placeholder="crm.exe" className="rounded px-3 py-2 text-xs font-mono outline-none" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                <button onClick={() => removeSW(i)} className="text-sm px-1 font-mono" style={{ color: 'var(--danger)' }}>x</button>
              </div>
            ))}
            <div className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>key — label — exe filename</div>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Optional notes..." rows={2}
            className="w-full rounded px-3 py-2 text-sm font-mono outline-none resize-none"
            style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
        </div>
        {error   && <div className="text-xs font-mono mb-3" style={{ color: 'var(--danger)' }}>{error}</div>}
        {success && <div className="text-xs font-mono mb-3" style={{ color: '#5fbb87' }}>{success}</div>}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="text-sm font-medium px-4 py-2 rounded transition-colors disabled:opacity-50 text-white"
            style={{ background: 'var(--accent2)' }}>
            {saving ? 'Saving...' : editing ? 'Update client' : 'Add client'}
          </button>
          {editing && (
            <button onClick={cancelEdit} className="text-sm px-4 py-2 transition-colors"
              style={{ color: 'var(--text2)' }}>Cancel</button>
          )}
        </div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 text-xs uppercase tracking-wider"
          style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
          All clients ({clients.length})
        </div>
        {loading ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text3)' }}>Loading...</div>
        ) : clients.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text3)' }}>No clients yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Path', 'Status', 'Software', ''].map((h, i) => (
                  <th key={i} className="text-left text-xs uppercase tracking-wider px-4 py-3"
                    style={{ color: 'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} className="last:border-0 transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseOut={e  => e.currentTarget.style.background = 'transparent'}>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text)' }}>{c.name}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text3)' }}>{c.path}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono px-2 py-0.5 rounded" style={{
                      background: c.status === 'active' ? '#1a3d28' : c.status === 'inactive' ? '#2d2316' : '#1e2e3d',
                      color:      c.status === 'active' ? '#5fbb87' : c.status === 'inactive' ? '#c0894a' : '#5b9bd5',
                      border: `1px solid ${c.status === 'active' ? '#2e6644' : c.status === 'inactive' ? '#5a3e1a' : '#2a4a6a'}`,
                    }}>{c.status || 'active'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text3)' }}>
                    {c.software?.length || 0} program{c.software?.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => startEdit(c)} className="text-xs" style={{ color: 'var(--accent)' }}>Edit</button>
                      <button onClick={() => handleDelete(c.id, c.name)} className="text-xs" style={{ color: 'var(--danger)' }}>Delete</button>
                    </div>
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
