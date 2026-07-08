import React, { useRef, useState, useEffect } from 'react'
import { exportBackup, readBackupFile, applyBackup, resetAllProgress } from '../lib/backup.js'

// Parent-facing safety net at the bottom of the welcome screen: save a copy of
// the kids' progress, or put a saved copy back (e.g. on a new tablet). Kept
// quiet and secondary so little ones don't wipe things by accident.
export default function BackupCorner() {
  const fileRef = useRef(null)
  const [status,      setStatus]      = useState(null) // { kind: 'ok' | 'err', text }
  const [pending,     setPending]     = useState(null) // validated payload awaiting confirm
  const [confirmWipe, setConfirmWipe] = useState(false)

  // The wipe confirmation auto-cancels so it can't sit armed on a shared tablet
  useEffect(() => {
    if (!confirmWipe) return
    const t = setTimeout(() => setConfirmWipe(false), 5000)
    return () => clearTimeout(t)
  }, [confirmWipe])

  function handleSave() {
    setStatus(null)
    try {
      exportBackup()
      setStatus({ kind: 'ok', text: '💾 Reserve-kopie opgeslagen bij je downloads.' })
    } catch {
      setStatus({ kind: 'err', text: 'Er ging iets mis bij het opslaan.' })
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // let the same file be picked again later
    if (!file) return
    setStatus(null)
    try {
      setPending(await readBackupFile(file))
    } catch (err) {
      setPending(null)
      setStatus({ kind: 'err', text: err.message })
    }
  }

  const pillClass =
    'min-h-tap rounded-full bg-white/70 px-5 py-2 text-sm font-black text-orange-800 shadow-sm active:scale-95 transition-transform'

  return (
    <div className="mt-10 w-full max-w-md text-center">
      <p className="text-xs font-black uppercase tracking-wider text-orange-900/40 mb-2">
        Voor papa &amp; mama
      </p>

      {pending ? (
        <div className="rounded-2xl bg-white/70 px-4 py-3">
          <p className="text-sm font-bold text-orange-900 mb-3">
            Huidige voortgang vervangen door deze reserve-kopie?
            {' '}({Object.keys(pending.keys).filter(k => k.startsWith('ce_')).length} onderdelen)
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => applyBackup(pending)}
              className="min-h-tap rounded-full bg-brand-green px-6 py-2 text-sm font-black text-white shadow active:scale-95 transition-transform"
            >
              Ja, terugzetten
            </button>
            <button
              onClick={() => setPending(null)}
              className="min-h-tap rounded-full bg-orange-200 px-6 py-2 text-sm font-black text-orange-800 active:scale-95 transition-transform"
            >
              Nee
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button onClick={handleSave} className={pillClass}>
            💾 Bewaar reserve-kopie
          </button>
          <button onClick={() => fileRef.current?.click()} className={pillClass}>
            📥 Zet reserve-kopie terug
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        className="hidden"
      />

      {status && (
        <p className={`mt-2 text-sm font-bold ${status.kind === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
          {status.text}
        </p>
      )}

      {/* Tiny, almost-hidden "wipe everything" escape hatch — confirm-gated so a
          curious kid can't clear the whole trip with one tap. */}
      {confirmWipe ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <span className="text-xs font-bold text-red-600">
            Alles wissen? Alle stempels, sterren en verhalen gaan weg.
          </span>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={resetAllProgress}
              className="min-h-tap rounded-full bg-red-500 px-5 text-sm font-black text-white active:scale-95 transition-transform"
            >
              Ja, alles wissen
            </button>
            <button
              onClick={() => setConfirmWipe(false)}
              className="min-h-tap rounded-full bg-orange-200 px-5 text-sm font-black text-orange-800 active:scale-95 transition-transform"
            >
              Nee
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmWipe(true)}
          className="mt-5 px-2 py-1 text-[11px] font-semibold text-orange-900/25 underline underline-offset-2 active:text-orange-900/60"
        >
          alles wissen
        </button>
      )}
    </div>
  )
}
