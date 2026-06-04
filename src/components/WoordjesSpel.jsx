import React, { useState, useMemo, useEffect } from 'react'
import Confetti from './Confetti.jsx'

const LS_WORDSTARS = 'ce_wordstars' // { [stopId]: bestStars } — feeds the Trofeeënkamer

// Memory matching game built from a stop's phrases: match each Dutch word to
// its local word. Fully offline; opens as a full-screen overlay so it gets the
// whole landscape tablet instead of the narrow stop-card panel.

// Playful, varied card backs — no misleading single flag
const BACK_ICONS = ['🗺️', '🧭', '🛣️', '🚐', '⛰️', '🎒', '📸', '🌍', '🧳', '⛺']
const CHEERS = ['Yes!', 'Goed zo!', 'Knap!', 'Super!', 'Toppie!', 'Hoera!']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function WoordjesSpel({ stop, col, onClose }) {
  // Up to 6 pairs keeps the grid friendly for little ones
  const pairs = useMemo(() => stop.phrases.slice(0, 6), [stop.id])

  const [round, setRound] = useState(0) // bump to reshuffle / restart
  const cards = useMemo(
    () =>
      shuffle(
        pairs.flatMap((p, i) => [
          { key: `nl-${i}`,  pairId: i, side: 'nl',    text: p.nl },
          { key: `loc-${i}`, pairId: i, side: 'local', text: p.local, say: p.say },
        ]),
      ),
    [stop.id, round], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const [flipped,  setFlipped]  = useState([]) // card keys currently face-up
  const [matched,  setMatched]  = useState([]) // pairIds solved
  const [tries,    setTries]    = useState(0)
  const [lock,     setLock]     = useState(false)
  const [feedback, setFeedback] = useState(null) // { keys, kind: 'right'|'wrong' }
  const [cheer,    setCheer]    = useState(null)

  const won = matched.length === pairs.length
  const progress = matched.length / pairs.length

  // 3 stars for a sharp game, down to 1 for lots of tries
  const stars = tries <= Math.ceil(pairs.length * 1.5)
    ? 3
    : tries <= Math.ceil(pairs.length * 2.5)
      ? 2
      : 1

  function flip(card) {
    if (lock || flipped.includes(card.key) || matched.includes(card.pairId)) return
    const next = [...flipped, card.key]
    setFlipped(next)
    if (next.length < 2) return

    setTries(t => t + 1)
    setLock(true)
    const [a, b] = next.map(k => cards.find(c => c.key === k))
    if (a.pairId === b.pairId) {
      setFeedback({ keys: next, kind: 'right' })
      setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)])
      setTimeout(() => {
        setMatched(m => [...m, a.pairId])
        setFlipped([]); setLock(false); setFeedback(null)
      }, 700)
      setTimeout(() => setCheer(null), 1000)
    } else {
      setFeedback({ keys: next, kind: 'wrong' })
      setTimeout(() => { setFlipped([]); setLock(false); setFeedback(null) }, 1050)
    }
  }

  function restart() {
    setFlipped([]); setMatched([]); setTries(0); setLock(false)
    setFeedback(null); setCheer(null)
    setRound(r => r + 1)
  }

  // Persist the best star score for this stop when the game is won
  useEffect(() => {
    if (!won) return
    let all = {}
    try { all = JSON.parse(localStorage.getItem(LS_WORDSTARS)) || {} } catch { all = {} }
    all[stop.id] = Math.max(all[stop.id] ?? 0, stars)
    localStorage.setItem(LS_WORDSTARS, JSON.stringify(all))
  }, [won]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: col.light }}>
      <style>{`
        @keyframes ce-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(4px)} }
        @keyframes ce-pop   { 0%{transform:scale(1)} 50%{transform:scale(1.12)} 100%{transform:scale(1)} }
        @keyframes ce-cheer { 0%{transform:translate(-50%,10px) scale(0.6);opacity:0} 25%{transform:translate(-50%,0) scale(1.1);opacity:1} 70%{opacity:1} 100%{transform:translate(-50%,-28px) scale(1);opacity:0} }
        @keyframes ce-star  { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.3)} 100%{transform:scale(1);opacity:1} }
      `}</style>

      {won && <Confetti />}

      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3" style={{ background: col.bg }}>
        <button
          onClick={onClose}
          className="min-h-[44px] px-3 py-1 rounded-lg bg-white/30 text-white font-bold text-sm active:scale-95"
        >
          ← Terug
        </button>
        <span className="flex-1 text-white font-black text-lg leading-tight">
          {stop.flag} Woordjes-spel
        </span>
        <span className="text-white/90 font-bold text-sm whitespace-nowrap">
          🎯 {tries} {tries === 1 ? 'poging' : 'pogingen'}
        </span>
      </div>

      {/* Wegrace — camper drives to the finish flag as pairs are found */}
      <div className="flex-shrink-0 px-5 pt-3">
        <div className="relative h-7 rounded-full bg-white/70 shadow-inner">
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ width: `${progress * 100}%`, background: col.bg, transition: 'width 0.4s ease' }}
          />
          <span className="absolute top-1/2 right-1.5 text-lg" style={{ transform: 'translateY(-50%)' }}>🏁</span>
          <span
            className="absolute text-2xl"
            style={{
              left: `${progress * 100}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              transition: 'left 0.4s ease',
            }}
          >
            🚐
          </span>
        </div>
      </div>

      {/* Card grid */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        {/* Aanmoediging — pops up on a match */}
        {cheer && (
          <div
            className="absolute left-1/2 z-40 pointer-events-none"
            style={{ top: '24%', animation: 'ce-cheer 1s ease-out forwards' }}
          >
            <span
              className="text-5xl font-black"
              style={{ color: col.bg, WebkitTextStroke: '1px white', textShadow: '0 3px 8px rgba(0,0,0,0.25)' }}
            >
              {cheer} 🎉
            </span>
          </div>
        )}

        <div
          className="grid gap-3 w-full max-w-5xl"
          style={{ gridTemplateColumns: `repeat(${pairs.length}, minmax(0, 1fr))` }}
        >
          {cards.map((card, i) => {
            const isUp      = flipped.includes(card.key) || matched.includes(card.pairId)
            const isMatched = matched.includes(card.pairId)
            const fb        = feedback && feedback.keys.includes(card.key) ? feedback.kind : null
            const anim      = fb === 'wrong' ? 'ce-shake 0.45s' : fb === 'right' ? 'ce-pop 0.5s' : undefined
            return (
              <button
                key={card.key}
                onClick={() => flip(card)}
                disabled={isUp || lock}
                className="relative w-full"
                style={{ height: 140, perspective: 800, animation: anim }}
              >
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.35s',
                    transform: isUp ? 'rotateY(180deg)' : 'none',
                  }}
                >
                  {/* Back (face-down) */}
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      backfaceVisibility: 'hidden',
                      borderRadius: 16, background: col.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.18)',
                    }}
                  >
                    <span style={{ fontSize: 44, opacity: 0.92 }}>
                      {BACK_ICONS[i % BACK_ICONS.length]}
                    </span>
                  </div>
                  {/* Front (face-up) */}
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      borderRadius: 16,
                      background: isMatched ? '#dcfce7' : 'white',
                      border: `3px solid ${isMatched ? '#22c55e' : col.bg}`,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8,
                    }}
                  >
                    <span className="font-black text-center leading-tight"
                          style={{ color: col.text, fontSize: 18 }}>
                      {card.text}
                    </span>
                    {card.side === 'local'
                      ? <span className="italic" style={{ fontSize: 12, color: col.text, opacity: 0.6 }}>
                          ({card.say})
                        </span>
                      : <span style={{ fontSize: 14, opacity: 0.55 }}>🇳🇱</span>}
                    {isMatched && <span style={{ fontSize: 16 }}>✅</span>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Win banner */}
      {won && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-6 pointer-events-none">
          <div
            className="pointer-events-auto bg-white rounded-3xl shadow-2xl px-8 py-6 text-center max-w-sm"
            style={{ border: `4px solid ${col.bg}` }}
          >
            <div className="flex justify-center gap-1 mb-2">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  style={{ fontSize: 48, animation: `ce-star 0.45s ease-out ${0.15 * i}s both` }}
                >
                  {i < stars ? '⭐' : '☆'}
                </span>
              ))}
            </div>
            <p className="text-2xl font-black mb-1" style={{ color: col.text }}>
              {stars === 3 ? 'Geweldig!' : stars === 2 ? 'Goed gedaan!' : 'Gelukt!'}
            </p>
            <p className="text-base font-bold text-gray-600 mb-5">
              Alle woordjes gevonden in {tries} {tries === 1 ? 'poging' : 'pogingen'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={restart}
                className="min-h-[56px] px-6 rounded-2xl text-white font-black active:scale-95"
                style={{ background: col.bg }}
              >
                🔄 Opnieuw
              </button>
              <button
                onClick={onClose}
                className="min-h-[56px] px-6 rounded-2xl font-black text-gray-700 bg-gray-200 active:scale-95"
              >
                Klaar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
