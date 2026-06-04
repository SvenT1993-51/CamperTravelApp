import React, { useMemo } from 'react'

// Pure-CSS confetti burst — no libraries, no network. Drop <Confetti /> into a
// relatively-positioned parent and it rains once over ~2.5s, then sits idle.
const COLORS = ['#fb923c', '#fbbf24', '#f472b6', '#34d399', '#60a5fa', '#a78bfa', '#f87171']
const PIECES = 48

export default function Confetti() {
  // Randomised once per mount so each celebration looks a little different
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.9 + Math.random() * 1.4,
        color: COLORS[i % COLORS.length],
        size: 8 + Math.random() * 9,
        drift: (Math.random() - 0.5) * 160,
        spin: 360 + Math.random() * 540,
      })),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-30">
      {/* Animate `top` (relative to the card) — transform-% is relative to the
          piece itself, so translateY never actually falls the full height. */}
      <style>{`
        @keyframes ce-confetti-fall {
          0%   { top: -8%;  transform: translateX(0) rotate(0deg);             opacity: 1; }
          100% { top: 108%; transform: translateX(var(--drift)) rotate(var(--spin)); opacity: 0.9; }
        }
      `}</style>
      {pieces.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-8%',
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 2,
            '--drift': `${p.drift}px`,
            '--spin': `${p.spin}deg`,
            animation: `ce-confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}
