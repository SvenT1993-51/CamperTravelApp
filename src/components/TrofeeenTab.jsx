import React, { useState, useEffect } from 'react'
import tripData from '../data/trip.json'
import Confetti from './Confetti.jsx'
import { buildTrophies } from '../lib/trophies.js'

const LS_SPOTTED   = 'ce_spotted'
const LS_DIARY     = 'ce_diary'
const LS_WORDSTARS = 'ce_wordstars'
const LS_QUIZSTARS = 'ce_quizstars'
const LS_KENTEKEN  = 'ce_kenteken'
const LS_SEEN      = 'ce_trophies_seen'

// The 6 trip countries (incl. home NL), by their app countryCode / plate key
const TRIP_PLATE_CODES = ['NL', 'DE', 'AT', 'IT', 'CH', 'FR']

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

const CATEGORIES = ['Stempels', 'Speurder', 'Woordjes', 'Dagboek & reis', 'Onderweg']

// ── One trophy card ───────────────────────────────────────────────────────────
function TrophyCard({ t, isNew }) {
  if (t.earned) {
    return (
      <div
        className="relative rounded-2xl px-3 py-4 flex flex-col items-center text-center gap-1"
        style={{
          background: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 60%, #fb923c 100%)',
          border: '3px solid #fffaf0',
          boxShadow: '0 5px 16px rgba(245,158,11,0.45)',
          animation: isNew ? 'ce-trophy-pop 0.5s ease-out' : undefined,
        }}
      >
        {isNew && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow rotate-6">
            NIEUW!
          </span>
        )}
        <span className="text-5xl leading-none drop-shadow-sm">{t.icon}</span>
        <span className="text-sm font-black text-white leading-tight mt-1">{t.title}</span>
        <span className="text-xs font-bold text-white/90 leading-snug">{t.desc}</span>
      </div>
    )
  }
  return (
    <div className="relative rounded-2xl px-3 py-4 flex flex-col items-center text-center gap-1 bg-white/70 border-2 border-dashed border-amber-200">
      <span className="absolute top-1.5 right-1.5 text-base opacity-50">🔒</span>
      <span className="text-5xl leading-none" style={{ filter: 'grayscale(1)', opacity: 0.35 }}>{t.icon}</span>
      <span className="text-sm font-black text-amber-900/50 leading-tight mt-1">{t.title}</span>
      <span className="text-xs font-bold text-amber-800/45 leading-snug">{t.desc}</span>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function TrofeeenTab({ stampedStops, visitedStopIds }) {
  const stops = tripData.stops

  // Read the sources that live outside App state (tab remounts on switch, so fresh)
  const spotted   = load(LS_SPOTTED, {})
  const diary     = load(LS_DIARY, [])
  const wordstars = load(LS_WORDSTARS, {})
  const quizstars = load(LS_QUIZSTARS, {})
  const kenteken  = load(LS_KENTEKEN, {})

  const stampCount   = stampedStops.length
  const fullySpotted = stops.filter(s => {
    const need = s.spotChallenge?.length ?? 0
    return need > 0 && (spotted[s.id]?.length ?? 0) >= need
  }).length
  const playedCount    = stops.filter(s => (wordstars[s.id] ?? 0) >= 1).length
  const threeStarCount = stops.filter(s => (wordstars[s.id] ?? 0) >= 3).length
  const totalStars     = stops.reduce((sum, s) => sum + (wordstars[s.id] ?? 0), 0)
  const quizThreeStar  = stops.filter(s => (quizstars[s.id] ?? 0) >= 3).length
  const totalQuizStars = stops.reduce((sum, s) => sum + (quizstars[s.id] ?? 0), 0)
  const diaryCount     = diary.length
  const visitedCount   = visitedStopIds.length
  const countryCount   = new Set(
    stops.filter(s => visitedStopIds.includes(s.id)).map(s => s.countryCode),
  ).size
  const kSpotted = Array.isArray(kenteken.spottedEver) ? kenteken.spottedEver : []

  const trophies = buildTrophies({
    stampCount, fullySpotted, playedCount, threeStarCount, totalStars,
    quizThreeStar, totalQuizStars,
    diaryCount, visitedCount, countryCount, totalStops: stops.length,
    kentekenFirst: kSpotted.length >= 1,
    kentekenBingo: !!kenteken.everBingo,
    kentekenAllTrip: TRIP_PLATE_CODES.every(c => kSpotted.includes(c)),
  })

  const earnedTrophies = trophies.filter(t => t.earned)
  const earnedCount = earnedTrophies.length
  const total = trophies.length

  // Celebrate trophies earned since the last visit
  const [celebrate, setCelebrate] = useState(false)
  const [newIds, setNewIds] = useState([])
  useEffect(() => {
    const earnedIds = earnedTrophies.map(t => t.id)
    const seen = load(LS_SEEN, [])
    const fresh = earnedIds.filter(id => !seen.includes(id))
    if (fresh.length > 0) {
      setNewIds(fresh)
      setCelebrate(true)
      localStorage.setItem(LS_SEEN, JSON.stringify(earnedIds))
      const t = setTimeout(() => setCelebrate(false), 3000)
      return () => clearTimeout(t)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative h-full flex flex-col bg-brand-cream overflow-hidden">
      <style>{`
        @keyframes ce-trophy-pop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
      `}</style>

      {celebrate && <Confetti />}

      {/* Progress header */}
      <div className="flex-shrink-0 px-6 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-black text-amber-900">🏆 Trofeeënkamer</h1>
          <span className="text-sm font-bold text-amber-600">
            {earnedCount === total
              ? '👑 Alles verdiend — kampioen!'
              : newIds.length > 0
                ? `🎉 ${newIds.length} nieuw${newIds.length === 1 ? 'e' : 'e'} trofee${newIds.length === 1 ? '' : 'ën'}!`
                : earnedCount === 0
                  ? '✨ Verdien je eerste trofee!'
                  : `🚀 Nog ${total - earnedCount} te gaan!`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1.5 min-w-max">
            <span className="text-4xl font-black text-orange-500 leading-none">{earnedCount}</span>
            <span className="text-base font-bold text-amber-700">van de {total}</span>
          </div>
          <div className="flex-1 h-5 rounded-full bg-amber-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(earnedCount / total) * 100}%`,
                background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Trophy grid, grouped by category */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {CATEGORIES.map(cat => {
          const inCat = trophies.filter(t => t.cat === cat)
          const got = inCat.filter(t => t.earned).length
          return (
            <div key={cat} className="mb-5">
              <div className="flex items-baseline gap-2 mb-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-amber-700">{cat}</h2>
                <span className="text-xs font-bold text-amber-500">{got}/{inCat.length}</span>
              </div>
              <div className="grid grid-cols-4 gap-3" style={{ gridAutoRows: '1fr' }}>
                {inCat.map(t => (
                  <TrophyCard key={t.id} t={t} isNew={newIds.includes(t.id)} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
