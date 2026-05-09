import React from 'react'
import Dashboard from './pages/Dashboard'
import Watchlist from './pages/Watchlist'
import History from './pages/History'
import Settings from './pages/Settings'
import OptionsLab from './pages/OptionsLab'
import About from './pages/About'
import Header from './components/Header'
import Banner from './components/Banner'

export default function App(){
  const [view, setView] = React.useState('dashboard')

  return (
    <div className="p-6">
      <Banner />
      <Header />

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
