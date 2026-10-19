import { test, expect } from '@playwright/test'

test('lost WebGL context preserves all chapters and contact actions', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-scene-ready="true"]')).toBeAttached({ timeout: 60000 })
  await page.locator('canvas').evaluate((canvas) => {
    const gl = canvas.getContext('webgl2')
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  })
  await expect(page.locator('[data-render-mode="image"]')).toBeVisible()
  await expect(page.locator('.story-scene')).toHaveCount(10)
  await expect(page.locator('#contact').getByRole('link', { name: 'Say hello', exact: true })).toHaveAttribute('href', 'mailto:sitapurisangampac@gmail.com')
  await expect(page.locator('canvas')).toHaveCount(0)
})
