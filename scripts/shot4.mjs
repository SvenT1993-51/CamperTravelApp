import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.setViewportSize({ width: 1024, height: 768 })

async function goPaspoort() {
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('nav button')).find(b => b.textContent.includes('Paspoort'))?.click()
  })
  await page.waitForTimeout(250)
}

// 1. Grid: some visited (quiz ready), none stamped
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.evaluate(() => {
  localStorage.setItem('ce_visited', JSON.stringify(['karlsruhe', 'zugspitze']))
  localStorage.setItem('ce_stamped', '[]')
  localStorage.setItem('ce_activeStop', 'zugspitze')
})
await page.reload({ waitUntil: 'networkidle' })
await goPaspoort()
await page.screenshot({ path: 'quiz-grid.png' })

// 2. Quiz screen (tap Karlsruhe stamp)
await page.evaluate(() => {
  // find and click the first available stamp (Karlsruhe)
  const buttons = Array.from(document.querySelectorAll('button'))
  const stamp = buttons.find(b => b.textContent.includes('Karlsruhe'))
  stamp?.click()
})
await page.waitForTimeout(300)
await page.screenshot({ path: 'quiz-question.png' })

// 3. Answer correctly
await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('button'))
  const correct = buttons.find(b => b.textContent.includes('waaier'))
  correct?.click()
})
await page.waitForTimeout(200)
await page.screenshot({ path: 'quiz-correct.png' })

await browser.close()
console.log('done')
