import React, { useState, useEffect } from 'react'
import Confetti from './Confetti.jsx'
import WoordjesSpel from './WoordjesSpel.jsx'

// Tapped-off spot-challenge items, persisted per stop: { [stopId]: number[] }
const SPOT_KEY = 'ce_spotted'
function loadSpotted() {
  try { return JSON.parse(localStorage.getItem(SPOT_KEY) || '{}') } catch { return {} }
}

// Colour per country code — matches the SVG map fills roughly
const COUNTRY_COLORS = {
  DE: { bg: '#E5806B', light: '#fde8e3', text: '#7a2a1a' },
  AT: { bg: '#69B0B6', light: '#e0f4f5', text: '#1a4f53' },
  IT: { bg: '#93C18E', light: '#e6f4e5', text: '#1f4d1d' },
  CH: { bg: '#EF7C58', light: '#fdeee8', text: '#7a2e16' },
  FR: { bg: '#F4C95D', light: '#fdf5dc', text: '#5a460a' },
  NL: { bg: '#7FB99B', light: '#e5f2ec', text: '#1f4f38' },
}

function countryColor(code) {
  return COUNTRY_COLORS[code] ?? { bg: '#f97316', light: '#fff7ed', text: '#7c2d12' }
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <p className="text-sm font-black uppercase tracking-wider mb-2 opacity-60">{title}</p>
      {children}
    </div>
  )
}

export default function StopCard({ stop }) {
  const [surpriseOpen, setSurpriseOpen] = useState(false)
  const [spotted, setSpotted] = useState(() => loadSpotted()[stop.id] ?? [])
  const [celebrate, setCelebrate] = useState(false)
  const [gameOpen, setGameOpen] = useState(false)
  const col = countryColor(stop.countryCode)

  // Reload ticks (and drop any lingering confetti / open game) when the card switches stops
  useEffect(() => {
    setSpotted(loadSpotted()[stop.id] ?? [])
    setCelebrate(false)
    setGameOpen(false)
  }, [stop.id])

  // Confetti rains once, then clears itself
  useEffect(() => {
    if (!celebrate) return
    const t = setTimeout(() => setCelebrate(false), 2600)
    return () => clearTimeout(t)
  }, [celebrate])

  function toggleSpot(i) {
    const next = spotted.includes(i) ? spotted.filter(x => x !== i) : [...spotted, i]
    const all = loadSpotted()
    all[stop.id] = next
    localStorage.setItem(SPOT_KEY, JSON.stringify(all))
    // Fire only on the moment the last one gets ticked, not on un-ticking
    const nowAll = stop.spotChallenge.every((_, idx) => next.includes(idx))
    if (nowAll && !allSpotted) setCelebrate(true)
    setSpotted(next)
  }

  const hasFacts      = stop.funFacts?.length > 0
  const hasPhrases    = stop.phrases?.length > 0
  const canPlay       = stop.phrases?.length >= 2
  const hasHighlights = stop.highlights?.length > 0
  const hasChallenge  = stop.spotChallenge?.length > 0
  const allSpotted    = hasChallenge && stop.spotChallenge.every((_, i) => spotted.includes(i))
  const hasContent    = hasFacts || hasPhrases || hasHighlights || hasChallenge
  const nightLabel    = stop.nights === 1 ? '1 nacht' : `${stop.nights} nachten`

  return (
    <div className="relative h-full flex flex-col" style={{ background: col.light }}>
      {celebrate && <Confetti />}
      {gameOpen && <WoordjesSpel stop={stop} col={col} onClose={() => setGameOpen(false)} />}
      {/* ── Header ── */}
      <div
        className="px-4 pt-4 pb-3 flex-shrink-0"
        style={{ background: col.bg }}
      >
        <div className="text-5xl leading-none mb-2">{stop.flag}</div>
        <h2 className="text-2xl font-black leading-tight" style={{ color: col.text }}>
          {stop.name}
        </h2>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span
            className="text-sm font-bold px-3 py-1 rounded-full bg-white/40"
            style={{ color: col.text }}
          >
            {stop.country}
          </span>
          <span
            className="text-sm font-bold px-3 py-1 rounded-full bg-white/40"
            style={{ color: col.text }}
          >
            🌙 {nightLabel}
          </span>
          {stop.language && (
            <span
              className="text-sm font-bold px-3 py-1 rounded-full bg-white/40"
              style={{ color: col.text }}
            >
              💬 {stop.language.name}
            </span>
          )}
        </div>
        {/* Twist banner */}
        {stop.twist && (
          <div className="mt-2 text-sm font-bold bg-white/50 rounded-lg px-3 py-1.5" style={{ color: col.text }}>
            ✨ {stop.twist}
          </div>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-3" style={{ color: col.text }}>

        {!hasContent && (
          <div className="text-center mt-10 opacity-50">
            <div className="text-5xl mb-3">🚧</div>
            <p className="text-base font-semibold">Meer info volgt binnenkort!</p>
          </div>
        )}

        {/* Fun facts */}
        {hasFacts && (
          <Section title="Weetjes">
            <ul className="space-y-3">
              {stop.funFacts.map((f, i) => (
                <li key={i} className="flex gap-2 text-base leading-snug">
                  <span className="flex-shrink-0 mt-0.5">💡</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Phrases */}
        {hasPhrases && (
          <Section title="Spreek mee!">
            <div className="space-y-2">
              {stop.phrases.map((p, i) => (
                <div key={i} className="flex items-baseline gap-2 text-base">
                  <span className="font-semibold w-28 flex-shrink-0">{p.nl}</span>
                  <span className="font-black">{p.local}</span>
                  <span className="text-sm opacity-60 italic">({p.say})</span>
                </div>
              ))}
            </div>
            {canPlay && (
              <button
                onClick={() => setGameOpen(true)}
                className="mt-3 w-full rounded-xl py-3 px-4 text-base font-black text-white shadow active:scale-95 transition-transform flex items-center justify-center gap-2"
                style={{ background: col.bg }}
              >
                🃏 Speel het woordjes-spel!
              </button>
            )}
          </Section>
        )}

        {/* Highlights */}
        {hasHighlights && (
          <Section title="Hoogtepunten">
            <div className="space-y-3">
              {stop.highlights.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-2xl flex-shrink-0">{h.emoji}</span>
                  <div>
                    <p className="text-base font-bold leading-tight">{h.title}</p>
                    <p className="text-sm opacity-70 leading-snug">{h.blurb}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Spot challenge — tap each one off when you spot it for real */}
        {hasChallenge && (
          <Section title={allSpotted ? 'Zoek dit! — allemaal gevonden! 🎉' : 'Zoek dit!'}>
            <ul className="space-y-2">
              {stop.spotChallenge.map((s, i) => {
                const done = spotted.includes(i)
                return (
                  <li key={i}>
                    <button
                      onClick={() => toggleSpot(i)}
                      className="w-full flex gap-3 items-center text-left min-h-[64px] rounded-2xl px-3 py-2 active:scale-95 transition-transform"
                      style={{
                        background: done ? col.bg : 'white',
                        boxShadow: done ? 'none' : `inset 0 0 0 2px ${col.bg}44`,
                      }}
                    >
                      <span
                        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xl font-black"
                        style={{
                          background: done ? 'white' : col.bg + '22',
                          color: done ? col.bg : col.text,
                        }}
                      >
                        {done ? '✓' : i + 1}
                      </span>
                      <span
                        className="text-base font-semibold leading-snug"
                        style={{ color: done ? 'white' : col.text }}
                      >
                        {s}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {allSpotted && (
              <>
                <style>{`
                  @keyframes ce-badge-pop {
                    0%   { transform: scale(0.6); opacity: 0; }
                    60%  { transform: scale(1.08); opacity: 1; }
                    100% { transform: scale(1); }
                  }
                `}</style>
                <div
                  className="mt-4 rounded-2xl px-4 py-4 text-center"
                  style={{
                    background: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 55%, #fb923c 100%)',
                    border: '3px solid #fffaf0',
                    boxShadow: '0 6px 20px rgba(245,158,11,0.5)',
                    animation: 'ce-badge-pop 0.5s ease-out',
                  }}
                >
                  <div className="text-4xl leading-none mb-1">🏅</div>
                  <p className="text-white font-black text-xl leading-tight drop-shadow-sm">
                    Speurder!
                  </p>
                  <p className="text-white font-bold text-sm opacity-95">
                    Je hebt alles gevonden!
                  </p>
                </div>
              </>
            )}
          </Section>
        )}

        {/* Surprise */}
        {stop.surprise && (
          <div className="mt-2 mb-4">
            {surpriseOpen ? (
              <div
                className="rounded-xl p-4 text-base font-semibold"
                style={{ background: col.bg + '55' }}
              >
                🤩 {stop.surprise}
              </div>
            ) : (
              <button
                onClick={() => setSurpriseOpen(true)}
                className="w-full rounded-xl py-3 px-4 text-base font-black text-white shadow active:scale-95 transition-transform"
                style={{ background: col.bg }}
              >
                🎁 Geheim weetje!
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
