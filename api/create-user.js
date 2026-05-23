import { adminAuth, db } from './_firebase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.split('Bearer ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (!userDoc.exists || !userDoc.data().isAdmin) return res.status(403).json({ error: 'Forbidden' })
  } catch { return res.status(401).json({ error: 'Invalid token' }) }
  const { email, password, isAdmin = false, isPowerUser = false } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
  try {
    const newUser = await adminAuth.createUser({ email, password })
    await db.collection('users').doc(newUser.uid).set({
      email, isAdmin, isPowerUser, status: 'approved', createdAt: new Date().toISOString(),
    })
    return res.status(200).json({ uid: newUser.uid, email })
  } catch (e) {
    if (e.code === 'auth/email-already-exists') return res.status(400).json({ error: 'A user with this email already exists.' })
    if (e.code === 'auth/invalid-password') return res.status(400).json({ error: 'Password must be at least 6 characters.' })
    return res.status(500).json({ error: 'Failed to create user.' })
  }
}
