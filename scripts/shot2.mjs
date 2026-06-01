import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.setViewportSize({ width: 1024, height: 768 })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })

async function selectStop(order) {
  await page.evaluate(() => {
    document.querySelectorAll('button')[0].click()
  })
  await page.waitForTimeout(150)
  await page.evaluate((o) => {
    const texts = Array.from(document.querySelectorAll('svg text'))
    texts.find(t => t.textContent.trim() === String(o))
      ?.closest('g')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }, order)
  await page.waitForTimeout(300)
}

// Zugspitze (stop 3 — full content)
await selectStop(3)
await page.screenshot({ path: 'card-zugspitze.png' })

// Bodensee (stop 2 — minimal content)
await selectStop(2)
await page.screenshot({ path: 'card-bodensee.png' })

// Karlsruhe (stop 1 — full content)
await selectStop(1)
await page.screenshot({ path: 'card-karlsruhe.png' })

await browser.close()
console.log('done')
