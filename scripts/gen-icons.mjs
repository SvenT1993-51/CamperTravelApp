// Generates minimal placeholder PNG icons for the PWA manifest.
// Run: node scripts/gen-icons.mjs
// Replace with proper artwork before release.
import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dir, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

for (const size of [192, 512]) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#f97316'
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.2)
  ctx.fill()

  // Emoji
  ctx.font = `${size * 0.55}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🏕️', size / 2, size / 2 + size * 0.05)

  writeFileSync(join(outDir, `icon-${size}.png`), canvas.toBuffer('image/png'))
  console.log(`icon-${size}.png written`)
}
