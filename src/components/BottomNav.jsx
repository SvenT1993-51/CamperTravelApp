import React from 'react'

const TABS = [
  { id: 'kaart',    label: 'Kaart',    emoji: '🗺️' },
  { id: 'paspoort', label: 'Paspoort', emoji: '🗒️' },
  { id: 'dagboek',  label: 'Dagboek',  emoji: '📖' },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="flex bg-orange-500 shadow-lg" style={{ minHeight: '72px' }}>
      {TABS.map(tab => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[72px] transition-colors ${
              isActive
                ? 'bg-amber-400 text-amber-900'
                : 'text-white active:bg-orange-400'
            }`}
          >
            <span className="text-3xl leading-none">{tab.emoji}</span>
            <span className={`text-sm font-bold leading-none ${isActive ? 'text-amber-900' : 'text-white'}`}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
