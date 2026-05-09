import React from 'react'
import SchedulerSettings from '../components/SchedulerSettings'
import OptionsLab from './OptionsLab'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export default function Settings(){
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Settings</h2>
      {DEMO_MODE ? (
        <div className="mt-4 text-sm text-gray-600">Some features are disabled in static demo mode.</div>
      ) : (
        <div className="mt-4 text-sm text-gray-600">Scheduler and AI settings are available here.</div>
      )}

      {/* Hide scheduler controls in demo mode */}
      {!DEMO_MODE && (
        <div className="mt-6">
          <SchedulerSettings />
          <OptionsLab />
        </div>
      )}
    </div>
  )
}
