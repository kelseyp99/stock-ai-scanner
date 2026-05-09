import React from 'react'
import Dashboard from './pages/Dashboard'
import Watchlist from './pages/Watchlist'
import History from './pages/History'
import Settings from './pages/Settings'
import OptionsLab from './pages/OptionsLab'
import Banner from './components/Banner'

export default function App(){
  const [view, setView] = React.useState('dashboard')
  const logoHeight = 360
  const logoMaxHeight = 420
  const headerHeight = 120

  return (
    <>
      {/* Header — scrolls away naturally */}
      <div style={{paddingTop: 10}}>
        <header style={{display:'flex', alignItems:'center', justifyContent:'space-between', height: headerHeight, padding: '0 24px', marginBottom:0, overflow:'visible', position:'relative'}}>
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
              <button onClick={()=>setView('options')}>Options Lab</button>
            </nav>
          </div>
        </header>
      </div>

      {/* Sponsor banner — sticky at top once header scrolls away */}
      <Banner />

      {/* Main content */}
      <div className="p-6">
        <main>
          {view === 'dashboard' && <Dashboard />}
          {view === 'watchlist' && <Watchlist />}
          {view === 'history' && <History />}
          {view === 'settings' && <Settings />}
          {view === 'options' && <OptionsLab />}
        </main>
      </div>
    </>
  )
}
