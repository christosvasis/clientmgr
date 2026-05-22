import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth }                       from 'firebase-admin/auth'
import { getFirestore }                  from 'firebase-admin/firestore'

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) })
}

const adminAuth = getAuth()
const db        = getFirestore()

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.split('Bearer ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (!userDoc.exists || !userDoc.data().isAdmin) return res.status(403).json({ error: 'Forbidden' })
  } catch { return res.status(401).json({ error: 'Invalid token' }) }
  try {
    const snap  = await db.collection('users').get()
    const users = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
    return res.status(200).json({ users })
  } catch { return res.status(500).json({ error: 'Failed to fetch users.' }) }
}
