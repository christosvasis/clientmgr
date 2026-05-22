import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged }                            from 'firebase/auth'
import { doc, getDoc }                                   from 'firebase/firestore'
import { auth, db }                                      from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async firebaseUser => {
      if (!firebaseUser) {
        setUser(null)
        setProfile(null)
        return
      }
      setUser(firebaseUser)
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        setProfile(snap.exists() ? snap.data() : null)
      } catch {
        setProfile(null)
      }
    })
    return unsub
  }, [])

  const isAdmin     = profile?.isAdmin     === true
  const isPowerUser = profile?.isPowerUser === true
  const isApproved  = profile?.status === 'approved' || profile?.status === undefined

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, isPowerUser, isApproved }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
