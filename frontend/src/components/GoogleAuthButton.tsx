import React from 'react'

export default function GoogleAuthButton({onSignIn}:{onSignIn?:()=>void}){
  return (
    <button
      onClick={()=> onSignIn ? onSignIn() : alert('Sign-in flow not configured in demo')}
      style={{
        padding: '10px 18px',
        background: '#1f6feb',
        color: '#fff',
        border: 'none',
        borderRadius: 10,
        fontWeight: 700,
        boxShadow: '0 4px 12px rgba(31,111,235,0.18)'
      }}
    >
      Sign in
    </button>
  )
}
