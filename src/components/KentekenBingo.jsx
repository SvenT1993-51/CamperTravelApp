import React, { useState, useEffect } from 'react'
import Confetti from './Confetti.jsx'

// Kenteken-bingo: a real bingo card for long drives. A 3×3 card of countries;
// tap a country when you spot its plate. A full row, column, or diagonal = BINGO!
// The whole card = volle kaart. Fully offline. Persists to ce_kenteken as
// { card, marked, spottedEver, everBingo } so a mid-drive reload keeps progress.
const LS_KENTEKEN = 'ce_kenteken'

// Country letter codes are the real EU plate codes.
const TRIP_COUNTRIES = [
  { code: 'NL', plate: 'NL', flag: '🇳🇱', name: 'Nederland' },
  { code: 'DE', plate: 'D',  flag: '🇩🇪', name: 'Duitsland' },
  { code: 'AT', plate: 'A',  flag: '🇦🇹', name: 'Oostenrijk' },
  { code: 'IT', plate: 'I',  flag: '🇮🇹', name: 'Italië' },
  { code: 'CH', plate: 'CH', flag: '🇨🇭', name: 'Zwitserland' },
  { code: 'FR', plate: 'F',  flag: '🇫🇷', name: 'Frankrijk' },
]
const BONUS_COUNTRIES = [
  { code: 'BE', plate: 'B',  flag: '🇧🇪', name: 'België' },
  { code: 'LU', plate: 'L',  flag: '🇱🇺', name: 'Luxemburg' },
  { code: 'PL', plate: 'PL', flag: '🇵🇱', name: 'Polen' },
  { code: 'CZ', plate: 'CZ', flag: '🇨🇿', name: 'Tsjechië' },
  { code: 'DK', plate: 'DK', flag: '🇩🇰', name: 'Denemarken' },
  { code: 'ES', plate: 'E',  flag: '🇪🇸', name: 'Spanje' },
]
const BY_CODE = Object.fromEntries([...TRIP_COUNTRIES, ...BONUS_COUNTRIES].map(c => [c.code, c]))
const TRIP_CODES = TRIP_COUNTRIES.map(c => c.code)

// Rows, columns, diagonals of a 3×3 card
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// A card is the 6 trip countries + 3 random rare ones, shuffled — always winnable.
function newCard() {
  const rare = shuffle(BONUS_COUNTRIES).slice(0, 3).map(c => c.code)
  return shuffle([...TRIP_CODES, ...rare])
}

function countLines(card, markedSet) {
  return LINES.filter(l => l.every(i => markedSet.has(card[i]))).length
}
function bingoCells(card, markedSet) {
  const cells = new Set()
  for (const l of LINES) if (l.every(i => markedSet.has(card[i]))) l.forEach(i => cells.add(i))
  return cells
}

function freshState() {
  return { card: newCard(), marked: [], spottedEver: [], everBingo: false }
}
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KENTEKEN))
    if (s && Array.isArray(s.card) && s.card.length === 9) {
      return {
        card: s.card,
        marked: Array.isArray(s.marked) ? s.marked : [],
        spottedEver: Array.isArray(s.spottedEver) ? s.spottedEver : [],
        everBingo: !!s.everBingo,
      }
    }
  } catch { /* fall through */ }
  return freshState()
}

// One bingo cell — tap to daub, tap again to undo an accidental tap.
function BingoCell({ code, marked, inBingo, onToggle }) {
  const c = BY_CODE[code]
  return (
    <button
      onClick={onToggle}
      className="relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 min-h-[128px] active:scale-95 transition-transform"
      style={{
        background: marked ? '#dcfce7' : 'white',
        boxShadow: inBingo
          ? '0 0 0 4px #f59e0b, 0 6px 18px rgba(245,158,11,0.45)'
          : marked ? '0 0 0 3px #22c55e' : '0 2px 8px rgba(0,0,0,0.12)',
      }}
    >
      <span className="text-5xl leading-none">{c.flag}</span>
      <span className="text-sm font-black text-amber-900 leading-tight text-center">{c.name}</span>
      <span className="inline-flex items-center justify-center rounded-full border-2 border-gray-800 bg-white px-3 py-0.5">
        <span className="text-sm font-black tracking-widest text-gray-900">{c.plate}</span>
      </span>
      {marked && (
        <span
          className="absolute top-1 right-1 w-10 h-10 flex items-center justify-center rounded-full bg-green-500 text-white text-xl font-black shadow"
          style={{ animation: 'ce-daub 0.3s ease-out' }}
        >
          ✓
        </span>
      )}
    </button>
  )
}

export default function KentekenBingo({ onClose }) {
  const [state,        setState]        = useState(loadState)
  const [celebrate,    setCelebrate]    = useState(null) // null | { kind: 'first'|'bingo'|'full' }
  const [confirmReset, setConfirmReset] = useState(false)

  const { card, marked } = state
  const markedSet = new Set(marked)
  const lines = countLines(card, markedSet)
  const litCells = bingoCells(card, markedSet)

  function save(next) {
    localStorage.setItem(LS_KENTEKEN, JSON.stringify(next))
    setState(next)
  }

  function toggle(code) {
    const wasMarked = marked.includes(code)
    const nextMarked = wasMarked ? marked.filter(c => c !== code) : [...marked, code]
    const before = lines
    const after = countLines(card, new Set(nextMarked))
    const spottedEver = wasMarked ? state.spottedEver : Array.from(new Set([...state.spottedEver, code]))
    const everBingo = state.everBingo || after >= 1
    save({ card, marked: nextMarked, spottedEver, everBingo })

    if (!wasMarked) {
      if (nextMarked.length === 9)      setCelebrate({ kind: 'full' })
      else if (after > before)          setCelebrate({ kind: 'bingo' })
      else if (state.spottedEver.length === 0) setCelebrate({ kind: 'first' })
    }
  }

  function doNewCard() {
    save({ ...state, card: newCard(), marked: [] })
    setConfirmReset(false)
  }

  // Celebration clears itself
  useEffect(() => {
    if (!celebrate) return
    const t = setTimeout(() => setCelebrate(null), 2800)
    return () => clearTimeout(t)
  }, [celebrate])

  // Reset confirmation auto-cancels so it can't sit armed
  useEffect(() => {
    if (!confirmReset) return
    const t = setTimeout(() => setConfirmReset(false), 4000)
    return () => clearTimeout(t)
  }, [confirmReset])

  const bigBanner = celebrate && (celebrate.kind === 'bingo' || celebrate.kind === 'full')

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-brand-cream">
      <style>{`
        @keyframes ce-daub  { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.3)} 100%{transform:scale(1);opacity:1} }
        @keyframes ce-bingo { 0%{transform:scale(0.4);opacity:0} 55%{transform:scale(1.12);opacity:1} 100%{transform:scale(1)} }
      `}</style>
      {celebrate && <Confetti />}

      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-orange-500 shadow-md">
        <button
          onClick={onClose}
          aria-label="Sluiten"
          className="min-h-tap min-w-tap flex items-center justify-center rounded-2xl bg-white/25 text-white text-2xl font-black active:scale-95 transition-transform"
        >
          ✕
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-white font-black text-lg leading-tight">🚗 Kenteken-bingo</div>
          <div className="text-white/90 font-bold text-sm leading-tight">
            {marked.length}/9 gespot{lines > 0 ? ` · ${lines} bingo${lines === 1 ? '' : 's'}! 🎉` : ''}
          </div>
        </div>
        {confirmReset ? (
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">Nieuwe kaart?</span>
            <button onClick={doNewCard}
              className="min-h-tap px-5 rounded-2xl bg-white text-orange-600 font-black active:scale-95 transition-transform">
              Ja
            </button>
            <button onClick={() => setConfirmReset(false)}
              className="min-h-tap px-5 rounded-2xl bg-white/25 text-white font-black active:scale-95 transition-transform">
              Nee
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)}
            className="min-h-tap px-4 rounded-2xl bg-white/25 text-white font-black text-sm active:scale-95 transition-transform">
            🔄 Nieuwe kaart
          </button>
        )}
      </div>

      {/* Bingo card */}
      <div className="relative flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-4">
        <div className="grid grid-cols-3 gap-3 w-full max-w-3xl">
          {card.map((code, i) => (
            <BingoCell
              key={code}
              code={code}
              marked={markedSet.has(code)}
              inBingo={litCells.has(i)}
              onToggle={() => toggle(code)}
            />
          ))}
        </div>
        <p className="mt-4 text-sm font-bold text-amber-700 text-center">
          Tik een land als je 'm spot. Hele rij, kolom of diagonaal = BINGO!
        </p>

        {/* Big celebration banner */}
        {bigBanner && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div
              className="px-10 py-6 rounded-3xl bg-white text-center shadow-2xl border-4 border-orange-400"
              style={{ animation: 'ce-bingo 0.5s ease-out' }}
            >
              <div className="text-6xl leading-none mb-1">{celebrate.kind === 'full' ? '🌟' : '🎉'}</div>
              <div className="text-4xl font-black text-orange-600">
                {celebrate.kind === 'full' ? 'VOLLE KAART!' : 'BINGO!'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
