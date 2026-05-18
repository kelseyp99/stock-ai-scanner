import React from 'react'
import type { User } from 'firebase/auth'
import { getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'
import { getFirebaseAuth, googleProvider, initFirebaseAnalytics } from '../firebase/firebaseApp'
import { isFirebaseConfigured } from '../firebase/firebaseConfig'

interface AuthCtx {
  user: User | null
  loading: boolean
  error: string | null
  configured: boolean
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = React.createContext<AuthCtx>({
  user: null,
  loading: false,
  error: null,
  configured: false,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
})

async function ensureUserProfile(nextUser: User) {
  const app = getFirebaseAuth()?.app
  if (!app) return
  const db = getFirestore(app)
  await setDoc(
    doc(db, 'users', nextUser.uid),
    {
      email: nextUser.email || '',
      displayName: nextUser.displayName || '',
      photoURL: nextUser.photoURL || '',
      lastLoginAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(isFirebaseConfigured)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    initFirebaseAnalytics()
    const auth = getFirebaseAuth()
    if (!auth) {
      setLoading(false)
      return undefined
    }

    getRedirectResult(auth).catch((authError) => {
      setError(authError?.message || 'Google redirect sign-in failed.')
    })

    return onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser)
        setLoading(false)
        if (nextUser) {
          ensureUserProfile(nextUser).catch((profileError) => {
            setError(profileError?.message || 'Signed in, but user profile setup failed.')
          })
        }
      },
      (authError) => {
        setError(authError.message)
        setLoading(false)
      },
    )
  }, [])

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth()
    if (!auth) {
      setError('Firebase is not configured yet.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (authError: any) {
      const code = authError?.code || ''
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          await signInWithRedirect(auth, googleProvider)
          return
        } catch (redirectError: any) {
          setError(redirectError?.message || 'Google redirect sign-in failed.')
        }
      } else {
        setError(authError?.message || 'Google sign-in failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  const signOutUser = async () => {
    const auth = getFirebaseAuth()
    if (!auth) return
    setError(null)
    try {
      await signOut(auth)
    } catch (authError: any) {
      setError(authError?.message || 'Sign-out failed.')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        configured: isFirebaseConfigured,
        signInWithGoogle,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return React.useContext(AuthContext)
}
