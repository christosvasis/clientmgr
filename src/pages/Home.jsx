import { useState, useEffect, useRef } from 'react'
import {
  collection, query,
  orderBy, onSnapshot
} from 'firebase/firestore'
import { db } from '../firebase/config'
import StatusBadge from '../components/StatusBadge'
import ClientPanel from '../components/ClientPanel'

function highlight(text, q) {
  if (!q) return text
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i === -1) return text
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: 'transparent', color: 'var(--accent)' }}>
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  )
}

export default function Home() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [recentlyUsed, setRecentlyUsed] = useState(
    () => JSON.parse(localStorage.getItem('recentlyUsed') || '[]')
  )
  const searchRef = useRef(null)

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('name'))
    const unsub = onSnapshot(q, snap => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const filtered = search.trim()
    ? clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : []

  function openClient(client) {
    setSelectedClient(client)
    const updated = [client.name, ...recentlyUsed.filter(n => n !== client.name)].slice(0, 4)
    setRecentlyUsed(updated)
    localStorage.setItem('recentlyUsed', JSON.stringify(updated))
  }

  function copyPath(e, path) {
    e.stopPropagation()
    navigator.clipboard.writeText(path)
  }

  function handleUpdated(updated) {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelectedClient(updated)
  }

  return (
    <div className="p-6 flex flex-col h-full min-h-0" style={{ background: 'var(--bg)' }}>

      {/* Centered container */}
      <div className="w-full mx-auto" style={{ maxWidth: '640px' }}>

        {/* Recently used */}
        {recentlyUsed.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>
              Recently used
            </div>
            <div className="flex flex-wrap gap-2">
              {recentlyUsed.map(name => (
                <button
                  key={name}
                  onClick={() => {
                    setSearch(name)
                    setTimeout(() => {
                      const client = clients.find(c => c.name === name)
                      if (client) openClient(client)
                    }, 50)
                  }}
                  className="flex items-center gap-2 text-xs rounded-full px-3 py-1 transition-colors"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent2)'; e.currentTarget.style.color = 'var(--text)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Type a client name to search..."
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

        {/* Result count */}
        {search && (
          <div className="text-xs font-mono mb-3" style={{ color: 'var(--text3)' }}>
            {filtered.length} client{filtered.length !== 1 ? 's' : ''} found
          </div>
        )}

        {/* Table */}
        <div
          className="rounded-lg overflow-hidden overflow-y-auto"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', maxHeight: '400px' }}
        >
          {!search ? (
            <div className="py-10 text-center text-sm" style={{ color: 'var(--text3)' }}>
              Start typing to find a client
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm" style={{ color: 'var(--text3)' }}>
              No clients match &ldquo;{search}&rdquo;
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Client', 'Status', 'Path', ''].map((h, i) => (
                    <th
                      key={i}
                      className="text-left text-xs uppercase tracking-wider px-4 py-2.5"
                      style={{ color: 'var(--text3)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(client => (
                  <tr
                    key={client.id}
                    onClick={() => openClient(client)}
                    className="cursor-pointer transition-colors last:border-0"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="px-4 py-2.5 text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {highlight(client.name, search)}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={client.status} />
                    </td>
                    <td
                      className="px-4 py-2.5 text-xs font-mono max-w-[140px] truncate"
                      style={{ color: 'var(--text3)' }}
                    >
                      {client.path}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={e => copyPath(e, client.path)}
                        className="text-xs transition-colors font-mono"
                        style={{ color: 'var(--text3)' }}
                        onMouseOver={e => e.target.style.color = 'var(--accent)'}
                        onMouseOut={e => e.target.style.color = 'var(--text3)'}
                        title="Copy path"
                      >
                        copy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Client panel */}
      {selectedClient && (
        <ClientPanel
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
