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

  const label = loading ? 'Checking...' : user ? 'Sign out' : 'Sign in'
  const title = user?.email ? `Signed in as ${user.email}` : error || 'Sign in with Google'

  return (
    <button
      type="button"
      className="google-auth-button"
      disabled={loading}
      title={title}
      onClick={() => user ? signOutUser() : signInWithGoogle()}
    >
      {user?.photoURL && <img src={user.photoURL} alt="" />}
      <span>{label}</span>
    </button>
  )
}
