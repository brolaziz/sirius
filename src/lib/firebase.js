// Firebase web config is PUBLIC by design (it identifies the project, it does not
// authorize anything). Access control lives in Firestore security rules.
// Anything labelled "secret" or "service account" belongs in functions/, never here.
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const cfg = {
  apiKey:            import.meta.env.VITE_FB_API_KEY,
  authDomain:        import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FB_APP_ID,
}

export const isFirebaseConfigured = Boolean(cfg.apiKey && cfg.projectId && cfg.appId)

let app = null
let auth = null
let db = null

if (isFirebaseConfigured) {
  app = initializeApp(cfg)
  auth = getAuth(app)
  db = getFirestore(app)
} else {
  // Keeps the UI walkable before creds land instead of white-screening on boot.
  console.warn('[sirius] Firebase env vars missing — auth and Firestore are disabled. Copy .env.example to .env.local.')
}

export { app, auth, db }
export const googleProvider = new GoogleAuthProvider()
