import React, { useState } from 'react'

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
  const col = countryColor(stop.countryCode)

  const hasFacts      = stop.funFacts?.length > 0
  const hasPhrases    = stop.phrases?.length > 0
  const hasHighlights = stop.highlights?.length > 0
  const hasChallenge  = stop.spotChallenge?.length > 0
  const hasContent    = hasFacts || hasPhrases || hasHighlights || hasChallenge
  const nightLabel    = stop.nights === 1 ? '1 nacht' : `${stop.nights} nachten`

  return (
    <div className="h-full flex flex-col" style={{ background: col.light }}>
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

        {/* Spot challenge */}
        {hasChallenge && (
          <Section title="Zoek dit!">
            <ul className="space-y-2">
              {stop.spotChallenge.map((s, i) => (
                <li key={i} className="flex gap-2 text-base items-start">
                  <span className="flex-shrink-0 font-black opacity-40">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
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
