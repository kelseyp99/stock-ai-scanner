import React from 'react'
import api from '../services/api'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

type Story = Record<string, any> & { id: number; title: string }
type Event = Record<string, any> & { event_id: string }

function list(value: any): any[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function readable(value: any): string {
  if (value == null || value === '') return 'Not reported'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return JSON.stringify(value, null, 2)
}

function displayDate(value: any): string {
  if (!value) return 'Date not reported'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString()
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">{title}</h3>
      {children}
    </section>
  )
}

function Detail({ story, onBack }: { story: Story; onBack: () => void }) {
  const events = list(story.timeline) as Event[]
  const sources = list(story.source_urls)
  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="text-sm font-bold text-blue-700 hover:underline">← All watched stories</button>
      <header className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{story.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{story.summary || story.why_watching}</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-amber-800">{String(story.status || 'watching').replaceAll('_', ' ')}</span>
        </div>
        <p className="mt-4 text-xs text-slate-500">Current research status: <strong>{story.research_status || 'none'}</strong></p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Observed facts">
          <div className="space-y-4">
            {events.length === 0 && <p className="text-sm text-slate-500">No source events are linked to this story yet.</p>}
            {events.map((event) => (
              <article key={event.event_id} className="border-l-2 border-blue-200 pl-4">
                <p className="text-xs font-bold uppercase text-slate-400">{event.event_type || 'Event'} · {displayDate(event.event_date)}</p>
                <h4 className="mt-1 font-bold text-slate-800">{event.headline || 'Untitled source event'}</h4>
                {event.summary && <p className="mt-1 text-sm text-slate-600">{event.summary}</p>}
                {list(event.public_document_ids).length > 0 && <p className="mt-2 text-xs text-slate-500">Public document IDs: {list(event.public_document_ids).join(', ')}</p>}
                {list(event.evidence).map((evidence, index) => (
                  <blockquote key={index} className="mt-2 rounded bg-slate-50 p-3 text-sm text-slate-700">
                    {evidence?.quote || evidence?.text || readable(evidence)}
                  </blockquote>
                ))}
                {list(event.source_urls).map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-xs font-semibold text-blue-700 underline">Official source: {url}</a>
                ))}
              </article>
            ))}
            {sources.length > 0 && events.length === 0 && sources.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="block break-all text-sm text-blue-700 underline">{url}</a>)}
          </div>
        </Section>

        <div className="space-y-4">
          <Section title="Calculated materiality">
            {list(story.calculated_materiality).length ? list(story.calculated_materiality).map((item) => (
              <pre key={item.event_id} className="mb-3 overflow-x-auto whitespace-pre-wrap text-xs text-slate-700">{readable(item.calculation)}</pre>
            )) : <p className="text-sm text-slate-500">No materiality calculation is available for linked events.</p>}
            <p className="mt-2 text-sm text-slate-600">Cumulative known value: {story.cumulative_explicit_value == null ? 'Not reported' : `${story.cumulative_value_unit || 'USD'} ${Number(story.cumulative_explicit_value).toLocaleString()}`}</p>
          </Section>
          <Section title="ThetaBrew interpretation">
            <p className="text-sm text-slate-700">{story.why_watching || 'No monitoring rationale recorded.'}</p>
            {story.investment_relevance && <pre className="mt-3 whitespace-pre-wrap text-xs text-slate-600">{readable(story.investment_relevance)}</pre>}
            {story.aggregate && <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-slate-600">{readable(story.aggregate)}</pre>}
            <p className="mt-3 text-xs text-slate-600">Companies and entities: {readable(story.companies || story.entities)}</p>
            <p className="mt-2 text-xs text-slate-600">Company resolution: {readable(story.company_resolution)}</p>
            <p className="mt-2 text-xs text-slate-600">Escalation conditions: {readable(story.escalation_conditions)}</p>
            <p className="mt-2 text-xs text-slate-600">De-escalation rationale: {story.deescalation_rationale || 'Not recorded'}</p>
            <p className="mt-2 text-xs text-slate-600">De-escalation conditions: {readable(story.deescalation_conditions)}</p>
          </Section>
        </div>
      </div>

      <Section title="Unknown / missing information">
        <p className="mb-3 text-sm text-slate-600">Disclosure status and unresolved source details remain explicitly unverified.</p>
        {list(story.unknown_or_missing).length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{list(story.unknown_or_missing).map((item) => <li key={item.event_id}>{item.event_id}: review {item.review_state || 'unknown'}, disclosure {item.disclosure_classification || 'unknown'}, company {item.company_resolution || 'unresolved'}</li>)}</ul>
        ) : <p className="text-sm text-slate-500">No additional missing fields were identified.</p>}
        {list(story.disclosure_status).map((item) => <p key={item.event_id} className="mt-2 text-xs text-slate-500">{item.event_id}: disclosure {item.classification || 'unknown'}</p>)}
      </Section>
    </div>
  )
}

export default function StoriesWatching() {
  const [stories, setStories] = React.useState<Story[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [selected, setSelected] = React.useState<Story | null>(null)
  const [detail, setDetail] = React.useState<Story | null>(null)
  const [detailLoading, setDetailLoading] = React.useState(false)

  React.useEffect(() => {
    if (DEMO_MODE) {
      setLoading(false)
      return
    }
    let active = true
    api.get('/research/stories').then(({ data }) => {
      if (active) setStories(Array.isArray(data) ? data : [])
    }).catch(() => {
      if (active) setError('Stories could not be loaded. Check that the local ThetaBrew backend is running.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  React.useEffect(() => {
    if (!selected) return
    let active = true
    setDetail(null)
    setDetailLoading(true)
    api.get(`/research/stories/${selected.id}`).then(({ data }) => {
      if (active) setDetail(data)
    }).catch(() => {
      if (active) setError('Story details could not be loaded.')
    }).finally(() => { if (active) setDetailLoading(false) })
    return () => { active = false }
  }, [selected])

  if (loading) return <div className="py-20 text-center text-sm text-slate-500">Loading watched stories…</div>
  if (selected) {
    if (detailLoading) return <div className="py-20 text-center text-sm text-slate-500">Loading story details…</div>
    return detail ? <Detail story={detail} onBack={() => { setSelected(null); setDetail(null); setError('') }} /> : <div role="alert" className="py-10 text-sm text-red-700">{error || 'Story details could not be loaded.'}</div>
  }

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-black text-slate-900">Stories We're Watching</h2>
        <p className="mt-1 text-sm text-slate-500">Promoted public-record developments ThetaBrew is monitoring.</p>
      </header>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {stories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-bold text-slate-700">
            {DEMO_MODE ? 'Stories are unavailable in the static demo.' : 'No investment-monitoring stories are currently being followed.'}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {DEMO_MODE ? 'Open the live ThetaBrew app to load stories from the backend.' : 'Promoted stories will appear here with their source timeline and monitoring status.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {stories.map((story) => (
            <button key={story.id} type="button" onClick={() => { setError(''); setSelected(story) }} className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-amber-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-black text-slate-900">{story.title}</h3>
                <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-800">{String(story.status || 'watching').replaceAll('_', ' ')}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{story.why_watching || story.summary || 'Monitoring rationale not recorded.'}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <span>Geography: {readable(story.geography)}</span>
                <span>{story.related_event_count || 0} related event(s)</span>
                <span>Value: {story.cumulative_explicit_value == null ? 'Not reported' : `${story.cumulative_value_unit || 'USD'} ${Number(story.cumulative_explicit_value).toLocaleString()}`}</span>
                <span>Research: {story.research_status || 'none'}</span>
                <span className="col-span-2">Companies: {readable(story.companies)}</span>
                <span className="col-span-2">Public-company mapping: {story.confirmed_public_company ? 'Confirmed' : 'No confirmed mapping'}</span>
                {list(story.event_types).length > 0 && <span className="col-span-2">Event types: {list(story.event_types).join(', ')}</span>}
                <span className="col-span-2">Most recent development: {displayDate(story.last_event_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
