import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig'

let app: FirebaseApp | null = null
let auth: Auth | null = null
let analytics: Analytics | null = null
let analyticsStarted = false

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null
  if (!app) {
    app = getApps()[0] || initializeApp(firebaseConfig)
  }
  return app
}

export function getFirebaseAuth(): Auth | null {
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) return null
  if (!auth) {
    auth = getAuth(firebaseApp)
  }
  return auth
}

export async function initFirebaseAnalytics(): Promise<Analytics | null> {
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp || !firebaseConfig.measurementId || analyticsStarted) return analytics

  analyticsStarted = true
  try {
    if (await isSupported()) {
      analytics = getAnalytics(firebaseApp)
    }
  } catch {
    analytics = null
  }
  return analytics
}
