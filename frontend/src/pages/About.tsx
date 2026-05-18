import React from 'react'

export default function About(){
  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">About ThetaBrew</h2>
      <p className="text-sm text-gray-600 max-w-3xl">
        ThetaBrew is a market scanning dashboard for surfacing stock, ETF, commodity, and large-cap crypto ideas with technical signals, fundamentals, news context, options strategy notes, and disclosure-based confirmation signals. The public site is built as a static Firebase-hosted snapshot, refreshed from scanner output instead of requiring a live database connection.
      </p>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">What you can do here</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
          <li>Review ranked stock picks with scores, categories, explanations, fundamentals, exchange labels, company names, and recent news.</li>
          <li>Browse ETF recommendations on a separate page with ETF-aware scoring, themes, relative strength, volatility, and options strategy notes.</li>
          <li>Review commodity proxy scans across metals, energy, agriculture, and broad baskets with commodity-aware risk notes.</li>
          <li>Review large-cap crypto analysis with market cap rank, momentum windows, volume intensity, ATH distance, and position strategy notes.</li>
          <li>Use the Watchlist to keep track of interesting candidates while comparing scanner output.</li>
          <li>Check institutional 13F activity for delayed ownership changes, notable managers, new positions, and recent buying or selling context.</li>
          <li>Check congressional trading disclosures for recent buy/sell activity tied to public STOCK Act filings.</li>
          <li>Experiment with the Options Lab to frame defined-risk strategies around scanner candidates.</li>
          <li>Use Google sign-in and the Admin area for settings and scheduler controls.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">How the scanner works</h3>
        <p className="text-sm text-gray-700">
          The nightly workflow scans configured stock indexes, ETF universes, commodity proxy funds, and large-cap crypto markets, writes the latest ranked output, builds a static frontend payload, and deploys that snapshot to Firebase Hosting. The same scan data can also be served by the FastAPI backend during local development.
        </p>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
          <li>Stock scans combine technical setup, relative strength, volatility, trend, news, fundamentals, and optional disclosure context.</li>
          <li>ETF scans reuse the same technical engine with ETF-specific metadata and strategy selection.</li>
          <li>Commodity scans reuse the same technical engine with group metadata for metals, energy, agriculture, and broad baskets.</li>
          <li>Crypto scans use market data snapshots to rank liquid assets by momentum, volume, volatility, market cap rank, and distance from all-time high.</li>
          <li>13F and congressional data are treated as supporting signals because filings are delayed and should not be hard requirements.</li>
          <li>The deployed site shows the scan run date so readers can see when the snapshot was generated.</li>
        </ul>
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
            <strong>Backend and data</strong>
            <ul className="list-disc list-inside mt-2">
              <li>Python scanner services</li>
              <li>FastAPI endpoints</li>
              <li>Static JSON payload generation</li>
              <li>Firebase Hosting deploy scripts</li>
            </ul>
          </div>
          <div>
            <strong>Signals</strong>
            <ul className="list-disc list-inside mt-2">
              <li>Technical and relative-strength scans</li>
              <li>Fundamental fields such as earnings and dividend yield</li>
              <li>News summaries</li>
              <li>Commodity proxy analysis</li>
              <li>Large-cap crypto market analysis</li>
              <li>13F institutional activity</li>
              <li>Congressional disclosure activity</li>
            </ul>
          </div>
          <div>
            <strong>Hosting and access</strong>
            <ul className="list-disc list-inside mt-2">
              <li>Firebase Hosting</li>
              <li>Static demo build</li>
              <li>Client-side navigation</li>
              <li>Firebase Google authentication</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
