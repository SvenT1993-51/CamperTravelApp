import React, { useState } from 'react'
import RouteMap from './RouteMap.jsx'
import StopCard from './StopCard.jsx'
import KentekenBingo from './KentekenBingo.jsx'
import tripData from '../data/trip.json'

export default function KaartTab({ activeStopId, onSetActive }) {
  const [showBingo, setShowBingo] = useState(false)

  const activeStop =
    activeStopId && activeStopId !== 'home'
      ? tripData.stops.find(s => s.id === activeStopId)
      : null

  return (
    <div className="h-full flex flex-row overflow-hidden">
      {/* Map — shrinks to 65% when a stop card is open */}
      <div className={activeStop ? 'w-[65%]' : 'w-full'} style={{ transition: 'width 0.25s ease' }}>
        <RouteMap
          home={tripData.home}
          stops={tripData.stops}
          activeStopId={activeStopId}
          onSetActive={onSetActive}
          onOpenBingo={() => setShowBingo(true)}
        />
      </div>

      {/* Stop card panel — 35% wide, slides in */}
      {activeStop && (
        <div className="w-[35%] flex-shrink-0 border-l-2 border-white/60 overflow-hidden">
          <StopCard stop={activeStop} />
        </div>
      )}

      {showBingo && <KentekenBingo onClose={() => setShowBingo(false)} />}
    </div>
  )
}
