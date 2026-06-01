import React, { useState } from 'react'
import BottomNav from './components/BottomNav.jsx'
import KaartTab from './components/KaartTab.jsx'
import PaspoortTab from './components/PaspoortTab.jsx'
import DagboekTab from './components/DagboekTab.jsx'

const LS_ACTIVE  = 'ce_activeStop'
const LS_VISITED = 'ce_visited'
const LS_STAMPED = 'ce_stamped'

const load = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }

export default function App() {
  const [activeTab,      setActiveTab]      = useState('kaart')
  const [activeStopId,   setActiveStopId]   = useState(() => localStorage.getItem(LS_ACTIVE) ?? null)
  const [visitedStopIds, setVisitedStopIds] = useState(() => load(LS_VISITED))
  const [stampedStopIds, setStampedStopIds] = useState(() => load(LS_STAMPED))

  function handleSetActive(stopId) {
    setActiveStopId(stopId)
    localStorage.setItem(LS_ACTIVE, stopId)
    if (stopId !== 'home') {
      setVisitedStopIds(prev => {
        if (prev.includes(stopId)) return prev
        const next = [...prev, stopId]
        localStorage.setItem(LS_VISITED, JSON.stringify(next))
        return next
      })
    }
  }

  function handleStampEarned(stopId) {
    setStampedStopIds(prev => {
      if (prev.includes(stopId)) return prev
      const next = [...prev, stopId]
      localStorage.setItem(LS_STAMPED, JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="flex flex-col bg-brand-cream" style={{ width: '100vw', height: '100vh' }}>
      <main className="flex-1 overflow-hidden">
        {activeTab === 'kaart' && (
          <KaartTab activeStopId={activeStopId} onSetActive={handleSetActive} />
        )}
        {activeTab === 'paspoort' && (
          <PaspoortTab
            visitedStopIds={visitedStopIds}
            stampedStopIds={stampedStopIds}
            activeStopId={activeStopId}
            onStampEarned={handleStampEarned}
          />
        )}
        {activeTab === 'dagboek' && <DagboekTab activeStopId={activeStopId} />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
