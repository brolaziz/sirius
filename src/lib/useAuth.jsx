import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile as fbUpdateProfile,
  signOut as fbSignOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider, isFirebaseConfigured } from './firebase'

const AuthCtx = createContext(null)

const ERR = {
  'auth/invalid-credential': 'auth.err.invalid',
  'auth/wrong-password': 'auth.err.invalid',
  'auth/user-not-found': 'auth.err.invalid',
  'auth/email-already-in-use': 'auth.err.inUse',
  'auth/weak-password': 'auth.err.weak',
  'auth/invalid-email': 'auth.err.badEmail',
  'auth/network-request-failed': 'auth.err.network',
  'auth/popup-closed-by-user': 'auth.err.popup',
  'auth/cancelled-popup-request': 'auth.err.popup',
}
// Callers get an i18n key, never a raw Firebase string.
export const authErrorKey = (e) => ERR[e?.code] || 'auth.err.generic'

const DEFAULT_PROFILE = {
  lang: 'uz',
  grade: null,
  gpa: null,
  targetScore: null,
  predictedScore: null,
  countries: [],
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (!u) { setProfile(null); setLoading(false); return }
      try {
        const ref = doc(db, 'users', u.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setProfile(snap.data())
        } else {
          const fresh = {
            ...DEFAULT_PROFILE,
            displayName: u.displayName || '',
            email: u.email || '',
            createdAt: serverTimestamp(),
          }
          await setDoc(ref, fresh)
          setProfile(fresh)
        }
      } catch (err) {
        console.error('[sirius] profile load failed', err)
        setProfile({ ...DEFAULT_PROFILE, displayName: u.displayName || '', email: u.email || '' })
      }
      setLoading(false)
    })
  }, [])

  const patchProfile = useCallback(async (patch) => {
    setProfile((p) => ({ ...(p || DEFAULT_PROFILE), ...patch }))
    if (!isFirebaseConfigured || !auth.currentUser) return
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), patch)
    } catch (err) {
      console.error('[sirius] profile save failed', err)
    }
  }, [])

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    patchProfile,
    signInEmail: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signUpEmail: async (email, password, name) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (name) await fbUpdateProfile(cred.user, { displayName: name })
      return cred
    },
    signInGoogle: () => signInWithPopup(auth, googleProvider),
    signOut: () => fbSignOut(auth),
  }), [user, profile, loading, patchProfile])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
