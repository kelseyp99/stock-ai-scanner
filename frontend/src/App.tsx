import React from 'react'
import Dashboard from './pages/Dashboard'
import Watchlist from './pages/Watchlist'
import Settings from './pages/Settings'
import OptionsLab from './pages/OptionsLab'
import EtfDashboard from './pages/EtfDashboard'
import CryptoDashboard from './pages/CryptoDashboard'
import ReflagOpportunities from './pages/ReflagOpportunities'
import About from './pages/About'
import InstitutionalActivity from './pages/InstitutionalActivity'
import CongressionalActivity from './pages/CongressionalActivity'
import Banner from './components/Banner'
import AdminScheduler from './pages/AdminScheduler'
import { WatchlistProvider } from './context/WatchlistContext'
import { AuthProvider } from './context/AuthContext'
import GoogleAuthButton from './components/GoogleAuthButton'

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
  // WatchlistProvider wraps everything so all pages share the same watchlist state
  const [view, setView] = React.useState('dashboard')
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)

  const changeView = (nextView: string) => {
    setView(nextView)
    setMobileNavOpen(false)
  }

  return (
    <AuthProvider>
      <WatchlistProvider>
        {/* Header — scrolls away naturally */}
        <div className="app-header-wrap">
          <header className="app-header">
            <div className="app-header-brand">
              <div className="app-logo-frame">
                <img
                  src="/ThetaBrew.png"
                  alt="ThetaForge"
                  className="app-logo"
                />
              </div>
            </div>

            <div className="app-nav-wrap">
              <button
                type="button"
                className="app-menu-button"
                aria-label="Open navigation menu"
                aria-expanded={mobileNavOpen}
                aria-controls="app-main-nav"
                onClick={() => setMobileNavOpen((open) => !open)}
              >
                <span />
                <span />
                <span />
              </button>
              <nav
                id="app-main-nav"
                aria-label="Main navigation"
                className={`app-nav ${mobileNavOpen ? 'is-open' : ''}`}
              >
                <button onClick={()=>changeView('etfs')} className="mr-2">ETFs</button>
                <button onClick={()=>changeView('dashboard')} className="mr-2">Stocks</button>
                <button onClick={()=>changeView('crypto')} className="mr-2">Crypto</button>
                <button onClick={()=>changeView('reflags')} className="mr-2">Re-Flags</button>
                <button onClick={()=>changeView('watchlist')} className="mr-2">Watchlist</button>
                <button onClick={()=>changeView('institutional')} className="mr-2">Institutions</button>
                <button onClick={()=>changeView('congress')} className="mr-2">Congress</button>
                <button onClick={()=>changeView('options')}>Options Lab</button>
                <button onClick={()=>changeView('about')} className="mr-2">About</button>
                <GoogleAuthButton />
                {/* admin nav */}
                {true && <button onClick={()=>changeView('admin')} className="ml-2">Admin</button>}
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
              {view === 'institutional' && <InstitutionalActivity />}
              {view === 'congress' && <CongressionalActivity />}
              {view === 'etfs' && <EtfDashboard />}
              {view === 'crypto' && <CryptoDashboard />}
              {view === 'reflags' && <ReflagOpportunities />}
              {view === 'options' && <OptionsLab />}
              {view === 'about' && <About />}
              {view === 'admin' && (
                <div className="space-y-8">
                  <Settings />
                  <AdminScheduler />
                </div>
              )}
            </ErrorBoundary>
          </main>
        </div>
      </WatchlistProvider>
    </AuthProvider>
  )
}
