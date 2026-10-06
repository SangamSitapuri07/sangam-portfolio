import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import '@/index.css'

/**
 * Entry point.
 *
 * Fonts are awaited before the first paint of the canvas layer so the drawn screen
 * interfaces and the DOM copy use the same typeface — an un-flashed swap of a
 * display texture is far more obvious than one in flowing text.
 */
const container = document.getElementById('root')
const root = createRoot(container)

const render = () => root.render(
  <StrictMode>
    <App />
  </StrictMode>
)

const fontsReady =
  typeof document !== 'undefined' && document.fonts?.ready
    ? Promise.race([
        document.fonts.ready,
        new Promise((resolve) => window.setTimeout(resolve, 1200)),
      ])
    : Promise.resolve()

fontsReady.finally(render)
