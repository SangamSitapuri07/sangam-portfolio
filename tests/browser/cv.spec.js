import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { PERSONAL } from '../../src/data/personal.js'
import { RESUME_ASSET } from '../../src/config/assets.js'

const hashBlob = (data) => createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex')

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
})

test('hero and contact download the actual CV with the correct filename', async ({ page }, testInfo) => {
  const links = page.getByRole('link', { name: 'Download résumé', exact: true })
  await expect(links).toHaveCount(2)
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('href', RESUME_ASSET.url)
    await expect(link).toHaveAttribute('download', RESUME_ASSET.downloadName)
  }
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    links.first().click(),
  ])
  expect(download.suggestedFilename()).toBe(RESUME_ASSET.downloadName)
  const outputPath = testInfo.outputPath('downloaded-cv.pdf')
  await download.saveAs(outputPath)
  const bytes = await readFile(outputPath)
  expect(bytes.length).toBe(RESUME_ASSET.bytes)
  expect(hashBlob(bytes)).toBe(RESUME_ASSET.sourceSha)
})

test('profile, education, email, and LinkedIn match the supplied CV', async ({ page }) => {
  await expect(page).toHaveTitle(/Sangam Sitapuri/)
  await expect(page.getByRole('heading', { level: 1, name: PERSONAL.name })).toBeVisible()
  await expect(page.locator('#about')).toContainText(PERSONAL.education.institution)
  await expect(page.locator('#about')).toContainText('CGPA 8.52')
  await expect(page.getByRole('link', { name: 'Say hello', exact: true })).toHaveAttribute('href', `mailto:${PERSONAL.contact.email}`)
  await expect(page.locator('#contact').getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute('href', PERSONAL.contact.linkedin)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('current CV projects expose proper web and Android demo links', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Nuno', exact: true })).toBeAttached()
  await expect(page.getByRole('link', { name: 'Live demo for AI Debate Coach (opens in a new tab)' })).toHaveAttribute('href', 'https://debate-coach.netlify.app/')
  const android = page.getByRole('link', { name: /Android app · Drive for/ })
  await expect(android).toHaveCount(2)
  const destinations = await android.evaluateAll((links) => links.map((link) => link.href))
  expect(destinations.every((url) => url.startsWith('https://drive.google.com/file/d/'))).toBe(true)
})
