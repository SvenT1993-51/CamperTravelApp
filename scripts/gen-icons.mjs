// Rasterizes the app icon to PNGs for the PWA manifest + iOS home screen.
// Uses the already-installed Playwright Chromium, so it runs fully offline.
// Run: node scripts/gen-icons.mjs
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dir, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

// Full-bleed square (no rounded corners) so maskable/iOS masks crop cleanly.
// The camping emoji stays inside the central safe zone.
function pageHtml(size) {
  return `<!doctype html><html><head><style>
    *{margin:0;padding:0}
    html,body{width:${size}px;height:${size}px;overflow:hidden}
    .icon{width:${size}px;height:${size}px;background:#f97316;
      display:flex;align-items:center;justify-content:center;
      font-family:'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif;
      font-size:${Math.round(size * 0.56)}px;line-height:1}
  </style></head><body><div class="icon">🏕️</div></body></html>`
}

const targets = [
  { file: 'pwa-512.png',          size: 512 }, // manifest, maskable
  { file: 'pwa-192.png',          size: 192 }, // manifest, maskable
  { file: 'apple-touch-icon.png', size: 180 }, // iOS home screen (needs PNG)
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size })
  await page.setContent(pageHtml(t.size), { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: join(outDir, t.file) })
  console.log('wrote', t.file)
}
await browser.close()
