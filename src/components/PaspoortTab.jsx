import React, { useState, useMemo } from 'react'
import tripData from '../data/trip.json'

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

// ── Stamp card (grid item) ────────────────────────────────────────────────────
function Stamp({ stop, state, isCurrent, onTap }) {
  const color = bg(stop.countryCode)
  const text  = fg(stop.countryCode)
  const isLocked    = state === 'locked'
  const isAvailable = state === 'available'
  const isStamped   = state === 'stamped'

  return (
    <button
      onClick={isLocked ? undefined : onTap}
      disabled={isLocked}
      className="relative flex flex-col rounded-xl overflow-hidden active:scale-95 transition-transform"
      style={{
        background: 'white',
        boxShadow: isLocked
          ? '0 1px 4px rgba(0,0,0,0.08)'
          : isAvailable
            ? `0 0 0 3px ${color}, 0 4px 16px rgba(0,0,0,0.18)`
            : `0 0 0 3px ${color}, 0 4px 12px rgba(0,0,0,0.14)`,
        filter: isLocked ? 'grayscale(0.85) opacity(0.5)' : 'none',
        cursor: isLocked ? 'default' : 'pointer',
      }}
    >
      {/* Coloured header strip */}
      <div
        className="w-full py-2 px-3 flex items-center justify-between"
        style={{ background: isLocked ? '#e5e7eb' : color }}
      >
        <span className="text-3xl leading-none">{stop.flag}</span>
        {/* Order badge */}
        <span
          className="text-xs font-black text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          {stop.order}
        </span>
      </div>

      {/* Body */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-2 py-2 gap-0.5"
        style={{ background: isLocked ? '#f9fafb' : color + '18' }}
      >
        <p className="text-sm font-black text-center leading-tight" style={{ color: isLocked ? '#9ca3af' : text }}>
          {shortName(stop.name)}
        </p>
        <p className="text-xs opacity-60 text-center" style={{ color: isLocked ? '#9ca3af' : text }}>
          {stop.country} · {stop.nights}🌙
        </p>

        {/* State indicator */}
        {isLocked && (
          <span className="text-xl mt-1 opacity-30">🔒</span>
        )}
        {isAvailable && (
          <span
            className="mt-1 text-xs font-black px-2 py-0.5 rounded-full text-white"
            style={{ background: color }}
          >
            ⭐ Quiz!
          </span>
        )}
        {isStamped && (
          <span
            className="mt-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-black"
            style={{ background: color }}
          >
            ✓
          </span>
        )}
      </div>

      {/* Camper badge */}
      {isCurrent && !isLocked && (
        <div className="absolute -top-2 -right-2 text-lg leading-none">🚐</div>
      )}
    </button>
  )
}

// ── Quiz screen ───────────────────────────────────────────────────────────────
function QuizScreen({ stop, questions, onPass, onBack }) {
  const [qIdx,     setQIdx]     = useState(0)
  const [selected, setSelected] = useState(null)   // label of chosen option
  const [wrong,    setWrong]    = useState(false)

  const color   = bg(stop.countryCode)
  const text    = fg(stop.countryCode)
  const q       = questions[qIdx]
  const total   = questions.length
  const correct = q.options.find(o => o.correct)

  function choose(option) {
    if (selected) return   // already answered
    setSelected(option.label)
    if (!option.correct) setWrong(true)
  }

  function next() {
    if (wrong) {
      // reset this question
      setSelected(null)
      setWrong(false)
      return
    }
    if (qIdx + 1 < total) {
      setQIdx(qIdx + 1)
      setSelected(null)
      setWrong(false)
    } else {
      onPass()
    }
  }

  function optionStyle(option) {
    if (!selected) return { background: 'white', border: `2px solid ${color}44`, color: text }
    if (option.correct) return { background: '#22c55e', border: '2px solid #16a34a', color: 'white' }
    if (option.label === selected && !option.correct) return { background: '#ef4444', border: '2px solid #dc2626', color: 'white' }
    return { background: 'white', border: `2px solid ${color}22`, color: text, opacity: 0.45 }
  }

  return (
    <div className="h-full flex flex-col" style={{ background: color + '18' }}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 border-b border-white/60" style={{ background: color }}>
        <button
          onClick={onBack}
          className="min-h-[44px] px-3 py-1 rounded-lg bg-white/30 text-white font-bold text-sm active:scale-95"
        >
          ← Terug
        </button>
        <span className="text-white font-black text-lg flex-1 leading-tight">
          {stop.flag} {shortName(stop.name)}
        </span>
        <span className="text-white/80 text-sm font-semibold">
          {qIdx + 1} / {total}
        </span>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
        <p className="text-2xl font-black text-center leading-tight" style={{ color: text }}>
          {q.q}
        </p>

        {/* Options */}
        <div className="w-full max-w-xl flex flex-col gap-3">
          {q.options.map((option) => (
            <button
              key={option.label}
              onClick={() => choose(option)}
              disabled={!!selected}
              className="w-full min-h-[64px] rounded-2xl px-5 py-3 text-lg font-bold text-left active:scale-95 transition-all"
              style={optionStyle(option)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Feedback + action */}
        {selected && (
          <div className="flex flex-col items-center gap-3 mt-2">
            {wrong ? (
              <>
                <p className="text-base font-semibold text-red-700">
                  Bijna! Het goede antwoord is: <strong>{correct.label}</strong>
                </p>
                <button
                  onClick={next}
                  className="min-h-[56px] px-8 py-3 rounded-2xl text-white font-black text-base active:scale-95"
                  style={{ background: color }}
                >
                  Probeer opnieuw →
                </button>
              </>
            ) : (
              <>
                <p className="text-base font-black text-green-700">✅ Goed zo!</p>
                <button
                  onClick={next}
                  className="min-h-[56px] px-8 py-3 rounded-2xl text-white font-black text-base active:scale-95"
                  style={{ background: color }}
                >
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
function CelebrationScreen({ stop, onBack }) {
  const color = bg(stop.countryCode)
  const text  = fg(stop.countryCode)
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-8" style={{ background: color + '22' }}>
      <p className="text-4xl font-black text-center" style={{ color: text }}>🎉 Stempel verdiend!</p>

      {/* Big stamp */}
      <div
        className="flex flex-col items-center justify-center rounded-3xl p-6 gap-2"
        style={{
          background: 'white',
          boxShadow: `0 0 0 6px ${color}, 0 8px 32px rgba(0,0,0,0.2)`,
          minWidth: 200,
        }}
      >
        <div className="text-7xl leading-none">{stop.flag}</div>
        <p className="text-xl font-black text-center mt-2" style={{ color: text }}>{stop.name}</p>
        <p className="text-base opacity-60" style={{ color: text }}>{stop.country}</p>
        <div
          className="mt-2 w-10 h-10 rounded-full flex items-center justify-center text-2xl text-white font-black"
          style={{ background: color }}
        >
          ✓
        </div>
      </div>

      <button
        onClick={onBack}
        className="min-h-[64px] px-10 py-3 rounded-2xl text-white font-black text-lg active:scale-95"
        style={{ background: color }}
      >
        ← Terug naar paspoort
      </button>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function PaspoortTab({ visitedStopIds, stampedStopIds, activeStopId, onStampEarned }) {
  const stops = tripData.stops
  const [mode,      setMode]      = useState('grid')   // 'grid' | 'quiz' | 'celebrate'
  const [quizStop,  setQuizStop]  = useState(null)

  // Shuffle options once per quiz entry (stable via useMemo key)
  const shuffledQuestions = useMemo(() => {
    if (!quizStop) return []
    return (quizStop.passportQuiz || []).map(q => ({
      ...q,
      options: shuffle(q.options),
    }))
  }, [quizStop?.id])   // re-shuffle only when stop changes

  const unlockedCount = stops.filter(s => stampedStopIds.includes(s.id)).length

  function stampState(stop) {
    if (stampedStopIds.includes(stop.id)) return 'stamped'
    if (visitedStopIds.includes(stop.id)) return 'available'
    return 'locked'
  }

  function openQuiz(stop) {
    setQuizStop(stop)
    setMode('quiz')
  }

  function handlePass() {
    onStampEarned(quizStop.id)
    setMode('celebrate')
  }

  function backToGrid() {
    setMode('grid')
    setQuizStop(null)
  }

  if (mode === 'quiz' && quizStop) {
    return <QuizScreen stop={quizStop} questions={shuffledQuestions} onPass={handlePass} onBack={backToGrid} />
  }
  if (mode === 'celebrate' && quizStop) {
    return <CelebrationScreen stop={quizStop} onBack={backToGrid} />
  }

  return (
    <div className="h-full flex flex-col bg-brand-cream overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-baseline gap-3 px-6 pt-4 pb-1">
        <h1 className="text-2xl font-black text-amber-900">🗒️ Paspoort</h1>
        <span className="text-base font-semibold text-amber-700">{unlockedCount}/{stops.length} stempels</span>
        {visitedStopIds.length === 0 && (
          <span className="text-sm text-amber-600 italic">— doe de quiz voor een stempel!</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex-shrink-0 mx-6 mb-3 h-3 rounded-full bg-amber-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-orange-400 transition-all duration-500"
          style={{ width: `${(unlockedCount / stops.length) * 100}%` }}
        />
      </div>

      {/* 4×3 stamp grid */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="grid grid-cols-4 gap-4" style={{ gridAutoRows: '1fr' }}>
          {stops.map(stop => (
            <Stamp
              key={stop.id}
              stop={stop}
              state={stampState(stop)}
              isCurrent={stop.id === activeStopId}
              onTap={() => openQuiz(stop)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
