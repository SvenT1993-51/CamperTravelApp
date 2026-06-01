import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.setViewportSize({ width: 1024, height: 768 })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })

// 1. Enter selection mode
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('zijn hier'))
  btn?.click()
})
await page.waitForTimeout(200)

// 2. Click stop 1 (Karlsruhe) via its SVG g element
const clicked = await page.evaluate(() => {
  const texts = Array.from(document.querySelectorAll('svg text'))
  const t = texts.find(t => t.textContent.trim() === '1')
  if (!t) return 'text not found'
  const g = t.closest('g')
  if (!g) return 'g not found'
  g.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  return 'clicked'
})
console.log('Click result:', clicked)

await page.waitForTimeout(300)
await page.screenshot({ path: 'verify-sel-01-after-select.png' })

const status = await page.evaluate(() => {
  const divs = Array.from(document.querySelectorAll('div'))
  const el = divs.find(d => d.childElementCount === 0 && d.textContent.includes('zijn bij'))
  return el?.textContent?.trim() ?? 'NOT FOUND'
})
console.log('Status after select:', status)

// 3. Check orange highlight on selected stop
const activeCircle = await page.evaluate(() => {
  const circles = Array.from(document.querySelectorAll('svg circle'))
  return circles.map(c => ({ fill: c.getAttribute('fill'), r: c.getAttribute('r') }))
})
console.log('Circle fills/sizes:', JSON.stringify(activeCircle))

// 4. Reload — check persistence
await page.reload({ waitUntil: 'networkidle' })
await page.screenshot({ path: 'verify-sel-02-after-reload.png' })

const statusAfterReload = await page.evaluate(() => {
  const divs = Array.from(document.querySelectorAll('div'))
  const el = divs.find(d => d.childElementCount === 0 && d.textContent.includes('zijn bij'))
  return el?.textContent?.trim() ?? 'NOT FOUND'
})
console.log('Status after reload:', statusAfterReload)

await browser.close()
console.log('DONE')
