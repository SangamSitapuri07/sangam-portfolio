import { LAPTOP_ASSET } from '../../src/config/assets.js'
import { test, expect } from '@playwright/test'
import { SCENES } from '../../src/data/story.js'

async function seek(page, id, local = .5) {
  const expected = await page.evaluate(({ id, local }) => {
    const sections = [...document.querySelectorAll('.story-scene')]
    const index = sections.findIndex((section) => section.id === id)
    const section = sections[index]
    const length = index === sections.length - 1 ? document.documentElement.scrollHeight - innerHeight - section.offsetTop : sections[index + 1].offsetTop - section.offsetTop
    window.scrollTo({ top: section.offsetTop + length * local, behavior: 'instant' })
    return index
  }, { id, local })
  await expect.poll(() => page.locator('canvas').getAttribute('data-scene'), { timeout: 30000 }).toBe(String(expected + 1))
  return expected
}

test('all ten connected chapters and CV-backed credentials exist in the reading layout', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.story-scene')).toHaveCount(10)
  expect(await page.locator('.story-scene').evaluateAll((nodes) => nodes.map((node) => node.id))).toEqual(SCENES.map(({ id }) => id))
  await expect(page.locator('#breakdown')).toContainText('illustrative PCB')
  await expect(page.locator('#about')).toContainText('Lovely Professional University')
  await expect(page.locator('#about .credentials-grid a')).toHaveCount(6)
  await expect(page.locator('#projects .universe-card')).toHaveCount(4)
  await expect(page.locator('#afterglow footer')).toContainText('CC BY 4.0')
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('project details are real dialogs, preserve links, close with Escape, and restore focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#projects')
  const open = page.getByRole('button', { name: 'View AI Debate Coach details', exact: true })
  await open.click()
  const dialog = page.getByRole('dialog', { name: 'AI Debate Coach' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Engineering decisions')
  await expect(dialog.getByRole('link', { name: 'Source code' })).toHaveAttribute('href', 'https://github.com/SangamSitapuri07/AI-Debate_Coach')
  await expect(page).toHaveURL(/project=ai-debate-coach/)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(open).toBeFocused()
})

test('case-study tabs support keyboard navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#deep-dive')
  const tab = page.getByRole('tab', { name: 'The problem', exact: true })
  await tab.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'The approach', exact: true })).toBeFocused()
  await expect(page.getByRole('tab', { name: 'The approach', exact: true })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel')).toContainText('argument generation')
})

test('mobile menu and back-to-top controls navigate without trapping scrolling', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Open navigation' }).click()
    const nav = page.getByRole('navigation', { name: 'Scene navigation', exact: true })
    await expect(nav.getByRole('link')).toHaveCount(10)
    await nav.getByRole('link', { name: /The Final Transmission/ }).click()
  } else await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact', exact: true }).click()
  await expect(page).toHaveURL(/#contact$/)
  await expect(page.locator('#contact')).toBeInViewport()
  await page.getByRole('link', { name: 'Back to the beginning', exact: true }).click()
  await expect(page).toHaveURL(/#home$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
})

test('direct refresh restores the project scene and its selected dossier', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?project=nuno#projects')
  await expect(page.getByRole('dialog', { name: 'Nuno', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('dialog', { name: 'Nuno', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close project details' }).click()
  await expect(page.locator('#projects')).toBeInViewport()
})

test('a single canvas and one GLB survive forward, reverse, and reassembly scrubbing', async ({ page }, testInfo) => {
  testInfo.setTimeout(150000)
  let downloads = 0
  page.on('request', (request) => { if (request.method() === 'GET' && request.url().endsWith(LAPTOP_ASSET.url)) downloads++ })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('[data-scene-ready="true"]')).toBeAttached({ timeout: 60000 })
  await page.evaluate(() => { window.__originalCanvas = document.querySelector('canvas') })
  await seek(page, 'breakdown', .9)
  await expect.poll(async () => Number(await page.locator('canvas').getAttribute('data-explosion')), { timeout: 30000 }).toBeGreaterThan(testInfo.project.name === 'mobile' ? .53 : .94)
  const exploded = Number(await page.locator('canvas').getAttribute('data-explosion'))
  await seek(page, 'about', .1)
  await expect.poll(async () => Number(await page.locator('canvas').getAttribute('data-explosion')), { timeout: 30000 }).toBe(0)
  await seek(page, 'breakdown', .9)
  await expect.poll(async () => Math.abs(Number(await page.locator('canvas').getAttribute('data-explosion')) - exploded), { timeout: 30000 }).toBeLessThan(.025)
  expect(await page.evaluate(() => window.__originalCanvas === document.querySelector('canvas'))).toBe(true)
  await page.setViewportSize(testInfo.project.name === 'mobile' ? { width: 430, height: 932 } : { width: 1024, height: 768 })
  await expect(page.locator('canvas')).toHaveCount(1)
  await expect(page.locator('[data-scene-ready="true"]')).toBeAttached()
  expect(downloads).toBe(1)
  expect(errors).toEqual([])
})

test('HTML returned in place of the GLB falls back before WebGL boot', async ({ page }) => {
  const checked = page.waitForResponse((response) => response.url().endsWith(LAPTOP_ASSET.url) && response.request().method() === 'HEAD')
  await page.route(`**${LAPTOP_ASSET.url}`, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<html>Not a model</html>' }))
  await page.goto('/')
  await checked
  await expect(page.locator('[data-render-mode="image"]')).toBeVisible()
  await expect(page.locator('.story-scene')).toHaveCount(10)
  await expect(page.locator('canvas')).toHaveCount(0)
})


test('production HTML remains complete when JavaScript is disabled', async ({ browser }) => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL && process.env.PLAYWRIGHT_PRODUCTION !== '1', 'Build-time HTML is tested against the production preview.')
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173/')
  await expect(page.locator('.story-scene')).toHaveCount(10)
  await expect(page.getByRole('heading', { level: 1, name: 'Sangam Sitapuri' })).toBeVisible()
  await expect(page.locator('#about')).toContainText('Lovely Professional University')
  await expect(page.locator('#contact')).toContainText('sitapurisangampac@gmail.com')
  await expect(page.locator('#projects .project-links a[href^="https:"]')).toHaveCount(7)
  await expect(page.locator('canvas')).toHaveCount(0)
  await context.close()
})
