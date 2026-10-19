import { test, expect } from '@playwright/test'
import { LAPTOP_ASSET } from '../../src/config/assets.js'

test('failed project previews keep their details, links, and truthful overview captions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/images/projects/*', (route) => route.abort())
  await page.goto('/#projects')
  const preview = page.getByRole('button', { name: 'View AI Debate Coach details', exact: true })
  await preview.scrollIntoViewIfNeeded()
  await expect(preview.locator('[data-media-state="fallback"]')).toBeVisible()
  await expect(preview).toContainText('PROJECT OVERVIEW / PREVIEW UNAVAILABLE')
  await preview.click()
  const dialog = page.getByRole('dialog', { name: 'AI Debate Coach', exact: true })
  await expect(dialog.locator('[data-media-state="fallback"]')).toBeVisible()
  await expect(dialog.getByRole('link', { name: 'Source code' })).toHaveAttribute('href', /AI-Debate_Coach$/)
  await page.keyboard.press('Escape')
  await page.getByRole('link', { name: 'Explore AI Debate Coach case study', exact: true }).click()
  await expect(page.locator('#deep-dive .project-media[data-media-state="fallback"]')).toBeVisible()
})

test('a missing model poster has a labelled local illustration instead of a broken image', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route(`**${LAPTOP_ASSET.poster}`, (route) => route.abort())
  await page.goto('/')
  await expect(page.locator('[data-poster-state="illustration"]')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Sangam Sitapuri' })).toBeVisible()
  await expect(page.locator('#contact').getByRole('link', { name: 'Say hello', exact: true })).toHaveAttribute('href', 'mailto:sitapurisangampac@gmail.com')
})

test('a stalled asset check falls back to all ten reading chapters', async ({ page }) => {
  const routes = []
  await page.clock.install()
  await page.route(`**${LAPTOP_ASSET.url}`, (route) => { routes.push(route) })
  await page.goto('/')
  await expect.poll(() => routes.length).toBeGreaterThan(0)
  await page.clock.runFor(8500)
  await expect(page.locator('[data-render-mode="image"]')).toBeVisible()
  await expect(page.locator('.story-scene')).toHaveCount(10)
  await expect(page.locator('canvas')).toHaveCount(0)
})
