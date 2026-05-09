import React from 'react'
import Dashboard from './pages/Dashboard'
import Watchlist from './pages/Watchlist'
import History from './pages/History'
import Settings from './pages/Settings'
import OptionsLab from './pages/OptionsLab'

export default function App(){
  const [view, setView] = React.useState('dashboard')
  return (
    <div className="p-6">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">stock-ai-scanner</h1>
        <nav>
          <button onClick={()=>setView('dashboard')} className="mr-2">Dashboard</button>
          <button onClick={()=>setView('watchlist')} className="mr-2">Watchlist</button>
          <button onClick={()=>setView('history')} className="mr-2">History</button>
          <button onClick={()=>setView('settings')} className="mr-2">Settings</button>
          <button onClick={()=>setView('options')}>Options Lab</button>
        </nav>
      </header>
      <main>
        {view === 'dashboard' && <Dashboard />}
        {view === 'watchlist' && <Watchlist />}
        {view === 'history' && <History />}
        {view === 'settings' && <Settings />}
        {view === 'options' && <OptionsLab />}
      </main>
    </div>
  )
}
