import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.setViewportSize({ width: 1024, height: 768 })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.screenshot({ path: 'map-updated.png' })
// Select Grossglockner (stop 6) to show orange highlight
await page.evaluate(() => {
  document.querySelectorAll('button')[0].click() // We zijn hier
})
await page.waitForTimeout(150)
await page.evaluate(() => {
  const texts = Array.from(document.querySelectorAll('svg text'))
  texts.find(t => t.textContent.trim() === '6')?.closest('g')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
})
await page.waitForTimeout(200)
await page.screenshot({ path: 'map-selected.png' })
await browser.close()
console.log('done')
