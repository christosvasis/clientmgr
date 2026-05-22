import { initializeApp } from 'firebase/app'
import { getAuth }       from 'firebase/auth'
import { getFirestore }  from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyBJii3XONCMHHDpm9TrqYwHKZ4rJSEb_CI",
  authDomain:        "clientmgr-b66ae.firebaseapp.com",
  projectId:         "clientmgr-b66ae",
  storageBucket:     "clientmgr-b66ae.firebasestorage.app",
  messagingSenderId: "416134439201",
  appId:             "1:416134439201:web:a2482a79088e9ee0d5de60"
}

const app  = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)
