/** @vitest-environment jsdom */
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../services/api'
import StoriesWatching from './StoriesWatching'

vi.mock('../services/api', () => ({ default: { get: vi.fn() } }))

const get = vi.mocked(api.get)

afterEach(cleanup)

beforeEach(() => get.mockReset())

describe('StoriesWatching', () => {
  it('shows the requested empty state', async () => {
    get.mockResolvedValue({ data: [] } as any)
    render(<StoriesWatching />)

    expect(await screen.findByText('No investment-monitoring stories are currently being followed.')).toBeTruthy()
  })

  it('renders a story card and loads its event detail with source evidence', async () => {
    get.mockImplementation((url: any) => {
      if (url === '/research/stories') {
        return Promise.resolve({ data: [{
          id: 7,
          title: 'Reactor site award',
          status: 'emerging',
          why_watching: 'Two public notices describe expansion.',
          geography: ['Ohio'],
          related_event_count: 2,
          cumulative_explicit_value: 4000000,
          cumulative_value_unit: 'USD',
          companies: [{ name: 'Example Corp' }],
          research_status: 'research_candidate',
          last_event_at: '2026-09-20',
        }] }) as any
      }
      return Promise.resolve({ data: {
        id: 7,
        title: 'Reactor site award',
        status: 'emerging',
        why_watching: 'Two public notices describe expansion.',
        research_status: 'research_candidate',
        cumulative_explicit_value: 4000000,
        cumulative_value_unit: 'USD',
        timeline: [{
          event_id: 'evt-7', event_type: 'contract_award', event_date: '2026-09-20',
          headline: 'Agency posts site award', summary: 'Expansion notice.',
          evidence: [{ quote: 'Work begins in October.' }],
          source_urls: ['https://agency.gov/award'], public_document_ids: ['award-7'],
        }],
        calculated_materiality: [], company_resolution: [], disclosure_status: [], unknown_or_missing: [],
      } }) as any
    })

    render(<StoriesWatching />)
    fireEvent.click(await screen.findByRole('button', { name: /Reactor site award/i }))

    expect(await screen.findByText('Observed facts')).toBeTruthy()
    expect(screen.getByText('Work begins in October.')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Official source: https:\/\/agency.gov\/award/ })).toBeTruthy()
    expect(get).toHaveBeenCalledWith('/research/stories/7')
  })
})
