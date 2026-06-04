import React, { useState, useEffect } from 'react'
import tripData from '../data/trip.json'
import Confetti from './Confetti.jsx'

const LS_SPOTTED   = 'ce_spotted'
const LS_DIARY     = 'ce_diary'
const LS_WORDSTARS = 'ce_wordstars'
const LS_SEEN      = 'ce_trophies_seen'

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

const CATEGORIES = ['Stempels', 'Speurder', 'Woordjes', 'Dagboek & reis']

// Build the full trophy list from the player's progress. Each trophy is simply
// earned or not; the room stays motivating because locked ones show how to get them.
function buildTrophies({ stampCount, fullySpotted, playedCount, threeStarCount, totalStars, diaryCount, visitedCount, countryCount, totalStops }) {
  const base = [
    { id: 'stamp1',    cat: 'Stempels',       icon: '🥇', title: 'Eerste stempel',  desc: 'Verdien je eerste stempel',     earned: stampCount >= 1 },
    { id: 'stamp6',    cat: 'Stempels',       icon: '🎖️', title: 'Op de helft',     desc: '6 stempels verdiend',           earned: stampCount >= 6 },
    { id: 'stamp12',   cat: 'Stempels',       icon: '🏆', title: 'Alle stempels',   desc: `Alle ${totalStops} stempels verdiend`, earned: stampCount >= totalStops },

    { id: 'spot1',     cat: 'Speurder',       icon: '🔍', title: 'Speurneus',       desc: 'Vind alles op één plek',        earned: fullySpotted >= 1 },
    { id: 'spot5',     cat: 'Speurder',       icon: '🕵️', title: 'Scherpe ogen',    desc: 'Vind alles op 5 plekken',       earned: fullySpotted >= 5 },
    { id: 'spot12',    cat: 'Speurder',       icon: '🧭', title: 'Meester-speurder', desc: 'Vind alles op elke plek',      earned: fullySpotted >= totalStops },

    { id: 'word1',     cat: 'Woordjes',       icon: '🃏', title: 'Woordspeler',     desc: 'Speel je eerste woordjes-spel', earned: playedCount >= 1 },
    { id: 'word3star', cat: 'Woordjes',       icon: '⭐', title: 'Drie sterren!',    desc: 'Haal 3 sterren in een spel',    earned: threeStarCount >= 1 },
    { id: 'word6',     cat: 'Woordjes',       icon: '💬', title: 'Taalknobbel',     desc: 'Speel op 6 plekken',            earned: playedCount >= 6 },
    { id: 'word12',    cat: 'Woordjes',       icon: '📚', title: 'Woordmeester',    desc: 'Speel op alle plekken',         earned: playedCount >= totalStops },
    { id: 'starrain',  cat: 'Woordjes',       icon: '🌟', title: 'Sterrenregen',    desc: 'Verzamel 24 sterren',           earned: totalStars >= 24 },

    { id: 'diary1',    cat: 'Dagboek & reis', icon: '✏️', title: 'Eerste verhaal',  desc: 'Schrijf je eerste herinnering', earned: diaryCount >= 1 },
    { id: 'diary10',   cat: 'Dagboek & reis', icon: '📖', title: 'Schrijver',       desc: 'Schrijf 10 herinneringen',      earned: diaryCount >= 10 },
    { id: 'trip1',     cat: 'Dagboek & reis', icon: '🚐', title: 'Op reis!',        desc: 'Bezoek je eerste plek',         earned: visitedCount >= 1 },
    { id: 'trip6',     cat: 'Dagboek & reis', icon: '🛣️', title: 'Halverwege',      desc: 'Bezoek 6 plekken',              earned: visitedCount >= 6 },
    { id: 'countries', cat: 'Dagboek & reis', icon: '🌍', title: 'Wereldreiziger',  desc: 'Bezoek alle 5 landen',          earned: countryCount >= 5 },
    { id: 'trip12',    cat: 'Dagboek & reis', icon: '🏁', title: 'Hele reis',       desc: 'Bezoek alle plekken',           earned: visitedCount >= totalStops },
  ]
  // The crown: earned once every other trophy is in the bag
  base.push({
    id: 'champion', cat: 'Dagboek & reis', icon: '👑', title: 'Reiskampioen',
    desc: 'Verdien alle andere trofeeën', earned: base.every(t => t.earned),
  })
  return base
}

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

  const stampCount   = stampedStops.length
  const fullySpotted = stops.filter(s => {
    const need = s.spotChallenge?.length ?? 0
    return need > 0 && (spotted[s.id]?.length ?? 0) >= need
  }).length
  const playedCount    = stops.filter(s => (wordstars[s.id] ?? 0) >= 1).length
  const threeStarCount = stops.filter(s => (wordstars[s.id] ?? 0) >= 3).length
  const totalStars     = stops.reduce((sum, s) => sum + (wordstars[s.id] ?? 0), 0)
  const diaryCount     = diary.length
  const visitedCount   = visitedStopIds.length
  const countryCount   = new Set(
    stops.filter(s => visitedStopIds.includes(s.id)).map(s => s.countryCode),
  ).size

  const trophies = buildTrophies({
    stampCount, fullySpotted, playedCount, threeStarCount, totalStars,
    diaryCount, visitedCount, countryCount, totalStops: stops.length,
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
