import React from 'react'
import SchedulerSettings from '../components/SchedulerSettings'
import OptionsLab from '../components/OptionsLab'

export default function Settings(){
  return (
    <div>
      <h2 className="text-xl">Settings</h2>
      <p>Firebase and app settings.</p>
      <div className="mt-6">
        <SchedulerSettings />
        <OptionsLab />
      </div>
    </div>
  )
}
