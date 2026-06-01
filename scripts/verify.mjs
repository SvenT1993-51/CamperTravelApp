import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.setViewportSize({ width: 1024, height: 768 })

const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push(e.message))

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.screenshot({ path: 'verify-01-initial.png' })

// 1. Check tabs
const tabs = await page.$$eval('nav button', els => els.map(e => e.textContent.trim()))
console.log('TABS:', JSON.stringify(tabs))

// 2. SVG present
const svgExists = await page.$('svg') !== null
console.log('SVG present:', svgExists)

// 3. Count circles (home + 12 stops = 13 minimum; active adds glow so may be more)
const circleCount = await page.$$eval('svg circle', cs => cs.length)
console.log('SVG circles:', circleCount)

// 4. JS errors
console.log('JS errors:', JSON.stringify(errors))

// 5. Click "We zijn hier" button — find by partial text match on the button
const allButtons = await page.$$eval('button', els => els.map(e => e.textContent.trim()))
console.log('All buttons:', JSON.stringify(allButtons))

// Click "We zijn hier" button via evaluate
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('zijn hier'))
  if (btn) btn.click()
})
await page.screenshot({ path: 'verify-02-selection-mode.png' })
const btnTextAfter = await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tik op') || b.textContent.includes('zijn hier'))
  return btn ? btn.textContent.trim() : 'NOT FOUND'
})
console.log('Button text after click:', btnTextAfter)

// 6. Click the SVG circle for stop 1 (Karlsruhe) by its position
//    The "1" text is inside the marker circle — click it via JS
const stopTexts = await page.$$eval('svg text', els =>
  els.map(e => ({ text: e.textContent.trim(), x: parseFloat(e.getAttribute('x')||0), y: parseFloat(e.getAttribute('y')||0) }))
)
console.log('SVG texts:', JSON.stringify(stopTexts))

// Find the text node with exactly "1" (the stop number)
const stop1Text = stopTexts.find(t => t.text === '1')
if (stop1Text) {
  await page.mouse.click(stop1Text.x, stop1Text.y)
  console.log('Clicked stop 1 at', stop1Text.x, stop1Text.y)
}
await page.screenshot({ path: 'verify-03-stop-selected.png' })

// 7. Check status text updated
const statusDiv = await page.$$eval('div', els => {
  const el = els.find(e => e.textContent.includes('zijn bij') || e.textContent.includes('zijn hier') || e.textContent.includes('bij:'))
  return el ? el.textContent.trim() : 'NOT FOUND'
})
console.log('Status text:', statusDiv)

// 8. Reload and check persistence
await page.reload({ waitUntil: 'networkidle' })
await page.screenshot({ path: 'verify-04-after-reload.png' })
const statusAfterReload = await page.$$eval('div', els => {
  const el = els.find(e => e.textContent.includes('zijn bij') || e.textContent.includes('bij:'))
  return el ? el.textContent.trim() : 'NOT FOUND'
})
console.log('Status after reload:', statusAfterReload)

// 9. Switch to Paspoort tab
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('nav button')).find(b => b.textContent.includes('Paspoort'))
  if (btn) btn.click()
})
await page.screenshot({ path: 'verify-05-paspoort.png' })
const paspoortText = await page.$$eval('p', els => {
  const el = els.find(e => e.textContent.includes('binnenkort'))
  return el ? el.textContent.trim() : 'NOT FOUND'
})
console.log('Paspoort placeholder:', paspoortText)

// 10. Switch to Dagboek tab
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('nav button')).find(b => b.textContent.includes('Dagboek'))
  if (btn) btn.click()
})
await page.screenshot({ path: 'verify-06-dagboek.png' })
const dagboekText = await page.$$eval('p', els => {
  const el = els.find(e => e.textContent.includes('binnenkort'))
  return el ? el.textContent.trim() : 'NOT FOUND'
})
console.log('Dagboek placeholder:', dagboekText)

await browser.close()
console.log('DONE')
