import { defineConfig } from '@playwright/test'

const production = process.env.PLAYWRIGHT_PRODUCTION === '1'
const baseURL = process.env.PLAYWRIGHT_BASE_URL || (production ? 'http://127.0.0.1:4173' : 'http://127.0.0.1:5173')

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  // One software WebGL worker in CI avoids competing GPU contexts on shared runners.
  workers: process.env.CI ? 1 : 2,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL,
    browserName: 'chromium',
    launchOptions: {
      args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
    },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: production ? 'npm run preview' : 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
