import { describe, expect, it } from 'vitest'
import { resolveApiBaseUrl } from './apiBaseUrl'

describe('resolveApiBaseUrl', () => {
  it('uses the local ThetaBrew backend in development by default', () => {
    expect(resolveApiBaseUrl({ demoMode: false, isDev: true })).toBe('http://127.0.0.1:8002')
  })

  it('honors an explicit environment URL for non-local deployments', () => {
    expect(resolveApiBaseUrl({ demoMode: false, isDev: false, configuredBaseUrl: 'https://api.example.test/' }))
      .toBe('https://api.example.test')
  })

  it('does not fall back to a localhost URL in production', () => {
    expect(resolveApiBaseUrl({ demoMode: false, isDev: false })).toBe('')
  })

  it('keeps demo mode on same-origin requests', () => {
    expect(resolveApiBaseUrl({ demoMode: true, isDev: true })).toBe('')
  })
})
