import React, { useState } from 'react'
import BottomNav from './components/BottomNav.jsx'
import KaartTab from './components/KaartTab.jsx'
import PaspoortTab from './components/PaspoortTab.jsx'
import DagboekTab from './components/DagboekTab.jsx'
import TrofeeenTab from './components/TrofeeenTab.jsx'
import WelcomeScreen from './components/WelcomeScreen.jsx'

const LS_ACTIVE  = 'ce_activeStop'
const LS_VISITED = 'ce_visited'
const LS_STAMPED = 'ce_stamped'
const LS_NAMES   = 'ce_names'

const loadArr = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }

// stampedStops is [{id, date}]. Migrate old format (string[]) transparently.
function loadStamped() {
  const raw = loadArr(LS_STAMPED)
  if (raw.length > 0 && typeof raw[0] === 'string') {
    return raw.map(id => ({ id, date: null }))
  }
  return raw
}

export default function App() {
  const [activeTab,      setActiveTab]      = useState('kaart')
  const [activeStopId,   setActiveStopId]   = useState(() => localStorage.getItem(LS_ACTIVE) ?? null)
  const [visitedStopIds, setVisitedStopIds] = useState(() => loadArr(LS_VISITED))
  const [stampedStops,   setStampedStops]   = useState(loadStamped)
  const [names,          setNames]          = useState(() => loadArr(LS_NAMES))
  const [entered,        setEntered]        = useState(false)

  function handleSaveNames(nextNames) {
    setNames(nextNames)
    localStorage.setItem(LS_NAMES, JSON.stringify(nextNames))
  }

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
    setStampedStops(prev => {
      if (prev.some(s => s.id === stopId)) return prev
      const next = [...prev, { id: stopId, date: new Date().toISOString().slice(0, 10) }]
      localStorage.setItem(LS_STAMPED, JSON.stringify(next))
      return next
    })
  }

  if (!entered) {
    return (
      <WelcomeScreen
        names={names}
        onSaveNames={handleSaveNames}
        onEnter={() => setEntered(true)}
      />
    )
  }

  return (
    <div className="flex flex-col bg-brand-cream w-full h-full">
      <main className="flex-1 overflow-hidden">
        {activeTab === 'kaart' && (
          <KaartTab activeStopId={activeStopId} onSetActive={handleSetActive} />
        )}
        {activeTab === 'paspoort' && (
          <PaspoortTab
            visitedStopIds={visitedStopIds}
            stampedStops={stampedStops}
            activeStopId={activeStopId}
            onStampEarned={handleStampEarned}
          />
        )}
        {activeTab === 'trofeeen' && (
          <TrofeeenTab stampedStops={stampedStops} visitedStopIds={visitedStopIds} />
        )}
        {activeTab === 'dagboek' && <DagboekTab activeStopId={activeStopId} />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
