import React, { useState, useRef } from 'react'
import tripData from '../data/trip.json'

const LS_DIARY = 'ce_diary'

const EMOJIS = [
  '⭐','😄','😂','❤️','😍',
  '🏔️','🌊','🏖️','🏕️','🌈',
  '🍕','🍦','🥐','🧁','🍉',
  '🚐','🚠','⛵','🎡','🏰',
  '🦁','🐘','🦋','🌸','🎉',
]

const NL_MONTHS = ['januari','februari','maart','april','mei','juni',
                   'juli','augustus','september','oktober','november','december']
const NL_DAYS   = ['zo','ma','di','wo','do','vr','za']

function loadEntries() {
  try { return JSON.parse(localStorage.getItem(LS_DIARY) || '[]') } catch { return [] }
}
function saveEntries(entries) {
  localStorage.setItem(LS_DIARY, JSON.stringify(entries))
}

function formatDate(isoDate) {
  const d     = new Date(isoDate)
  const today = new Date().toISOString().slice(0, 10)
  const yest  = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
  if (isoDate === today) return 'Vandaag'
  if (isoDate === yest)  return 'Gisteren'
  return `${NL_DAYS[d.getDay()]} ${d.getDate()} ${NL_MONTHS[d.getMonth()]}`
}

function stopLabel(stopId) {
  if (!stopId || stopId === 'home') return null
  const s = tripData.stops.find(s => s.id === stopId)
  return s ? `${s.flag} ${s.name}` : null
}

// Extract first emoji from text to use as card icon
function extractIcon(text) {
  const m = text.match(/\p{Extended_Pictographic}/u)
  return m ? m[0] : '📝'
}

// ── Diary entry card ─────────────────────────────────────────────────────────
function DiaryEntry({ entry, onDelete }) {
  const label = stopLabel(entry.stopId)
  return (
    <div className="flex gap-3 bg-white rounded-2xl shadow-sm px-4 py-3 relative group">
      <span className="text-4xl leading-none flex-shrink-0 mt-0.5">{extractIcon(entry.text)}</span>
      <div className="flex-1 min-w-0">
        {label && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs">📍</span>
            <span className="text-xs font-bold text-amber-600">{label}</span>
          </div>
        )}
        <p className="text-base leading-snug text-gray-800 whitespace-pre-wrap break-words">{entry.text}</p>
      </div>
      <button
        onClick={() => onDelete(entry.id)}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-400 text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
        aria-label="Verwijder"
      >
        ×
      </button>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function DagboekTab({ activeStopId }) {
  const [entries, setEntries] = useState(loadEntries)
  const [text,    setText]    = useState('')
  const [shake,   setShake]   = useState(false)
  const textareaRef = useRef(null)

  const location = stopLabel(activeStopId)

  // Insert emoji at current cursor position in the textarea
  function insertEmoji(emoji) {
    const ta = textareaRef.current
    const start = ta?.selectionStart ?? text.length
    const end   = ta?.selectionEnd   ?? text.length
    const next  = text.slice(0, start) + emoji + text.slice(end)
    if (next.length > 250) return
    setText(next)
    requestAnimationFrame(() => {
      if (!ta) return
      ta.focus()
      const cur = start + emoji.length
      ta.setSelectionRange(cur, cur)
    })
  }

  function submit() {
    if (!text.trim()) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    const entry = {
      id:     Date.now().toString(),
      date:   new Date().toISOString().slice(0, 10),
      text:   text.trim(),
      stopId: activeStopId ?? null,
    }
    const next = [entry, ...entries]
    setEntries(next)
    saveEntries(next)
    setText('')
  }

  function deleteEntry(id) {
    const next = entries.filter(e => e.id !== id)
    setEntries(next)
    saveEntries(next)
  }

  // Group by date (newest first)
  const grouped = entries.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = []
    acc[e.date].push(e)
    return acc
  }, {})
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="h-full flex flex-row overflow-hidden">

      {/* ── Left: input (35%) ── */}
      <div className="w-[35%] flex-shrink-0 flex flex-col bg-amber-50 border-r border-amber-200 overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-4 pb-2">
          <h2 className="text-xl font-black text-amber-900">✏️ Nieuwe herinnering</h2>
          {location && (
            <div className="flex items-center gap-1.5 mt-1.5 bg-amber-100 rounded-full px-3 py-1 w-fit">
              <span className="text-sm">📍</span>
              <span className="text-sm font-bold text-amber-800">{location}</span>
            </div>
          )}
        </div>

        {/* Emoji insert grid */}
        <div className="flex-shrink-0 px-5 pb-2">
          <p className="text-xs font-black uppercase tracking-wider text-amber-700 mb-2">
            Tik om in te voegen
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => insertEmoji(e)}
                className="text-2xl rounded-xl py-1 bg-white shadow-sm active:scale-90 active:bg-orange-100 transition-transform"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Text area */}
        <div className="flex-1 px-5 flex flex-col gap-2 min-h-0 pb-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={250}
            placeholder="Wat hebben jullie vandaag beleefd? 🌟"
            className="flex-1 rounded-2xl border-2 border-amber-200 px-4 py-3 text-base text-gray-800 resize-none focus:outline-none focus:border-orange-400 bg-white"
            style={shake ? { borderColor: '#ef4444' } : {}}
          />
          <div className="flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-amber-600">{text.length}/250</span>
            <button
              onClick={submit}
              className="min-h-[52px] px-6 rounded-2xl bg-orange-500 text-white font-black text-base shadow-md active:scale-95 transition-transform"
            >
              Toevoegen →
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: timeline (65%) ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-brand-cream">
        <div className="flex-shrink-0 px-6 pt-4 pb-2">
          <h2 className="text-xl font-black text-amber-900">📖 Dagboek</h2>
          <p className="text-sm text-amber-700">
            {entries.length} {entries.length === 1 ? 'herinnering' : 'herinneringen'}
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-50">
            <span className="text-7xl">📖</span>
            <p className="text-lg font-bold text-amber-800">Nog geen herinneringen</p>
            <p className="text-sm text-amber-700">Schrijf jullie eerste beleving!</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            {dates.map(date => (
              <div key={date} className="mb-5">
                <p className="text-sm font-black text-amber-600 uppercase tracking-wide mb-2">
                  {formatDate(date)}
                </p>
                <div className="flex flex-col gap-2">
                  {grouped[date].map(entry => (
                    <DiaryEntry key={entry.id} entry={entry} onDelete={deleteEntry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
