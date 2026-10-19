import { LAPTOP_ASSET } from '../../src/config/assets.js'
import { test, expect } from '@playwright/test'

test('identity, content, and navigation are real accessible HTML', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page).toHaveTitle(/Sangam Sitapuri/)
  await expect(page.getByRole('heading', { level: 1, name: 'Sangam Sitapuri' })).toBeVisible()
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await expect(page.getByRole('navigation', { name: 'Scene navigation', exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
  } else await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'AI Debate Coach' }).first()).toBeAttached()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('actual GLB loads cleanly and demand-rendered canvas respects the DPR cap', async ({ page }, testInfo) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text())
  })
  await page.goto('/')
  await expect(page.locator('[data-scene-ready="true"]')).toBeAttached({ timeout: 60000 })
  const canvas = page.locator('canvas')
  await expect(canvas).toBeAttached()
  const ratio = await canvas.evaluate((node) => node.width / node.getBoundingClientRect().width)
  expect(ratio).toBeLessThanOrEqual(testInfo.project.name === 'mobile' ? 1.51 : 2.01)
  expect(errors).toEqual([])
})

test('image view works and persists across reloads', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Use lightweight image view' }).click()
  await expect(page.locator('[data-render-mode="image"]')).toBeVisible()
  await page.reload()
  await expect(page.locator('[data-render-mode="image"]')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('reduced motion skips WebGL and the model download', async ({ page }) => {
  const modelRequests = []
  page.on('request', (request) => {
    if (request.url().includes('.glb')) modelRequests.push(request.url())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('[data-render-mode="image"]')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  expect(modelRequests).toEqual([])
})

test('WebGL unavailable still shows the portfolio and real model poster', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === 'webgl2' || type === 'webgl' ? null : original.call(this, type, ...args)
    }
  })
  await page.goto('/')
  await expect(page.locator('[data-render-mode="image"]')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect.poll(() => page.locator('.laptop-poster').evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true)
})

test('project CTA reaches the work section and project links are not placeholders', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('link', { name: 'Explore my work' }).click()
  await expect(page).toHaveURL(/#projects$/)
  await expect(page.locator('#projects')).toBeInViewport()
  const links = await page.locator('#projects .project-links a[href*="github.com"]').evaluateAll((nodes) => nodes.map((node) => node.href))
  expect(links).toHaveLength(4)
  expect(links.every((href) => href.startsWith('https://github.com/SangamSitapuri07/'))).toBe(true)
})

test('keyboard skip link is visible on focus and reaches main content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
})

test('missing model uses the real poster without losing portfolio content', async ({ page }) => {
  const failed = page.waitForEvent('requestfailed', { predicate: (request) => request.url().endsWith(LAPTOP_ASSET.url) })
  await page.route(`**${LAPTOP_ASSET.url}`, (route) => route.abort())
  await page.goto('/')
  await failed
  await expect(page.locator('[data-render-mode="image"]')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Sangam Sitapuri' })).toBeVisible()
  await expect.poll(() => page.locator('.laptop-poster').evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true)
})
