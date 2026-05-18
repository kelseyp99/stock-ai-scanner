import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function GoogleAuthButton(){
  const { user, loading, error, configured, signInWithGoogle, signOutUser } = useAuth()

  if (!configured) {
    return (
      <button type="button" className="google-auth-button is-disabled" disabled title="Add Firebase Vite env vars to enable Google sign-in">
        Auth setup
      </button>
    )
  }

  const signedInName = user?.displayName || user?.email || ''
  const label = loading ? 'Checking...' : user ? 'Sign out' : 'Sign in'
  const title = user?.email ? `Signed in as ${user.email}` : error || 'Sign in with Google'

  return (
    <span className="google-auth-wrap">
      <button
        type="button"
        className="google-auth-button"
        disabled={loading}
        title={title}
        onClick={() => user ? signOutUser() : signInWithGoogle()}
      >
        {user?.photoURL && <img src={user.photoURL} alt="" />}
        {user ? (
          <span className="google-auth-copy">
            <span className="google-auth-status">Signed in as</span>
            <span className="google-auth-user">{signedInName}</span>
            <span className="google-auth-action">{label}</span>
          </span>
        ) : (
          <span>{label}</span>
        )}
      </button>
      {error && !user && (
        <span className="google-auth-error" title={error}>
          {error}
        </span>
      )}
    </span>
  )
}
