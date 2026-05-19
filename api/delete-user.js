import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const adminAuth = getAuth();
const db        = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify the requester is an admin
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || !userDoc.data().isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Prevent admin from deleting themselves
    const { uid } = req.body;
    if (decoded.uid === uid) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: 'uid is required' });

  try {
    await adminAuth.deleteUser(uid);
    await db.collection('users').doc(uid).delete();
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
}
