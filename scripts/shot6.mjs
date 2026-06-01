import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.setViewportSize({ width: 1024, height: 768 })

const today = new Date().toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10)

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.evaluate((args) => {
  localStorage.setItem('ce_visited', JSON.stringify(['karlsruhe', 'zugspitze', 'bodensee']))
  localStorage.setItem('ce_stamped', JSON.stringify([
    { id: 'karlsruhe', date: args.yesterday },
    { id: 'zugspitze', date: args.today },
  ]))
  localStorage.setItem('ce_activeStop', 'zugspitze')
}, { today, yesterday })

await page.reload({ waitUntil: 'networkidle' })
await page.evaluate(() => {
  Array.from(document.querySelectorAll('nav button')).find(b => b.textContent.includes('Paspoort'))?.click()
})
await page.waitForTimeout(400)
await page.screenshot({ path: 'stamp-grid.png' })

// Celebration screen via quiz
await page.evaluate(() => {
  // Manually trigger celebrate mode by setting bodensee as stamped via quiz
  Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Quiz'))?.click()
})
await page.waitForTimeout(300)
// answer first question correctly
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'))
  const correct = btns.find(b => b.textContent.includes('Duitsland'))
  correct?.click()
})
await page.waitForTimeout(200)
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'))
  const next = btns.find(b => b.textContent.includes('Klaar') || b.textContent.includes('Volgende'))
  next?.click()
})
await page.waitForTimeout(300)
await page.screenshot({ path: 'stamp-celebrate.png' })

await browser.close()
console.log('done')
