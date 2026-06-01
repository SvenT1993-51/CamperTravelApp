import React from 'react'

const COUNTRY_BG = {
  DE: '#E5806B', AT: '#69B0B6', IT: '#93C18E',
  CH: '#EF7C58', FR: '#F4C95D', NL: '#7FB99B',
}
const bg = (c) => COUNTRY_BG[c] ?? '#f97316'

const NL_MONTHS = ['JAN','FEB','MRT','APR','MEI','JUN',
                   'JUL','AUG','SEP','OKT','NOV','DEC']

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getDate()} ${NL_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function shortName(name) {
  const p = name.split(/\s*[/&]\s*/)[0].trim()
  return p.length > 12 ? p.slice(0, 11) + '…' : p
}

// Deterministic rotation per stop so the grid looks like a real stamped passport
function stampRotation(order) {
  return ((order * 53) % 21) - 10   // -10 … +10 degrees
}

export default function PassportStamp({ stop, date, size = 180 }) {
  const color    = bg(stop.countryCode)
  const rotation = stampRotation(stop.order)
  const uid      = stop.id           // unique across all stops → safe SVG id

  const R  = 80   // inner ring
  const RD = 92   // outer dashed ring
  const RS = 86   // star ring (between inner and outer)

  const cx = 100
  const cy = 100

  // Arc path helpers (center 100,100)
  const topArc = `M ${cx - R},${cy} A ${R},${R} 0 0,0 ${cx + R},${cy}`
  const botArc = `M ${cx - R},${cy} A ${R},${R} 0 0,1 ${cx + R},${cy}`

  const dateStr = fmtDate(date)

  return (
    <div
      style={{
        display:     'inline-block',
        lineHeight:  0,
        transform:   `rotate(${rotation}deg)`,
        // subtle ink bleed effect
        filter:      'drop-shadow(0 2px 6px rgba(0,0,0,0.20))',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
      >
        <defs>
          <path id={`st-${uid}`}  d={topArc} />
          <path id={`sb-${uid}`}  d={botArc} />
        </defs>

        {/* Outer dashed ring */}
        <circle cx={cx} cy={cy} r={RD}
          fill="none" stroke={color} strokeWidth="3.5" strokeDasharray="5 3" />

        {/* 8 stars between rings */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * 45 - 90) * (Math.PI / 180)
          return (
            <text key={i}
              x={cx + RS * Math.cos(a)}
              y={cy + RS * Math.sin(a) + 4}
              textAnchor="middle"
              fontSize="9"
              fontWeight="900"
              fill={color}
            >
              ★
            </text>
          )
        })}

        {/* Inner solid ring */}
        <circle cx={cx} cy={cy} r={R}
          fill="none" stroke={color} strokeWidth="2" />

        {/* Tinted fill */}
        <circle cx={cx} cy={cy} r={R - 1}
          fill={color} fillOpacity="0.14" />

        {/* Country name — top arc (sb path renders along the top visually) */}
        <text fontSize="13" fontWeight="900" fill={color} letterSpacing="2">
          <textPath href={`#sb-${uid}`} startOffset="50%" textAnchor="middle">
            {stop.country.toUpperCase()}
          </textPath>
        </text>

        {/* Flag emoji — foreignObject so it renders as image on iOS */}
        <foreignObject x="60" y="50" width="80" height="66">
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              textAlign:  'center',
              fontSize:   '3rem',
              lineHeight: '66px',
              userSelect: 'none',
            }}
          >
            {stop.flag}
          </div>
        </foreignObject>

        {/* Stop name */}
        <text x={cx} y="140"
          textAnchor="middle"
          fontSize="13"
          fontWeight="800"
          fill={color}
        >
          {shortName(stop.name)}
        </text>

        {/* Date — bottom arc */}
        {dateStr && (
          <text fontSize="10" fill={color} fillOpacity="0.8" letterSpacing="1">
            <textPath href={`#sb-${uid}`} startOffset="50%" textAnchor="middle">
              {dateStr}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  )
}
