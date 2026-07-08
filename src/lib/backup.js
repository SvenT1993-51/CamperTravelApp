// Progress backup & restore. All app state lives in localStorage under the
// ce_* prefix, so we snapshot/replace exactly those keys. Fully offline:
// Blob download + FileReader, no network, no dependencies.

const PREFIX = 'ce_'
const APP = 'camp-explorer'

// Snapshot of every ce_* key currently in localStorage (array of key names).
function ceKeys() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(PREFIX)) keys.push(k)
  }
  return keys
}

// Collect all ce_* progress and download it as a dated JSON file.
export function exportBackup() {
  const keys = {}
  for (const k of ceKeys()) {
    const v = localStorage.getItem(k)
    if (v !== null) keys[k] = v
  }
  const payload = {
    app: APP,
    version: 1,
    exportedAt: new Date().toISOString(),
    keys,
  }
  const today = new Date().toISOString().slice(0, 10)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `camp-explorer-backup-${today}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Defer revoke so the download has a tick to start in every browser.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

// Read + validate a chosen backup file. Resolves with the parsed payload,
// or rejects with a friendly Dutch message.
export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Het bestand kon niet gelezen worden. Probeer het opnieuw.'))
    reader.onload = () => {
      let payload
      try {
        payload = JSON.parse(reader.result)
      } catch {
        reject(new Error('Dit is geen geldig reserve-kopie bestand.'))
        return
      }
      if (!payload || payload.app !== APP || typeof payload.keys !== 'object' || payload.keys === null) {
        reject(new Error('Dit lijkt geen Camp Explorer reserve-kopie te zijn.'))
        return
      }
      resolve(payload)
    }
    reader.readAsText(file)
  })
}

// Replace all app progress with the backup's, then reload so every component
// re-reads localStorage from scratch. Only writes ce_* string values, and
// never touches keys outside the app's own namespace.
export function applyBackup(payload) {
  for (const k of ceKeys()) localStorage.removeItem(k)
  for (const [k, v] of Object.entries(payload.keys)) {
    if (k.startsWith(PREFIX) && typeof v === 'string') {
      localStorage.setItem(k, v)
    }
  }
  window.location.reload()
}

// Wipe ALL progress (every ce_* key, including names) and reload to a fresh
// start. Only touches the app's own namespace.
export function resetAllProgress() {
  for (const k of ceKeys()) localStorage.removeItem(k)
  window.location.reload()
}
