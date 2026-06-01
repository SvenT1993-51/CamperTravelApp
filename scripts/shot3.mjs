import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.setViewportSize({ width: 1024, height: 768 })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })

// Clear any existing state
await page.evaluate(() => {
  localStorage.removeItem('ce_activeStop')
  localStorage.removeItem('ce_visited')
})
await page.reload({ waitUntil: 'networkidle' })

// Switch to Paspoort — all locked
await page.evaluate(() => {
  Array.from(document.querySelectorAll('nav button')).find(b => b.textContent.includes('Paspoort'))?.click()
})
await page.waitForTimeout(200)
await page.screenshot({ path: 'passport-locked.png' })

// Unlock Karlsruhe (1) and Zugspitze (3)
await page.evaluate(() => {
  localStorage.setItem('ce_visited', JSON.stringify(['karlsruhe', 'zugspitze']))
  localStorage.setItem('ce_activeStop', 'zugspitze')
})
await page.reload({ waitUntil: 'networkidle' })
await page.evaluate(() => {
  Array.from(document.querySelectorAll('nav button')).find(b => b.textContent.includes('Paspoort'))?.click()
})
await page.waitForTimeout(200)
await page.screenshot({ path: 'passport-unlocked.png' })

await browser.close()
console.log('done')
