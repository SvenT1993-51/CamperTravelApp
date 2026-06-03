import React, { useState, useEffect, useRef } from 'react'
import mapSvgRaw from '../assets/europe-route-map.svg?raw'
import markersJson from '../data/map-markers.json'

const MARKERS = markersJson.markers
const VB_W = 812
const VB_H = 800
const MAX_SCALE = 4

// Country label positions — placed in open space inside each country shape
const COUNTRY_LABELS = [
  { name: 'NEDERLAND',   x: 155,  y: 52  },
  { name: 'BELGIË',      x: 95,   y: 213 },
  { name: 'DUITSLAND',   x: 490,  y: 178 },
  { name: 'FRANKRIJK',   x: 78,   y: 420 },
  { name: 'ZWITSERLAND', x: 265,  y: 572 },
  { name: 'OOSTENRIJK',  x: 718,  y: 420 },
  { name: 'ITALIË',      x: 420,  y: 742 },
]

// One bold signature emoji per country, set in its open interior — clear of
// the route line, the numbered stop pins, and the country name labels.
const COUNTRY_DECOR = [
  { e: '🌷',  x: 126, y: 90,  s: 44 }, // Nederland — tulp
  { e: '🍟',  x: 104, y: 186, s: 50 }, // België — friet
  { e: '🏰',  x: 538, y: 246, s: 56 }, // Duitsland — kasteel
  { e: '🏔️', x: 735, y: 466, s: 52 }, // Oostenrijk — bergen
  { e: '🍫',  x: 305, y: 596, s: 48 }, // Zwitserland — chocola
  { e: '🗼',  x: 85,  y: 486, s: 58 }, // Frankrijk — Eiffeltoren
  { e: '🍕',  x: 448, y: 708, s: 56 }, // Italië — pizza
]

// Camper van rides this high above the route line / parks above a pin
const VAN_DY = 23

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

// Catmull-Rom → cubic bezier: smooth curve through all route points
function buildCurvedPath(pts) {
  if (pts.length < 2) return ''
  const tension = 0.4
  const d = [`M ${pts[0].x},${pts[0].y}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const cp1x = p1.x + (p2.x - p0.x) * tension / 2
    const cp1y = p1.y + (p2.y - p0.y) * tension / 2
    const cp2x = p2.x - (p3.x - p1.x) * tension / 2
    const cp2y = p2.y - (p3.y - p1.y) * tension / 2
    d.push(`C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x},${p2.y}`)
  }
  return d.join(' ')
}

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
  const mapRef      = useRef(null)
  const containerRef = useRef(null)
  const gestureRef  = useRef(null)

  // Zoom state: ref for gesture callbacks (no stale closures), state for rendering
  const zoomRef = useRef({ scale: 1, tx: 0, ty: 0 })
  const [zoom,  setZoom]  = useState({ scale: 1, tx: 0, ty: 0 })
  const [isAnimating, setIsAnimating] = useState(false)

  // ── Driving van ──────────────────────────────────────────────────────────
  // The van rides the route path. On each stop change it animates from the old
  // waypoint to the new one (forwards or backwards), then parks with a bob.
  const routeRef    = useRef(null)   // the drawn route <path>, for getPointAtLength
  const wpLenRef    = useRef(null)   // path length at each waypoint [home, ...stops]
  const vanGRef     = useRef(null)   // outer <g> we move along the road
  const vanFlipRef  = useRef(null)   // inner <g> we mirror to face travel direction
  const animRef     = useRef(0)      // current rAF id
  const prevIdxRef  = useRef(null)   // last parked waypoint index
  const initRef     = useRef(false)  // have we placed the van the first time?
  const home0       = MARKERS.find(m => m.id === 'home')
  const [vanPark, setVanPark] = useState({ x: home0.x, y: home0.y - VAN_DY, flip: false })
  const [driving, setDriving] = useState(false)

  // Waypoint index of the active stop (home = 0); default home when nothing set
  const routeIds = ['home', ...stops.map(s => s.id)]
  function currentIdx() {
    const i = routeIds.indexOf(activeStopId)
    return i < 0 ? 0 : i
  }

  function applyZoom(z) {
    zoomRef.current = z
    setZoom(z)
  }

  function clampedZoom(scale, tx, ty) {
    const el = containerRef.current
    const w = el ? el.clientWidth  : 800
    const h = el ? el.clientHeight : 600
    const s = Math.min(Math.max(scale, 1), MAX_SCALE)
    const maxX = (s - 1) * w / 2
    const maxY = (s - 1) * h / 2
    return {
      scale: s,
      tx: Math.min(Math.max(tx, -maxX), maxX),
      ty: Math.min(Math.max(ty, -maxY), maxY),
    }
  }

  // Non-passive touch listeners so preventDefault works (required in modern browsers)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function onTouchStart(e) {
      if (e.touches.length === 1) {
        gestureRef.current = {
          type: 'pan',
          startX:  e.touches[0].clientX,
          startY:  e.touches[0].clientY,
          baseTx:  zoomRef.current.tx,
          baseTy:  zoomRef.current.ty,
          moved:   false,
        }
      } else if (e.touches.length === 2) {
        const t0 = e.touches[0], t1 = e.touches[1]
        gestureRef.current = {
          type:       'pinch',
          startDist:  Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY),
          midX:       (t0.clientX + t1.clientX) / 2,
          midY:       (t0.clientY + t1.clientY) / 2,
          baseScale:  zoomRef.current.scale,
          baseTx:     zoomRef.current.tx,
          baseTy:     zoomRef.current.ty,
        }
      }
    }

    function onTouchMove(e) {
      const g = gestureRef.current
      if (!g) return

      if (g.type === 'pan' && e.touches.length === 1) {
        const dx = e.touches[0].clientX - g.startX
        const dy = e.touches[0].clientY - g.startY
        // Don't steal taps — only start panning after clear drag intent
        if (!g.moved && Math.hypot(dx, dy) < 10) return
        g.moved = true
        e.preventDefault()
        applyZoom(clampedZoom(zoomRef.current.scale, g.baseTx + dx, g.baseTy + dy))

      } else if (g.type === 'pinch' && e.touches.length >= 2) {
        e.preventDefault()
        const t0 = e.touches[0], t1 = e.touches[1]
        const dist     = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY)
        const newScale = g.baseScale * dist / g.startDist

        // Keep pinch midpoint fixed: adjust tx/ty so that map point under fingers stays put
        const rect = el.getBoundingClientRect()
        const cx   = rect.left + rect.width  / 2
        const cy   = rect.top  + rect.height / 2
        const ratio   = newScale / g.baseScale
        const rawTx   = (g.midX - cx) * (1 - ratio) + g.baseTx * ratio
        const rawTy   = (g.midY - cy) * (1 - ratio) + g.baseTy * ratio
        applyZoom(clampedZoom(newScale, rawTx, rawTy))
      }
    }

    function onTouchEnd() {
      const g = gestureRef.current
      gestureRef.current = null
      // Snap back if barely zoomed (finger slip)
      if (zoomRef.current.scale < 1.08) {
        applyZoom({ scale: 1, tx: 0, ty: 0 })
      }
      // If it was a clean tap (no drag), the browser fires click naturally
      void g
    }

    const opts = { passive: false }
    el.addEventListener('touchstart', onTouchStart, opts)
    el.addEventListener('touchmove',  onTouchMove,  opts)
    el.addEventListener('touchend',   onTouchEnd,   opts)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function zoomIn() {
    setIsAnimating(true)
    const { scale: s, tx, ty } = zoomRef.current
    applyZoom(clampedZoom(s * 1.8, tx, ty))
    setTimeout(() => setIsAnimating(false), 300)
  }

  function zoomReset() {
    setIsAnimating(true)
    applyZoom({ scale: 1, tx: 0, ty: 0 })
    setTimeout(() => setIsAnimating(false), 300)
  }

  // Index markers by ID for O(1) lookup
  const markerById = Object.fromEntries(MARKERS.map(m => [m.id, m]))

  // Route curve points: home → stops in order
  const routePoints = ['home', ...stops.map(s => s.id)]
    .map(id => markerById[id])
    .filter(Boolean)
    .map(m => ({ x: m.x, y: m.y }))

  const routePath = buildCurvedPath(routePoints)

  // Measure the path length at each waypoint once the route is drawn, then
  // place the van at the current stop. Waypoints lie on the curve, so we find
  // each one's length by sampling the path and taking the closest point.
  useEffect(() => {
    const path = routeRef.current
    if (!path) return
    const total = path.getTotalLength()
    const N = 900
    const samples = []
    for (let k = 0; k <= N; k++) {
      const len = (total * k) / N
      const p = path.getPointAtLength(len)
      samples.push({ len, x: p.x, y: p.y })
    }
    wpLenRef.current = routePoints.map(wp => {
      let bestLen = 0, bestD = Infinity
      for (const s of samples) {
        const d = (s.x - wp.x) ** 2 + (s.y - wp.y) ** 2
        if (d < bestD) { bestD = d; bestLen = s.len }
      }
      return bestLen
    })
    if (!initRef.current) {
      placeVan(currentIdx())
      initRef.current = true
    }
  }, [routePath]) // eslint-disable-line react-hooks/exhaustive-deps

  // Drive the van whenever the active stop changes
  useEffect(() => {
    if (!initRef.current || !wpLenRef.current) return
    driveTo(currentIdx())
    return () => cancelAnimationFrame(animRef.current)
  }, [activeStopId]) // eslint-disable-line react-hooks/exhaustive-deps

  function placeVan(idx) {
    const p = routePoints[idx]
    if (!p) return
    prevIdxRef.current = idx
    setVanPark(v => ({ x: p.x, y: p.y - VAN_DY, flip: v.flip }))
  }

  function driveTo(toIdx) {
    const path = routeRef.current
    const lens = wpLenRef.current
    if (!path || !lens) return
    const fromIdx = prevIdxRef.current
    if (fromIdx === toIdx) { placeVan(toIdx); return }

    cancelAnimationFrame(animRef.current)
    setDriving(true)
    const len0 = lens[fromIdx], len1 = lens[toIdx]
    const duration = Math.min(3600, Math.max(1100, Math.abs(len1 - len0) * 6))
    const start = performance.now()
    let lastX = routePoints[fromIdx].x

    function frame(now) {
      const t = Math.min(1, (now - start) / duration)
      const len = len0 + (len1 - len0) * easeInOutCubic(t)
      const p = path.getPointAtLength(len)
      const x = p.x, y = p.y - VAN_DY
      const movingRight = x >= lastX
      lastX = x
      if (vanGRef.current)   vanGRef.current.setAttribute('transform', `translate(${x},${y})`)
      if (vanFlipRef.current) vanFlipRef.current.setAttribute('transform', movingRight ? 'scale(-1,1)' : '')
      if (t < 1) {
        animRef.current = requestAnimationFrame(frame)
      } else {
        prevIdxRef.current = toIdx
        setVanPark({ x, y, flip: movingRight })
        setDriving(false)
      }
    }
    animRef.current = requestAnimationFrame(frame)
  }

  // Only show name labels when zoomed in — at default zoom the Alpine cluster
  // is too dense; a single zoomed-in view has 2-3 visible stops at most.
  // Active stop always gets its label so current location is always clear.
  const showLabels = zoom.scale >= 1.5

  // Highlight active country with gold stroke
  useEffect(() => {
    const svgEl = mapRef.current?.querySelector('svg')
    if (!svgEl) return
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
      {/* Map container */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden rounded-2xl m-3 mb-1 shadow-lg"
        style={{ background: '#AEE0EF', touchAction: 'none' }}
      >
        {/* Zoomable wrapper — both layers move together */}
        <div
          style={{
            position: 'absolute', inset: 0,
            transform: `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})`,
            transformOrigin: '50% 50%',
            transition: isAnimating ? 'transform 0.25s ease' : 'none',
          }}
        >
          {/* Layer 1 – illustrated SVG base map */}
          <div
            ref={mapRef}
            className="absolute inset-0"
            style={{ lineHeight: 0 }}
            dangerouslySetInnerHTML={{ __html: MAP_SVG }}
          />

          {/* Layer 2 – interactive overlay: labels, route, markers */}
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="absolute inset-0 w-full h-full"
            style={{ display: 'block' }}
          >
            <defs>
              <filter id="mkSh" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="1" dy="2" stdDeviation="3" floodOpacity="0.4" />
              </filter>
              <filter id="decoSh" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.35" />
              </filter>
            </defs>

            {/* Decorations — one big emoji per country, behind route/markers.
                pointer-events off so taps fall through to the map. */}
            <g style={{ pointerEvents: 'none' }} filter="url(#decoSh)">
              {COUNTRY_DECOR.map((d, i) => (
                <text key={i} x={d.x} y={d.y} textAnchor="middle" fontSize={d.s} opacity="0.95">
                  {d.e}
                </text>
              ))}
            </g>

            {/* Country labels */}
            {COUNTRY_LABELS.map(lbl => (
              <text
                key={lbl.name}
                x={lbl.x} y={lbl.y}
                textAnchor="middle"
                fontSize="11"
                fontWeight="800"
                fontStyle="italic"
                letterSpacing="1.2"
                fill="rgba(255,255,255,0.82)"
                stroke="rgba(0,0,0,0.22)"
                strokeWidth="3"
                paintOrder="stroke"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {lbl.name}
              </text>
            ))}

            {/* Route — 3 layers so the line pops against any country colour */}
            {/* Layer 1: wide white halo prevents merging with map fills */}
            <path ref={routeRef} d={routePath} fill="none" stroke="white" strokeWidth="11"
              strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
            {/* Layer 2: solid orange road */}
            <path d={routePath} fill="none" stroke="#f97316" strokeWidth="7"
              strokeLinecap="round" strokeLinejoin="round" />
            {/* Layer 3: white centre dashes — road-marking style, fun for kids */}
            <path d={routePath} fill="none" stroke="white" strokeWidth="2.5"
              strokeDasharray="16 8" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />

            {/* Home marker */}
            {homeMarker && (() => {
              const isActive = activeStopId === 'home'
              return (
                <g onClick={() => handleClick('home')}
                   style={{ cursor: settingMode ? 'pointer' : 'default' }}>
                  {isActive && (
                    <circle cx={homeMarker.x} cy={homeMarker.y} r="26" fill="#fbbf24" opacity="0.45" />
                  )}
                  <circle cx={homeMarker.x} cy={homeMarker.y} r="17"
                    fill="#16a34a" stroke="white" strokeWidth="2.5" filter="url(#mkSh)" />
                  <text x={homeMarker.x} y={homeMarker.y + 6} textAnchor="middle" fontSize="17">🏠</text>
                  {(showLabels || isActive) && <>
                    <foreignObject x={homeMarker.x - 80} y={homeMarker.y - 52} width="160" height="24" overflow="visible"
                                   style={{ pointerEvents: 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          background: 'white', border: '2px solid #16a34a', borderRadius: '8px',
                          padding: '2px 8px', fontSize: '12px', fontWeight: 800, color: '#14532d',
                          whiteSpace: 'nowrap', boxShadow: '0 2px 5px rgba(0,0,0,0.22)',
                        }}>
                          {home.flag} {home.name}
                        </div>
                      </div>
                    </foreignObject>
                    <polygon
                      points={`${homeMarker.x - 5},${homeMarker.y - 28} ${homeMarker.x + 5},${homeMarker.y - 28} ${homeMarker.x},${homeMarker.y - 19}`}
                      fill="white" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round"
                      style={{ pointerEvents: 'none' }}
                    />
                  </>}
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
                <g key={stop.id} onClick={() => handleClick(stop.id)}
                   style={{ cursor: settingMode ? 'pointer' : 'default' }}>
                  {isActive && (
                    <circle cx={m.x} cy={m.y} r={r + 8} fill="#fbbf24" opacity="0.45" />
                  )}
                  <circle cx={m.x} cy={m.y} r={r}
                    fill={isActive ? '#f97316' : '#2563eb'}
                    stroke="white" strokeWidth="2.5" filter="url(#mkSh)" />
                  <text x={m.x} y={m.y + 4} textAnchor="middle" fontSize="11" fontWeight="900" fill="white">
                    {stop.order}
                  </text>
                  {(showLabels || isActive) && <>
                    <foreignObject x={m.x - 80} y={m.y - r - 38} width="160" height="24" overflow="visible"
                                   style={{ pointerEvents: 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          background: 'white',
                          border: `2px solid ${isActive ? '#f97316' : '#2563eb'}`,
                          borderRadius: '8px',
                          padding: '2px 8px', fontSize: '12px', fontWeight: 800,
                          color: isActive ? '#7c2d12' : '#1e3a8a',
                          whiteSpace: 'nowrap', boxShadow: '0 2px 5px rgba(0,0,0,0.22)',
                        }}>
                          {stop.flag} {mapLabel(stop.name)}
                        </div>
                      </div>
                    </foreignObject>
                    <polygon
                      points={`${m.x - 5},${m.y - r - 14} ${m.x + 5},${m.y - r - 14} ${m.x},${m.y - r - 5}`}
                      fill="white"
                      stroke={isActive ? '#f97316' : '#2563eb'}
                      strokeWidth="1.5" strokeLinejoin="round"
                      style={{ pointerEvents: 'none' }}
                    />
                  </>}
                </g>
              )
            })}

            {/* The camper van — rides the route, parks with a gentle bob */}
            <g ref={vanGRef} transform={`translate(${vanPark.x},${vanPark.y})`} style={{ pointerEvents: 'none' }}>
              <g className={driving ? '' : 'van-bob'}>
                <g ref={vanFlipRef} transform={vanPark.flip ? 'scale(-1,1)' : ''}>
                  {driving && (
                    <text x="18" y="6" textAnchor="middle" fontSize="18" opacity="0.75">💨</text>
                  )}
                  <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontSize="34"
                    filter="url(#mkSh)">🚐</text>
                </g>
              </g>
            </g>
          </svg>
        </div>

        {/* Zoom controls — outside the zoomable wrapper, always visible */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
          {zoom.scale < MAX_SCALE - 0.1 && (
            <button
              onClick={zoomIn}
              className="w-11 h-11 rounded-full bg-white/85 shadow-md text-xl font-black text-amber-800 flex items-center justify-center active:scale-90 transition-transform"
            >
              +
            </button>
          )}
          {zoom.scale > 1.1 && (
            <button
              onClick={zoomReset}
              className="w-11 h-11 rounded-full bg-white/85 shadow-md text-lg font-black text-amber-800 flex items-center justify-center active:scale-90 transition-transform"
            >
              ↺
            </button>
          )}
        </div>
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
