import React from 'react'

export default function Banner(){
  const [visible, setVisible] = React.useState(true)
  const lastY = React.useRef<number>(0)
  const rafRef = React.useRef<number| null>(null)
  const height = 84

  React.useEffect(()=>{
    function onScroll(){
      const currentY = window.scrollY || 0
      if(rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(()=>{
        if(currentY < 0) return
        const delta = currentY - lastY.current
        // when scrolling down hide, when up show (with small deadzone)
        if(delta > 10) setVisible(false)
        else if(delta < -10) setVisible(true)
        lastY.current = currentY
      })
    }
    window.addEventListener('scroll', onScroll, {passive:true})
    return ()=>{
      window.removeEventListener('scroll', onScroll)
      if(rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  },[])

  return (
    <div
      role="banner"
      aria-hidden={!visible}
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        transform: visible ? 'translateY(0)' : `translateY(-${height}px)`,
        transition: 'transform 260ms ease',
        zIndex: 60,
        pointerEvents: 'auto',
        // ensure it keeps its space so header can scroll under it
        marginTop: 0
      }}
    >
      <div style={{
        margin: '0 auto',
        maxWidth: 1400,
        padding: '10px 18px',
        background: 'linear-gradient(90deg, #fffbe6 0%, #f7c873 100%)',
        borderBottom: '2px solid #f7c873',
        borderRadius: 8,
        boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <strong style={{fontSize:16, color:'#1a4d7a'}}>ThetaForge Demo</strong>
          <span style={{fontSize:13, color:'#155e75'}}>Static demo using preloaded market scans — no live data.</span>
        </div>
        <div style={{fontSize:13}}>
          <a href="/" style={{color:'#1f6feb', textDecoration:'underline', marginRight:12}}>Home</a>
          <a href="/about" style={{color:'#1f6feb', textDecoration:'underline'}}>About</a>
        </div>
      </div>
    </div>
  )
}
