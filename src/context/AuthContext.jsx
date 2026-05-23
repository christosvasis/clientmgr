import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // user:    undefined = auth not resolved, null = logged out, object = signed in
  // profile: undefined = loading, null = no Firestore doc, object = loaded
  const [user, setUser] = useState(undefined)
  const [profile, setProfile] = useState(undefined)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async firebaseUser => {
      if (!firebaseUser) {
        setUser(null)
        setProfile(null)
        return
      }
      setUser(firebaseUser)
      setProfile(undefined)
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        setProfile(snap.exists() ? snap.data() : null)
      } catch {
        setProfile(null)
      }
    })
    return unsub
  }, [])

  const isAdmin = profile?.isAdmin === true
  const isPowerUser = profile?.isPowerUser === true
  // Approved only when a profile doc actually exists. A missing `status` field is
  // treated as approved for legacy docs, but a missing doc (null) fails closed.
  const isApproved = !!profile && (profile.status === 'approved' || profile.status === undefined)
  const loading = user === undefined || (user !== null && profile === undefined)

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, isPowerUser, isApproved, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
