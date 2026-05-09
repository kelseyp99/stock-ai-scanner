import React from 'react'
import Dashboard from './pages/Dashboard'
import Watchlist from './pages/Watchlist'
import History from './pages/History'
import Settings from './pages/Settings'
import OptionsLab from './pages/OptionsLab'
import About from './pages/About'
import Banner from './components/Banner'
import AdminScheduler from './pages/AdminScheduler'

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: string|null}> {
  constructor(props: any) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e: any) { return { error: e?.message || String(e) } }
  componentDidCatch(e: any) { console.error('Page crashed:', e) }
  render() {
    if (this.state.error) return (
      <div className="p-6 text-red-700 bg-red-50 border border-red-200 rounded m-4">
        <strong>Something went wrong on this page:</strong>
        <pre className="mt-2 text-xs whitespace-pre-wrap">{this.state.error}</pre>
        <button className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm" onClick={()=>this.setState({error:null})}>Try again</button>
      </div>
    )
    return this.props.children
  }
}

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
              <button onClick={()=>setView('about')} className="mr-2">About</button>
              {/* admin nav */}
              {true && <button onClick={()=>setView('admin')} className="ml-2">Admin</button>}
            </nav>
          </div>
        </header>
      </div>

      {/* Sponsor banner — sticky at top once header scrolls away */}
      <Banner />

      {/* Main content */}
      <div className="p-6">
        <main>
          <ErrorBoundary key={view}>
            {view === 'dashboard' && <Dashboard />}
            {view === 'watchlist' && <Watchlist />}
            {view === 'history' && <History />}
            {view === 'settings' && <Settings />}
            {view === 'options' && <OptionsLab />}
            {view === 'about' && <About />}
            {view === 'admin' && <AdminScheduler />}
          </ErrorBoundary>
        </main>
      </div>
    </>
  )
}
