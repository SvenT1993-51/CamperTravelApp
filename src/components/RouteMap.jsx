import React, { useState, useEffect, useRef } from 'react'
import mapSvgRaw from '../assets/europe-route-map.svg?raw'
import markersJson from '../data/map-markers.json'

const MARKERS = markersJson.markers
const VB_W = 812
const VB_H = 800

// Maps stop ID → SVG country path ID for country highlighting
const STOP_TO_COUNTRY = {
  home:      'nl',
  karlsruhe: 'de',
  bodensee:  'de',
  zugspitze: 'de',
  lenggries: 'de',
  inzell:    'de',
  kals:      'at',
  antholz:   'it',
  garda:     'it',
  chiavenna: 'it',
  morschach: 'ch',
  colmar:    'fr',
  trier:     'de',
}

// Preprocess SVG string once: make it fill any container
const MAP_SVG = mapSvgRaw
  .replace('width="812"', 'width="100%"')
  .replace('height="800"', 'height="100%"')

function mapLabel(name) {
  const parts = name.split(/\s*[/&]\s*/)
  const first = parts[0].trim()
  if (first.length <= 13) return first
  const shorter = parts.slice(1).find(p => p.trim().length <= 13)
  return shorter ? shorter.trim() : first.slice(0, 12) + '…'
}

export default function RouteMap({ home, stops, activeStopId, onSetActive }) {
  const [settingMode, setSettingMode] = useState(false)
  const mapRef = useRef(null)

  // Index markers by ID for O(1) lookup
  const markerById = Object.fromEntries(MARKERS.map(m => [m.id, m]))

  // Route polyline points: home → stops in order
  const routePoints = ['home', ...stops.map(s => s.id)]
    .map(id => markerById[id])
    .filter(Boolean)
    .map(m => `${m.x},${m.y}`)
    .join(' ')

  // Highlight the active country by adding a gold stroke to its SVG path
  useEffect(() => {
    const svgEl = mapRef.current?.querySelector('svg')
    if (!svgEl) return

    // Clear previous highlight
    svgEl.querySelectorAll('#countries path').forEach(p => {
      p.style.stroke = ''
      p.style.strokeWidth = ''
    })

    if (!activeStopId) return
    const countryId = STOP_TO_COUNTRY[activeStopId]
    if (!countryId) return
    const path = svgEl.querySelector(`#${countryId}`)
    if (!path) return
    path.style.stroke = '#FFD700'
    path.style.strokeWidth = '6'
  }, [activeStopId])

  function handleClick(stopId) {
    if (!settingMode) return
    onSetActive(stopId)
    setSettingMode(false)
  }

  const homeMarker = markerById['home']

  return (
    <div className="flex flex-col h-full">
      {/* Map */}
      <div className="flex-1 relative overflow-hidden rounded-2xl m-3 mb-1 shadow-lg" style={{ background: '#AEE0EF' }}>

        {/* Layer 1 – illustrated SVG base map */}
        <div
          ref={mapRef}
          className="absolute inset-0"
          style={{ lineHeight: 0 }}
          dangerouslySetInnerHTML={{ __html: MAP_SVG }}
        />

        {/* Layer 2 – interactive overlay: route line + markers */}
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="absolute inset-0 w-full h-full"
          style={{ display: 'block' }}
        >
          <defs>
            <filter id="mkSh" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="1" dy="2" stdDeviation="3" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Route dashes */}
          <polyline
            points={routePoints}
            fill="none"
            stroke="#ff6b35"
            strokeWidth="3.5"
            strokeDasharray="12 6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />

          {/* Home marker */}
          {homeMarker && (() => {
            const isActive = activeStopId === 'home'
            return (
              <g
                onClick={() => handleClick('home')}
                style={{ cursor: settingMode ? 'pointer' : 'default' }}
              >
                {isActive && (
                  <circle cx={homeMarker.x} cy={homeMarker.y} r="26" fill="#fbbf24" opacity="0.45" />
                )}
                <circle
                  cx={homeMarker.x} cy={homeMarker.y} r="17"
                  fill="#16a34a" stroke="white" strokeWidth="2.5"
                  filter="url(#mkSh)"
                />
                <text x={homeMarker.x} y={homeMarker.y + 6} textAnchor="middle" fontSize="17">
                  🏠
                </text>
                <foreignObject
                  x={homeMarker.x - 80} y={homeMarker.y - 36}
                  width="160" height="18" overflow="visible"
                >
                  <div style={{
                    fontSize: '10px', fontWeight: 800,
                    color: '#14532d', textAlign: 'center',
                    whiteSpace: 'nowrap',
                    textShadow: '0 0 4px white, 0 0 4px white, 0 0 4px white',
                  }}>
                    {home.flag} {home.name}
                  </div>
                </foreignObject>
                {isActive && (
                  <text x={homeMarker.x + 24} y={homeMarker.y - 10} fontSize="20">🚐</text>
                )}
              </g>
            )
          })()}

          {/* Stop markers */}
          {stops.map(stop => {
            const m = markerById[stop.id]
            if (!m) return null
            const isActive = stop.id === activeStopId
            const r = isActive ? 18 : 14
            return (
              <g
                key={stop.id}
                onClick={() => handleClick(stop.id)}
                style={{ cursor: settingMode ? 'pointer' : 'default' }}
              >
                {isActive && (
                  <circle cx={m.x} cy={m.y} r={r + 8} fill="#fbbf24" opacity="0.45" />
                )}
                <circle
                  cx={m.x} cy={m.y} r={r}
                  fill={isActive ? '#f97316' : '#2563eb'}
                  stroke="white" strokeWidth="2.5"
                  filter="url(#mkSh)"
                />
                <text
                  x={m.x} y={m.y + 4}
                  textAnchor="middle" fontSize="11" fontWeight="900"
                  fill="white"
                >
                  {stop.order}
                </text>
                <foreignObject
                  x={m.x - 80} y={m.y - r - 22}
                  width="160" height="18" overflow="visible"
                >
                  <div style={{
                    fontSize: '10px', fontWeight: 800,
                    color: isActive ? '#92400e' : '#1e3a8a',
                    textAlign: 'center', whiteSpace: 'nowrap',
                    textShadow: '0 0 4px white, 0 0 4px white, 0 0 4px white',
                  }}>
                    {stop.flag} {mapLabel(stop.name)}
                  </div>
                </foreignObject>
                {isActive && (
                  <text x={m.x + 24} y={m.y - 12} fontSize="20">🚐</text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* "We zijn hier" bar */}
      <div className="flex items-center justify-between px-4 py-2 mb-2">
        <div className="text-sm font-semibold text-amber-800">
          {activeStopId
            ? activeStopId === 'home'
              ? `📍 We zijn thuis: ${home.name}`
              : (() => {
                  const s = stops.find(s => s.id === activeStopId)
                  return s ? `📍 We zijn bij: ${s.flag} ${s.name}` : '📍 Kies een plek'
                })()
            : '📍 Kies waar we zijn'}
        </div>
        <button
          onClick={() => setSettingMode(m => !m)}
          className={`min-h-[64px] px-6 py-2 rounded-2xl text-white font-bold text-base shadow-md active:scale-95 transition-transform ${
            settingMode ? 'bg-amber-500 ring-4 ring-amber-300' : 'bg-orange-500'
          }`}
        >
          {settingMode ? '✋ Tik op een stop' : '🚐 We zijn hier'}
        </button>
      </div>
    </div>
  )
}
