import React, { useState, useMemo } from 'react'
import tripData from '../data/trip.json'
import PassportStamp from './PassportStamp.jsx'
import StopCard from './StopCard.jsx'

// Eagerly bundle every quiz image so they're available offline via the service worker.
// Keys are like "../assets/karlsruhe/pyramid.jpg"; values have a .default URL.
const QUIZ_IMAGES = import.meta.glob('../assets/**/*.{jpg,jpeg,png,webp,avif}', { eager: true })
function quizImgSrc(path) {
  if (!path) return null
  return QUIZ_IMAGES[`../assets/${path}`]?.default ?? null
}

// Best picture-quiz star score per stop: { [stopId]: 1|2|3 }. Kept separate from
// the stamp so a replay can improve the score. Mirrors ce_wordstars.
const LS_QUIZSTARS = 'ce_quizstars'
function loadQuizStars() {
  try { return JSON.parse(localStorage.getItem(LS_QUIZSTARS)) || {} } catch { return {} }
}

const COUNTRY_BG = {
  DE: '#E5806B', AT: '#69B0B6', IT: '#93C18E',
  CH: '#EF7C58', FR: '#F4C95D', NL: '#7FB99B',
}
const COUNTRY_TEXT = {
  DE: '#5c1a0d', AT: '#0d3a3d', IT: '#0d3310',
  CH: '#5c1a0d', FR: '#3d2d00', NL: '#0d3322',
}
const bg = (c) => COUNTRY_BG[c]   ?? '#f97316'
const fg = (c) => COUNTRY_TEXT[c] ?? '#431407'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function shortName(name) {
  const p = name.split(/\s*[/&]\s*/)[0].trim()
  return p.length > 14 ? p.slice(0, 13) + '…' : p
}

// ── Stamp grid card ──────────────────────────────────────────────────────────
function StampCard({ stop, state, isCurrent, stampDate, stars, onTap }) {
  const color = bg(stop.countryCode)
  const isLocked    = state === 'locked'
  const isAvailable = state === 'available'
  const isStamped   = state === 'stamped'

  // Badge rendered outside both card variants so overflow:hidden can't clip it
  const currentBadge = isCurrent && !isLocked ? (
    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-orange-500 text-white font-black px-3 py-1 rounded-full shadow-lg whitespace-nowrap pointer-events-none"
         style={{ fontSize: '11px' }}>
      🚐 Wij zijn hier!
    </div>
  ) : null

  if (isStamped) {
    return (
      <div className="relative">
        {currentBadge}
        <button
          onClick={onTap}
          className="relative w-full flex items-center justify-center active:scale-95 transition-transform rounded-xl"
          style={{
            background: 'white',
            boxShadow: isCurrent
              ? `0 0 0 3px #f97316, 0 4px 20px rgba(249,115,22,0.45)`
              : `0 0 0 2px ${color}50, 0 4px 14px rgba(0,0,0,0.12)`,
            overflow: 'visible',
            minHeight: '160px',
          }}
        >
          <div
            className="absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
            style={{ background: color }}
          >
            {stop.order}
          </div>
          <PassportStamp stop={stop} date={stampDate} size={148} />
          {stars > 0 && (
            <div className="absolute bottom-1 right-1 z-10 flex items-center gap-[1px] px-1.5 py-0.5 rounded-full bg-white/90 shadow-sm pointer-events-none">
              {Array.from({ length: stars }).map((_, i) => (
                <span key={i} style={{ fontSize: 11, lineHeight: 1 }}>⭐</span>
              ))}
            </div>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      {currentBadge}
      <button
        onClick={isLocked ? undefined : onTap}
        disabled={isLocked}
        className="relative w-full flex flex-col rounded-xl overflow-hidden active:scale-95 transition-transform"
        style={{
          background: 'white',
          boxShadow: isCurrent
            ? `0 0 0 3px #f97316, 0 4px 20px rgba(249,115,22,0.45)`
            : isLocked
              ? '0 1px 4px rgba(0,0,0,0.07)'
              : `0 0 0 3px ${color}, 0 4px 16px rgba(0,0,0,0.16)`,
          filter: isLocked ? 'grayscale(0.85) opacity(0.5)' : 'none',
          cursor: isLocked ? 'default' : 'pointer',
          minHeight: '160px',
        }}
      >
        {/* Coloured header */}
        <div
          className="w-full py-2 px-3 flex items-center justify-between flex-shrink-0"
          style={{ background: isLocked ? '#e5e7eb' : color }}
        >
          <span className="text-3xl leading-none">{stop.flag}</span>
          <span className="text-xs font-black text-white w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.2)' }}>
            {stop.order}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col items-center justify-center px-2 py-2 gap-1"
             style={{ background: isLocked ? '#f9fafb' : color + '18' }}>
          <p className="text-sm font-black text-center leading-tight"
             style={{ color: isLocked ? '#9ca3af' : fg(stop.countryCode) }}>
            {shortName(stop.name)}
          </p>
          <p className="text-xs opacity-60 text-center"
             style={{ color: isLocked ? '#9ca3af' : fg(stop.countryCode) }}>
            {stop.country} · {stop.nights}🌙
          </p>
          {isLocked    && <span className="text-xl mt-1 opacity-30">🔒</span>}
          {isAvailable && (
            <span className="mt-1 text-xs font-black px-2 py-0.5 rounded-full text-white"
                  style={{ background: color }}>
              ⭐ Quiz!
            </span>
          )}
        </div>
      </button>
    </div>
  )
}

// ── Quiz screen ──────────────────────────────────────────────────────────────
function QuizScreen({ stop, questions, onPass, onBack }) {
  const [qIdx,     setQIdx]     = useState(0)
  const [selected, setSelected] = useState(null)
  const [wrong,    setWrong]    = useState(false)
  const [firstTry, setFirstTry] = useState(0)     // questions nailed on the first guess
  const [missed,   setMissed]   = useState(false) // current question was already missed once

  const color   = bg(stop.countryCode)
  const q       = questions[qIdx]
  const total   = questions.length
  const correct = q.options.find(o => o.correct)

  function choose(option) {
    if (selected) return
    setSelected(option.label)
    if (option.correct) {
      if (!missed) setFirstTry(n => n + 1)
    } else {
      setWrong(true)
      setMissed(true)
    }
  }

  function next() {
    if (wrong) { setSelected(null); setWrong(false); return }
    if (qIdx + 1 < total) {
      setQIdx(qIdx + 1); setSelected(null); setWrong(false); setMissed(false)
    } else {
      // 3/3 first try = ⭐⭐⭐, 2/3 = ⭐⭐, otherwise ⭐ (kids always pass eventually)
      const stars = firstTry >= total ? 3 : firstTry >= Math.ceil(total / 2) ? 2 : 1
      onPass(stars)
    }
  }

  function optionStyle(option) {
    if (!selected) return { background: 'white', border: `2px solid ${color}44`, color: fg(stop.countryCode) }
    if (option.correct)  return { background: '#22c55e', border: '2px solid #16a34a', color: 'white' }
    if (option.label === selected) return { background: '#ef4444', border: '2px solid #dc2626', color: 'white' }
    return { background: 'white', border: `2px solid ${color}22`, color: fg(stop.countryCode), opacity: 0.45 }
  }

  return (
    <div className="h-full flex flex-col" style={{ background: bg(stop.countryCode) + '18' }}>
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 border-b border-white/60"
           style={{ background: color }}>
        <button onClick={onBack}
          className="min-h-[44px] px-3 py-1 rounded-lg bg-white/30 text-white font-bold text-sm active:scale-95">
          ← Terug
        </button>
        <span className="text-white font-black text-lg flex-1 leading-tight">
          {stop.flag} {shortName(stop.name)}
        </span>
        <span className="text-white/80 text-sm font-semibold">{qIdx + 1} / {total}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
        {quizImgSrc(q.image) ? (
          <img
            src={quizImgSrc(q.image)}
            alt=""
            className="rounded-2xl object-cover shadow-md"
            style={{ maxHeight: '180px', maxWidth: '100%' }}
          />
        ) : q.emoji ? (
          // A little emoji scene where a photo would go — visual without needing images
          <div className="rounded-3xl bg-white/70 shadow-md px-10 py-4 flex items-center justify-center">
            <span className="text-7xl md:text-8xl leading-none">{q.emoji}</span>
          </div>
        ) : null}
        <p className="text-2xl font-black text-center leading-tight" style={{ color: fg(stop.countryCode) }}>
          {q.q}
        </p>
        <div className="w-full max-w-xl flex flex-col gap-3">
          {q.options.map(option => (
            <button key={option.label} onClick={() => choose(option)} disabled={!!selected}
              className="w-full min-h-[64px] rounded-2xl px-5 py-3 text-lg font-bold text-left active:scale-95 transition-all"
              style={optionStyle(option)}>
              {option.label}
            </button>
          ))}
        </div>
        {selected && (
          <div className="flex flex-col items-center gap-3 mt-2">
            {wrong ? (
              <>
                <p className="text-base font-semibold text-red-700">
                  Bijna! Het goede antwoord is: <strong>{correct.label}</strong>
                </p>
                <button onClick={next}
                  className="min-h-[56px] px-8 py-3 rounded-2xl text-white font-black text-base active:scale-95"
                  style={{ background: color }}>
                  Probeer opnieuw →
                </button>
              </>
            ) : (
              <>
                <p className="text-base font-black text-green-700">✅ Goed zo!</p>
                <button onClick={next}
                  className="min-h-[56px] px-8 py-3 rounded-2xl text-white font-black text-base active:scale-95"
                  style={{ background: color }}>
                  {qIdx + 1 < total ? 'Volgende vraag →' : '🎉 Klaar!'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Celebration screen ────────────────────────────────────────────────────────
function CelebrationScreen({ stop, earnedDate, stars, onBack }) {
  const color = bg(stop.countryCode)
  return (
    <div className="h-full flex flex-col items-center justify-center gap-5 px-8"
         style={{ background: color + '22' }}>
      <style>{`@keyframes ce-cel-star{0%{transform:scale(0);opacity:0}60%{transform:scale(1.3)}100%{transform:scale(1);opacity:1}}`}</style>
      <p className="text-4xl font-black text-center" style={{ color: fg(stop.countryCode) }}>
        🎉 Stempel verdiend!
      </p>
      {stars > 0 && (
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <span key={i} style={{ fontSize: 46, animation: `ce-cel-star 0.45s ease-out ${0.12 * i}s both` }}>
                {i < stars ? '⭐' : '☆'}
              </span>
            ))}
          </div>
          <p className="text-lg font-black" style={{ color: fg(stop.countryCode) }}>
            {stars === 3 ? 'Alles in één keer goed!' : stars === 2 ? 'Goed gedaan!' : 'Gelukt!'}
          </p>
        </div>
      )}
      <PassportStamp stop={stop} date={earnedDate} size={190} />
      <button onClick={onBack}
        className="min-h-[64px] px-10 py-3 rounded-2xl text-white font-black text-lg active:scale-95"
        style={{ background: color }}>
        ← Terug naar paspoort
      </button>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function PaspoortTab({ visitedStopIds, stampedStops, activeStopId, onStampEarned }) {
  const stops = tripData.stops

  const [mode,        setMode]        = useState('grid')
  const [quizStop,    setQuizStop]    = useState(null)
  const [earnedDate,  setEarnedDate]  = useState(null)
  const [earnedStars, setEarnedStars] = useState(0)
  const [quizStars,   setQuizStars]   = useState(loadQuizStars)

  const stampedIds  = stampedStops.map(s => s.id)
  const stampDate   = (stopId) => stampedStops.find(s => s.id === stopId)?.date ?? null
  const stampedCount = stampedStops.length

  function recordStars(stopId, stars) {
    setQuizStars(prev => {
      const best = Math.max(prev[stopId] ?? 0, stars)
      if (best === (prev[stopId] ?? 0)) return prev
      const next = { ...prev, [stopId]: best }
      localStorage.setItem(LS_QUIZSTARS, JSON.stringify(next))
      return next
    })
  }

  const shuffledQuestions = useMemo(() => {
    if (!quizStop) return []
    return (quizStop.passportQuiz || []).map(q => ({ ...q, options: shuffle(q.options) }))
  }, [quizStop?.id])

  function stampState(stop) {
    if (stampedIds.includes(stop.id))  return 'stamped'
    if (visitedStopIds.includes(stop.id)) return 'available'
    return 'locked'
  }

  function openQuiz(stop) {
    setQuizStop(stop)
    setMode('quiz')
  }

  function openDetail(stop) {
    setQuizStop(stop)
    setMode('detail')
  }

  function handlePass(stars) {
    recordStars(quizStop.id, stars)
    setEarnedStars(stars)
    if (stampedIds.includes(quizStop.id)) {
      // Replaying an already-earned stamp: keep the stamp & date, still celebrate the score
      setEarnedDate(stampDate(quizStop.id))
    } else {
      const today = new Date().toISOString().slice(0, 10)
      setEarnedDate(today)
      onStampEarned(quizStop.id)
    }
    setMode('celebrate')
  }

  function backToGrid() {
    setMode('grid')
    setQuizStop(null)
    setEarnedDate(null)
    setEarnedStars(0)
  }

  if (mode === 'detail' && quizStop) {
    const color = bg(quizStop.countryCode)
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
             style={{ background: color }}>
          <button onClick={backToGrid}
            className="min-h-[44px] px-3 py-1 rounded-lg bg-white/30 text-white font-bold text-sm active:scale-95">
            ← Terug
          </button>
          <span className="flex-1" />
          <button onClick={() => openQuiz(quizStop)}
            className="min-h-[44px] px-4 py-1 rounded-lg bg-white/30 text-white font-bold text-sm active:scale-95">
            🎯 Quiz opnieuw
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <StopCard stop={quizStop} />
        </div>
      </div>
    )
  }

  if (mode === 'quiz' && quizStop) {
    return <QuizScreen stop={quizStop} questions={shuffledQuestions} onPass={handlePass} onBack={backToGrid} />
  }
  if (mode === 'celebrate' && quizStop) {
    return <CelebrationScreen stop={quizStop} earnedDate={earnedDate} stars={earnedStars} onBack={backToGrid} />
  }

  return (
    <div className="h-full flex flex-col bg-brand-cream overflow-hidden">
      {/* ── Progress header ──────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-4 pb-3">

        {/* Title + cheer */}
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-black text-amber-900">🗒️ Paspoort</h1>
          <span className="text-sm font-bold text-amber-600">
            {stampedCount === stops.length
              ? '🏆 Helemaal vol!'
              : stampedCount === 0 && visitedStopIds.length === 0
                ? '📍 Ga naar de kaart om te beginnen!'
                : stampedCount === 0
                  ? '✨ Doe een quiz voor je eerste stempel!'
                  : `🚀 Nog ${stops.length - stampedCount} stempels te gaan!`}
          </span>
        </div>

        {/* Big written-out count + gradient bar */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-baseline gap-1.5 min-w-max">
            <span className="text-4xl font-black text-orange-500 leading-none">{stampedCount}</span>
            <span className="text-base font-bold text-amber-700">van de {stops.length} stempels</span>
          </div>
          <div className="flex-1 h-5 rounded-full bg-amber-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(stampedCount / stops.length) * 100}%`,
                background: 'linear-gradient(90deg, #fb923c 0%, #fbbf24 100%)',
              }}
            />
          </div>
        </div>

        {/* One dot per stop, coloured with country colour when stamped */}
        <div className="flex gap-1">
          {stops.map(stop => (
            <div
              key={stop.id}
              className="flex-1 h-2.5 rounded-full transition-all duration-300"
              style={{ background: stampedIds.includes(stop.id) ? bg(stop.countryCode) : '#fde68a' }}
            />
          ))}
        </div>
      </div>

      {/* pt-6 leaves room for the "Wij zijn hier!" badge that pokes above the top row */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4">
        <div className="grid grid-cols-4 gap-4" style={{ gridAutoRows: '1fr' }}>
          {stops.map(stop => (
            <StampCard
              key={stop.id}
              stop={stop}
              state={stampState(stop)}
              isCurrent={stop.id === activeStopId}
              stampDate={stampDate(stop.id)}
              stars={quizStars[stop.id] ?? 0}
              onTap={() => {
                const s = stampState(stop)
                if (s === 'locked') return
                if (s === 'stamped') openDetail(stop)
                else openQuiz(stop)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
