import React from 'react'
import { createPortal } from 'react-dom'
import tripData from '../data/trip.json'
import PassportStamp from './PassportStamp.jsx'
import { kmDrivenTo } from '../lib/distance.js'
import { buildTrophies } from '../lib/trophies.js'

// A print-friendly end-of-trip keepsake: one document that gathers all
// progress. Sharing uses the tablet's own flow — 🖨️ → "save as PDF" → AirDrop /
// WhatsApp. Read-only, fully offline, no PDF library. Rendered as a full-screen
// overlay (like WoordjesSpel) but portalled to <body> so print isolation is
// clean: @media print hides #root and lets this flow as a normal document.

// Same safe loader used across the app.
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

const NL_MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
                   'juli', 'augustus', 'september', 'oktober', 'november', 'december']

function fmtDate(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${NL_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// "Sven" · "Sven en Lily" · "Sven, Lily en Max"
function joinDutch(names) {
  const list = (names || []).map(n => String(n).trim()).filter(Boolean)
  if (list.length === 0) return ''
  if (list.length === 1) return list[0]
  return list.slice(0, -1).join(', ') + ' en ' + list[list.length - 1]
}

function StatTile({ icon, value, label }) {
  return (
    <div className="bg-white rounded-2xl px-3 py-3 text-center shadow-sm break-inside-avoid">
      <div className="text-2xl leading-none">{icon}</div>
      <div className="text-2xl font-black text-orange-600 leading-none mt-1">{value}</div>
      <div className="text-xs font-bold text-amber-700 mt-1 leading-tight">{label}</div>
    </div>
  )
}

export default function ReisverslagView({ onClose }) {
  const stops = tripData.stops
  const home  = tripData.home

  // ── Read all progress once (same ce_* keys the rest of the app uses) ──
  const names     = load('ce_names', [])
  const visited   = load('ce_visited', [])
  const stamped   = load('ce_stamped', [])          // [{id, date}]
  const quizstars = load('ce_quizstars', {})
  const wordstars = load('ce_wordstars', {})
  const spotted   = load('ce_spotted', {})
  const kenteken  = load('ce_kenteken', {})
  const diary     = load('ce_diary', [])
  const activeStopId = localStorage.getItem('ce_activeStop') // stored raw, not JSON

  // ── Derived numbers ──
  const activeStop = activeStopId && activeStopId !== 'home'
    ? stops.find(s => s.id === activeStopId)
    : null
  const km = Math.round(kmDrivenTo(home, stops, activeStop)).toLocaleString('nl-NL')

  const countryCount   = new Set(stops.filter(s => visited.includes(s.id)).map(s => s.countryCode)).size
  const totalQuizStars = stops.reduce((n, s) => n + (quizstars[s.id] ?? 0), 0)
  const totalWordStars = stops.reduce((n, s) => n + (wordstars[s.id] ?? 0), 0)
  const kSpotted = Array.isArray(kenteken.spottedEver) ? kenteken.spottedEver : []

  // Date range: earliest stamp → today
  const stampDates = stamped.map(s => s.date).filter(Boolean).sort()
  const todayISO = new Date().toISOString().slice(0, 10)
  const dateRange = stampDates.length
    ? `${fmtDate(stampDates[0])} — ${fmtDate(todayISO)}`
    : fmtDate(todayISO)

  // Earned stamps, in travel order, with their quiz-star count
  const earnedStamps = stamped
    .map(s => ({ stop: stops.find(x => x.id === s.id), date: s.date, stars: quizstars[s.id] ?? 0 }))
    .filter(x => x.stop)
    .sort((a, b) => a.stop.order - b.stop.order)

  // Diary grouped by date, OLDEST first (a chronicle, unlike the app timeline)
  const grouped = {}
  for (const e of diary) (grouped[e.date] ||= []).push(e)
  const diaryDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b))
  const stopLabel = (stopId) => {
    if (!stopId || stopId === 'home') return null
    const s = stops.find(x => x.id === stopId)
    return s ? `${s.flag} ${s.name}` : null
  }

  // Trophies (shared logic) — for the footer
  const trophies = buildTrophies({
    stampCount:      stamped.length,
    fullySpotted:    stops.filter(s => (s.spotChallenge?.length ?? 0) > 0 && (spotted[s.id]?.length ?? 0) >= (s.spotChallenge?.length ?? 0)).length,
    playedCount:     stops.filter(s => (wordstars[s.id] ?? 0) >= 1).length,
    threeStarCount:  stops.filter(s => (wordstars[s.id] ?? 0) >= 3).length,
    totalStars:      totalWordStars,
    quizThreeStar:   stops.filter(s => (quizstars[s.id] ?? 0) >= 3).length,
    totalQuizStars,
    diaryCount:      diary.length,
    visitedCount:    visited.length,
    countryCount,
    totalStops:      stops.length,
    kentekenFirst:   kSpotted.length >= 1,
    kentekenBingo:   !!kenteken.everBingo,
    kentekenAllTrip: ['NL', 'DE', 'AT', 'IT', 'CH', 'FR'].every(c => kSpotted.includes(c)),
  })
  const earnedTrophies = trophies.filter(t => t.earned).length
  const champion = trophies.find(t => t.id === 'champion')?.earned

  const namesJoined = joinDutch(names)

  return createPortal(
    <div className="reisverslag-print fixed inset-0 z-50 overflow-y-auto bg-brand-cream print:static print:h-auto print:z-auto print:overflow-visible">
      {/* Top bar — screen only */}
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 bg-orange-500 shadow-md">
        <button
          onClick={onClose}
          aria-label="Sluiten"
          className="min-h-tap min-w-tap flex items-center justify-center rounded-2xl bg-white/25 text-white text-2xl font-black active:scale-95 transition-transform"
        >
          ✕
        </button>
        <span className="text-white font-black text-lg">📜 Reisverslag</span>
        <button
          onClick={() => window.print()}
          className="min-h-tap rounded-2xl bg-white text-orange-700 font-black px-5 text-base shadow active:scale-95 transition-transform"
        >
          🖨️ Print / bewaar als PDF
        </button>
      </div>

      {/* The report */}
      <div className="max-w-4xl mx-auto px-6 py-8 md:px-10">
        {/* Header */}
        <header className="text-center mb-8 break-inside-avoid">
          <div className="text-5xl mb-2">📜</div>
          <h1 className="text-3xl md:text-4xl font-black text-orange-700 leading-tight">{tripData.title}</h1>
          <p className="text-lg font-bold text-amber-800 mt-1">
            {namesJoined ? `Het reisdagboek van ${namesJoined}` : 'Het reisdagboek'}
          </p>
          <p className="text-sm font-semibold text-amber-600 mt-1">{dateRange}</p>
        </header>

        {/* Reis in cijfers */}
        <section className="mb-8">
          <h2 className="text-xl font-black text-amber-900 mb-3">📊 Reis in cijfers</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            <StatTile icon="🧭" value={`${visited.length}/${stops.length}`} label="plekken bezocht" />
            <StatTile icon="🌍" value={`${countryCount}/5`} label="landen" />
            <StatTile icon="🎫" value={stamped.length} label="stempels" />
            <StatTile icon="⭐" value={totalQuizStars} label="quizsterren" />
            <StatTile icon="🃏" value={totalWordStars} label="woordsterren" />
            <StatTile icon="📖" value={diary.length} label="dagboekstukjes" />
            <StatTile icon="🚐" value={km} label="km gereden" />
          </div>
        </section>

        {/* Stamps */}
        <section className="mb-8">
          <h2 className="text-xl font-black text-amber-900 mb-3">🎫 Onze stempels</h2>
          {earnedStamps.length === 0 ? (
            <p className="text-amber-700 font-semibold">Nog geen stempels verdiend.</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-5">
              {earnedStamps.map(({ stop, date, stars }) => (
                <div key={stop.id} className="flex flex-col items-center break-inside-avoid">
                  <PassportStamp stop={stop} date={date} size={150} />
                  {stars > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: stars }).map((_, i) => (
                        <span key={i} style={{ fontSize: 14 }}>⭐</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Diary */}
        <section className="mb-8">
          <h2 className="text-xl font-black text-amber-900 mb-3">📖 Ons dagboek</h2>
          {diary.length === 0 ? (
            <p className="text-amber-700 font-semibold">Nog geen herinneringen opgeschreven.</p>
          ) : (
            diaryDates.map(date => (
              <div key={date} className="mb-4">
                <p className="text-sm font-black text-amber-600 uppercase tracking-wide mb-2">{fmtDate(date)}</p>
                <div className="flex flex-col gap-2">
                  {grouped[date]
                    .slice()
                    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
                    .map(entry => {
                      const label = stopLabel(entry.stopId)
                      return (
                        <div key={entry.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm break-inside-avoid">
                          {label && (
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-xs">📍</span>
                              <span className="text-xs font-bold text-amber-600">{label}</span>
                            </div>
                          )}
                          <p className="text-base leading-snug text-gray-800 whitespace-pre-wrap break-words">{entry.text}</p>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))
          )}
        </section>

        {/* Footer */}
        <footer className="text-center mt-10 pt-6 border-t-2 border-amber-200 break-inside-avoid">
          <p className="text-base font-bold text-amber-800">🏆 {earnedTrophies} trofeeën verdiend</p>
          {champion && (
            <p className="text-lg font-black text-orange-700 mt-1">👑 Reiskampioen — de hele reis volbracht!</p>
          )}
          <p className="text-xs text-amber-500 mt-3">Gemaakt met Camp Explorer 🏕️</p>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
