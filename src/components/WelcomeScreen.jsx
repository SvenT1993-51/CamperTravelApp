import React, { useState } from 'react'

const MAX_NAMES = 6

// "Sven" · "Sven en Lily" · "Sven, Lily en Max"
function joinDutch(names) {
  const list = names.map(n => n.trim()).filter(Boolean)
  if (list.length === 0) return ''
  if (list.length === 1) return list[0]
  return list.slice(0, -1).join(', ') + ' en ' + list[list.length - 1]
}

export default function WelcomeScreen({ names, onSaveNames, onEnter }) {
  const hasNames = names.length > 0
  const [editing, setEditing] = useState(!hasNames)
  const [draft, setDraft] = useState(() => (hasNames ? [...names] : ['']))

  const canSave = draft.some(n => n.trim())

  function updateName(i, value) {
    setDraft(prev => prev.map((n, idx) => (idx === i ? value : n)))
  }
  function addName() {
    setDraft(prev => (prev.length >= MAX_NAMES ? prev : [...prev, '']))
  }
  function removeName(i) {
    setDraft(prev => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)))
  }
  function save() {
    const cleaned = draft.map(n => n.trim()).filter(Boolean)
    if (cleaned.length === 0) return
    onSaveNames(cleaned)
    setDraft(cleaned)
    setEditing(false)
  }
  function startEdit() {
    setDraft(hasNames ? [...names] : [''])
    setEditing(true)
  }

  return (
    <div className="relative h-full w-full overflow-y-auto bg-gradient-to-b from-amber-200 via-brand-cream to-orange-200">
      {/* Decorative scattered icons */}
      <span className="pointer-events-none absolute top-6 left-8 text-5xl opacity-30 select-none">☀️</span>
      <span className="pointer-events-none absolute top-10 right-10 text-4xl opacity-30 select-none">☁️</span>
      <span className="pointer-events-none absolute bottom-8 left-12 text-4xl opacity-25 select-none">🌲</span>
      <span className="pointer-events-none absolute bottom-10 right-16 text-4xl opacity-25 select-none">⛰️</span>
      <span className="pointer-events-none absolute top-1/2 left-4 text-3xl opacity-20 select-none">✨</span>
      <span className="pointer-events-none absolute top-1/3 right-6 text-3xl opacity-20 select-none">✨</span>

      <div className="relative z-10 min-h-full flex flex-col items-center justify-center px-6 py-10">
        <div className="text-7xl mb-2 animate-bounce select-none">🚐</div>

        {editing ? (
          /* ─────────── Name entry ─────────── */
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-black text-orange-700 text-center leading-tight mb-1">
              Wie gaan er mee op reis?
            </h1>
            <p className="text-base font-bold text-orange-900/60 text-center mb-5">
              Typ jullie namen in ✍️
            </p>

            <div className="space-y-3">
              {draft.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    autoFocus={i === draft.length - 1}
                    value={name}
                    onChange={e => updateName(i, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && canSave) save() }}
                    maxLength={20}
                    placeholder={`Naam ${i + 1}`}
                    className="flex-1 min-h-tap rounded-2xl border-4 border-orange-300 bg-white px-5 text-2xl font-bold text-orange-900 placeholder:text-orange-300 focus:border-orange-500 focus:outline-none"
                  />
                  {draft.length > 1 && (
                    <button
                      onClick={() => removeName(i)}
                      aria-label="Naam verwijderen"
                      className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-200 text-2xl text-orange-700 font-black active:scale-90 transition-transform"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {draft.length < MAX_NAMES && (
              <button
                onClick={addName}
                className="mt-3 w-full min-h-tap rounded-2xl border-4 border-dashed border-orange-300 text-xl font-black text-orange-600 active:scale-95 transition-transform"
              >
                ➕ Naam toevoegen
              </button>
            )}

            <button
              onClick={save}
              disabled={!canSave}
              className="mt-6 w-full min-h-tap rounded-full bg-brand-green text-white text-2xl font-black shadow-lg py-4 active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
            >
              Start! 🎉
            </button>
          </div>
        ) : (
          /* ─────────── Welcome back ─────────── */
          <div className="w-full max-w-lg text-center">
            <h1 className="text-4xl font-black text-orange-700 mb-1">Welkom terug! 👋</h1>
            <p className="text-xl font-bold text-orange-900/70 mt-4">Dit reisdagboek is van</p>

            <div className="mt-3 mb-2 flex items-center justify-center gap-3 flex-wrap">
              <span className="text-4xl font-black text-orange-600 leading-tight break-words">
                {joinDutch(names)}
              </span>
              <button
                onClick={startEdit}
                aria-label="Namen aanpassen"
                className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-300 text-2xl active:scale-90 transition-transform"
              >
                ✏️
              </button>
            </div>

            <button
              onClick={onEnter}
              className="mt-8 min-w-tap rounded-full bg-brand-green text-white text-2xl font-black shadow-lg px-12 py-4 active:scale-95 transition-transform"
            >
              Ga verder →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
