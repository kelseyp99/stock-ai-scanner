import React from 'react'

export default function About(){
  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">About ThetaForge</h2>
      <p className="text-sm text-gray-600 max-w-3xl">
        ThetaForge is a demo market scanning experience built to illustrate how a modern AI-powered dashboard can surface high-conviction ideas across equities and options. It is designed as a static demo so the site can be hosted safely without relying on live backend systems.
      </p>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">What you can do here</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
          <li>View curated market scan results and strength scores.</li>
          <li>Browse a watchlist of opportunity candidates.</li>
          <li>Review recent scan history and summary metrics.</li>
          <li>Experiment with the Options Lab and settings for a smarter workflow.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">How this demo works</h3>
        <p className="text-sm text-gray-700">
          In demo mode, the application uses preloaded sample data and visualizations instead of calling a live backend. This keeps the experience fast, repeatable, and safe for showcasing the product.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Built with</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <strong>Frontend</strong>
            <ul className="list-disc list-inside mt-2">
              <li>Vite</li>
              <li>React</li>
              <li>TypeScript</li>
              <li>Tailwind CSS</li>
            </ul>
          </div>
          <div>
            <strong>Hosting</strong>
            <ul className="list-disc list-inside mt-2">
              <li>Firebase Hosting</li>
              <li>Static demo build</li>
              <li>Client-side navigation</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
