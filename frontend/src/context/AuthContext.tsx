import React from 'react'
import type { User } from 'firebase/auth'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
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

    return onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser)
        setLoading(false)
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
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (authError: any) {
      setError(authError?.message || 'Google sign-in failed.')
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
