import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { PERSONAL } from '../src/data/personal.js'
import { LAPTOP_ASSET } from '../src/config/assets.js'

// Run against the dev server. These URLs belong to this Node-only asset tool,
// never the browser-facing application. Normal Playwright installation works;
// constrained CI may provide a Chromium executable through the environment.
const baseURL = process.env.PORTFOLIO_PREVIEW_URL || 'http://127.0.0.1:5173'
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
const browser = await chromium.launch({
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--no-zygote'],
  ...(executablePath ? { executablePath } : {}),
})

try {
  await mkdir(new URL('../public/images/', import.meta.url), { recursive: true })
  await mkdir(new URL('../public/assets/', import.meta.url), { recursive: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const socialImage = await page.evaluate(async ({ personal, credit }) => {
    await document.fonts.ready
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 630
    const context = canvas.getContext('2d')
    context.fillStyle = '#08090d'
    context.fillRect(0, 0, 1200, 630)
    const glow = context.createRadialGradient(890, 305, 0, 890, 305, 430)
    glow.addColorStop(0, '#102d3a')
    glow.addColorStop(1, '#08090d')
    context.fillStyle = glow
    context.fillRect(570, 0, 630, 630)
    context.font = '500 12px "Inter Variable"'
    context.fillStyle = '#35e7ff'
    context.fillText('THE BREAKDOWN PROTOCOL', 66, 80)
    context.fillStyle = '#f2f3f7'
    context.font = '550 107px "Inter Variable"'
    context.fillText(personal.firstName, 60, 235)
    context.fillText(personal.lastName, 60, 340)
    context.fillStyle = '#35e7ff'
    context.fillText('.', 60 + context.measureText(personal.lastName).width, 340)
    context.font = '400 22px "Inter Variable"'
    context.fillStyle = '#b1bbd1'
    context.fillText(personal.title, 66, 408)
    const image = new window.Image()
    image.src = `/images/laptop-studio.png?v=${Date.now()}`
    await image.decode()
    context.drawImage(image, 535, 73, 730, 558)
    context.strokeStyle = '#202637'
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(66, 531)
    context.lineTo(1134, 531)
    context.stroke()
    context.font = '400 13px "Inter Variable"'
    context.fillStyle = '#93a0ba'
    context.fillText(personal.tagline, 66, 568)
    context.font = '400 10px "Inter Variable"'
    context.fillText(`3D model: ${credit.author} · ${credit.license}`, 901, 594)
    return canvas.toDataURL('image/png').split(',')[1]
  }, { personal: PERSONAL, credit: LAPTOP_ASSET.attribution })

  await writeFile(new URL('../public/assets/og-image.png', import.meta.url), Buffer.from(socialImage, 'base64'))
  console.log('Updated the 1200 × 630 social preview using the existing real-model poster.')
} finally {
  await browser.close()
}
