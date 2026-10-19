import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('reading/image layout meets automated WCAG A/AA checks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(results.violations).toEqual([])
})
