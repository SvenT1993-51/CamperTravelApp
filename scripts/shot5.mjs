import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.setViewportSize({ width: 1024, height: 768 })

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.evaluate(() => {
  localStorage.setItem('ce_activeStop', 'zugspitze')
  localStorage.setItem('ce_diary', JSON.stringify([
    { id: '1', date: new Date().toISOString().slice(0,10), emoji: '🏔️', text: 'Vandaag met de kabelbaan naar de top van de Zugspitze! Super hoog en er lag echt sneeuw.', stopId: 'zugspitze' },
    { id: '2', date: new Date().toISOString().slice(0,10), emoji: '🍦', text: 'Daarna een lekker ijsje gegeten aan het Eibsee. Zo koud maar zo lekker!', stopId: 'zugspitze' },
    { id: '3', date: new Date(Date.now()-864e5).toISOString().slice(0,10), emoji: '🚃', text: 'In Karlsruhe gereden met de tram!', stopId: 'karlsruhe' },
  ]))
})
await page.reload({ waitUntil: 'networkidle' })

await page.evaluate(() => {
  Array.from(document.querySelectorAll('nav button')).find(b => b.textContent.includes('Dagboek'))?.click()
})
await page.waitForTimeout(300)
await page.screenshot({ path: 'dagboek-entries.png' })

// Also screenshot the empty state
await page.evaluate(() => localStorage.removeItem('ce_diary'))
await page.reload({ waitUntil: 'networkidle' })
await page.evaluate(() => {
  Array.from(document.querySelectorAll('nav button')).find(b => b.textContent.includes('Dagboek'))?.click()
})
await page.waitForTimeout(300)
await page.screenshot({ path: 'dagboek-empty.png' })

await browser.close()
console.log('done')
