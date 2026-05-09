import React from 'react'
import Dashboard from './pages/Dashboard'
import Watchlist from './pages/Watchlist'
import History from './pages/History'
import Settings from './pages/Settings'
import OptionsLab from './pages/OptionsLab'
import About from './pages/About'

export default function App(){
  const [view, setView] = React.useState('dashboard')
  const logoHeight = 360
  const logoMaxHeight = 420
  const headerHeight = 120

  return (
    <div className="p-6">
      {/* Keep the logo large but shrink the header bar itself. */}
      <header style={{display:'flex', alignItems:'center', justifyContent:'space-between', height: headerHeight, padding: 0, marginBottom:12, overflow:'visible', position:'relative'}}>
        <div style={{display:'flex', alignItems:'center', position:'relative', height: '100%'}}>
          <div style={{display:'inline-block', marginRight:16, position:'relative', zIndex:1}}>
            <img
              src="/theta-forge.png"
              alt="ThetaForge"
              style={{height: logoHeight, maxHeight: logoMaxHeight, width:'auto', display:'block'}}
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement
                img.onerror = null
                img.src = '/theta-forge.svg'
              }}
            />
          </div>
        </div>

        <div style={{flex:'1 1 auto', display:'flex', justifyContent:'flex-end', alignItems:'center', height: '100%'}}>
          <nav aria-label="Main navigation" style={{display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', height: '100%'}}>
            <button onClick={()=>setView('dashboard')} className="mr-2">Dashboard</button>
            <button onClick={()=>setView('watchlist')} className="mr-2">Watchlist</button>
            <button onClick={()=>setView('history')} className="mr-2">History</button>
            <button onClick={()=>setView('settings')} className="mr-2">Settings</button>
            <button onClick={()=>setView('options')} className="mr-2">Options Lab</button>
            <button onClick={()=>setView('about')}>About</button>
          </nav>
        </div>
      </header>

      <main>
        {view === 'dashboard' && <Dashboard />}
        {view === 'watchlist' && <Watchlist />}
        {view === 'history' && <History />}
        {view === 'settings' && <Settings />}
        {view === 'options' && <OptionsLab />}
        {view === 'about' && <About />}
      </main>
    </div>
  )
}
