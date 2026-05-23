import { useState }       from 'react'
import { useAuth }        from '../context/AuthContext'
import { Navigate }       from 'react-router-dom'
import Tabs               from '../components/Tabs'
import PendingRequests    from '../components/admin/PendingRequests'
import ClientManager      from '../components/admin/ClientManager'
import UserManager        from '../components/admin/UserManager'

export default function Admin() {
  const { isAdmin }                     = useAuth()
  const [tab, setTab]                   = useState('pending')
  const [pendingCount, setPendingCount] = useState(0)

  if (!isAdmin) return <Navigate to="/" replace />

  const tabs = [
    { value: 'pending', label: 'Pending', count: pendingCount },
    { value: 'clients', label: 'Clients', count: 0 },
    { value: 'users',   label: 'Users',   count: 0 },
  ]

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ background: 'var(--bg)' }}>

      {/* Centered container */}
      <div className="w-full mx-auto" style={{ maxWidth: '800px' }}>

        <div className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>Admin Panel</div>
        <div className="text-xs font-mono mb-6" style={{ color: 'var(--text3)' }}>
          Manage clients, users and access requests
        </div>

        {/* Centered tabs */}
        <div className="flex justify-center mb-6">
          <Tabs tabs={tabs} active={tab} onChange={setTab} noMargin />
        </div>

        {tab === 'pending' && <PendingRequests onCountChange={setPendingCount} />}
        {tab === 'clients' && <ClientManager />}
        {tab === 'users'   && <UserManager />}

      </div>
    </div>
  )
}
