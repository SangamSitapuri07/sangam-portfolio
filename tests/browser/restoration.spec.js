import { test, expect } from '@playwright/test'

const progress = (page) => page.evaluate(() => Number(document.documentElement.style.getPropertyValue('--story-progress')))

async function seek(page, id, fraction) {
  await page.evaluate(({ id, fraction }) => {
    const sections = [...document.querySelectorAll('.story-scene')]
    const index = sections.findIndex((section) => section.id === id)
    const section = sections[index]
    const end = sections[index + 1]?.offsetTop ?? document.documentElement.scrollHeight - innerHeight
    window.scrollTo({ top: section.offsetTop + (end - section.offsetTop) * fraction, behavior: 'instant' })
  }, { id, fraction })
}

test('reload preserves an exact mid-chapter position instead of resetting its hash', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#skills')
  await expect(page.locator('[data-capability-checked="true"]')).toBeAttached()
  await seek(page, 'skills', .43)
  const expected = .32 + .09 * .43
  await expect.poll(async () => Math.abs(await progress(page) - expected)).toBeLessThan(.002)
  await expect.poll(() => page.evaluate(() => history.state?.portfolioStory?.progress)).toBeGreaterThan(.35)
  await page.reload()
  await expect.poll(async () => Math.abs(await progress(page) - expected)).toBeLessThan(.002)
  await expect(page).toHaveURL(/#skills$/)
})

test('history back and forward restore each chapter entry with its own bookmark', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#skills')
  await seek(page, 'skills', .45)
  const expected = .32 + .09 * .45
  await expect.poll(async () => Math.abs(await progress(page) - expected)).toBeLessThan(.002)
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await page.getByRole('navigation', { name: 'Scene navigation', exact: true }).getByRole('link', { name: /The Final Transmission/ }).click()
  } else await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact', exact: true }).click()
  await expect(page).toHaveURL(/#contact$/)
  await expect.poll(() => progress(page)).toBeGreaterThanOrEqual(.839)
  await page.goBack()
  await expect(page).toHaveURL(/#skills$/)
  await expect.poll(async () => Math.abs(await progress(page) - expected)).toBeLessThan(.002)
  await page.goForward()
  await expect(page).toHaveURL(/#contact$/)
  await expect.poll(() => progress(page)).toBeGreaterThanOrEqual(.839)
})

test('responsive reflow preserves normalized narrative position', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#deep-dive')
  await seek(page, 'deep-dive', .33)
  const expected = .52 + .11 * .33
  await expect.poll(async () => Math.abs(await progress(page) - expected)).toBeLessThan(.002)
  await page.setViewportSize(testInfo.project.name === 'mobile' ? { width: 430, height: 932 } : { width: 1024, height: 768 })
  await expect.poll(async () => Math.abs(await progress(page) - expected)).toBeLessThan(.003)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('cinematic and reading view switches preserve the point within a chapter', async ({ page }, testInfo) => {
  testInfo.setTimeout(120000)
  await page.goto('/#breakdown')
  await expect(page.locator('[data-scene-ready="true"]')).toBeAttached({ timeout: 60000 })
  await seek(page, 'breakdown', .68)
  const expected = .18 + .14 * .68
  await expect.poll(async () => Math.abs(await progress(page) - expected), { timeout: 30000 }).toBeLessThan(.002)
  await page.getByRole('button', { name: 'Use lightweight image view' }).click()
  await expect(page.locator('[data-render-mode="image"]')).toBeVisible()
  await expect.poll(async () => Math.abs(await progress(page) - expected)).toBeLessThan(.003)
  await page.getByRole('button', { name: 'Use 3D studio view' }).click()
  await expect(page.locator('[data-scene-ready="true"]')).toBeAttached({ timeout: 60000 })
  await expect.poll(async () => Math.abs(await progress(page) - expected)).toBeLessThan(.003)
})
