/**
 * DOM boot test (development tool, not shipped).
 *
 * Renders the real application in jsdom and reports what the browser would
 * report: uncaught errors, React warnings, and whether the page has content.
 *
 * jsdom has no WebGL, so this exercises exactly the path a visitor on an old
 * device or with hardware acceleration disabled would take — `probeWebGL()`
 * fails, the canvas is never mounted, and the site must fall back to the static
 * portfolio with every project, skill, timeline entry and contact link present.
 * That graceful-degradation requirement is otherwise impossible to verify
 * without a browser.
 *
 *   node tools/verify-dom.mjs
 */

import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const dom = new JSDOM(
  `<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>`,
  { url: 'https://sangam-portfolio-roan.vercel.app/', pretendToBeVisual: true }
)

const { window } = dom

/* jsdom deliberately ships no layout, no WebGL and no observers. Polyfill only
 * what the libraries touch, and never with anything that would fake a pass. */
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
window.ResizeObserver = NoopObserver
window.IntersectionObserver = NoopObserver
window.matchMedia =
  window.matchMedia ||
  ((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false
    },
  }))

/* jsdom logs "Not implemented: HTMLCanvasElement.prototype.getContext" itself;
 * that is the platform being honest about a missing GPU, not a site error. */
const IGNORED = [
  /Not implemented: HTMLCanvasElement/, // jsdom has no GPU: that is the point of this test
  /THREE_CJS_DEPRECATED|DeprecationWarning: `require\("three"\)`/, // Node CJS shim, browser build is ESM
  /Not implemented: window\.scrollTo/,
  /Not implemented: navigation/,
  /ReactDOMTestUtils\.act is deprecated/i,
  /not wrapped in act\(\.\.\.\)/,
  /An update to .* inside a test was not wrapped in act/,
]
const ignorable = (message) => IGNORED.some((pattern) => pattern.test(message))

const problems = []
const record = (kind) => (...args) => {
  const message = args
    .map((arg) => (arg instanceof Error ? `${arg.name}: ${arg.message}` : String(arg)))
    .join(' ')
  if (ignorable(message)) return
  problems.push(`[${kind}] ${message}`)
}

window.console.error = record('console.error')
window.console.warn = record('console.warn')
// React resolves its logger through the global console, not window.console.
globalThis.console.error = window.console.error
globalThis.console.warn = window.console.warn

const expected = []
let unmount = () => {}

const server = await createServer({
  root,
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  ssr: { noExternal: [] },
})

const installGlobals = () => {
  for (const key of [
    'window',
    'document',
    'navigator',
    'HTMLElement',
    'Element',
    'Node',
    'Event',
    'CustomEvent',
    'DocumentFragment',
    'getComputedStyle',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'ResizeObserver',
    'IntersectionObserver',
    'matchMedia',
    'devicePixelRatio',
    'Window',
  ]) {
    if (!(key in window)) continue
    try {
      globalThis[key] = window[key]
    } catch {
      // Node 22+ exposes some of these (navigator) as getter-only globals.
      try {
        Object.defineProperty(globalThis, key, {
          value: window[key],
          configurable: true,
          writable: true,
        })
      } catch {
        /* leave Node's own version in place */
      }
    }
  }
  globalThis.self = window
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
}

try {
  installGlobals()
  const { default: App } = await server.ssrLoadModule('/src/App.jsx')
  const { profile } = await server.ssrLoadModule('/src/data/profile.js')
  const { projects } = await server.ssrLoadModule('/src/data/projects.js')
  const { skillCategories } = await server.ssrLoadModule('/src/data/skills.js')
  const { timeline, achievements } = await server.ssrLoadModule('/src/data/timeline.js')

  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = await import('react')

  const container = window.document.getElementById('root')
  const reactRoot = createRoot(container)

  console.log('\n▸ booting the app in jsdom (no WebGL available)')
  await act(async () => {
    reactRoot.render(React.createElement(App))
  })
  // Let timers, the loader watcher and any deferred effects settle.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600))
  })

  const html = container.innerHTML
  const text = container.textContent.replace(/\s+/g, ' ')
  unmount = () => reactRoot.unmount()

  const has = (label, condition) => {
    console.log(`  ${condition ? '✓' : '✗'} ${label}`)
    if (!condition) problems.push(`missing from the rendered page: ${label}`)
  }

  console.log('\n▸ rendered content')
  has('the root element has children', container.childElementCount > 0)
  has('a page length worth reading', text.length > 1500)
  has('the name is on the page', text.includes(profile.name))
  has('the role is on the page', text.includes(profile.role))

  expected.push(...projects.map((project) => project.name))
  for (const project of projects) {
    has(`project “${project.name}”`, text.includes(project.name))
  }
  for (const category of skillCategories) {
    has(`skill group “${category.title}”`, text.includes(category.title))
  }
  for (const entry of timeline) {
    has(`timeline entry “${entry.title}”`, text.includes(entry.title))
  }
  has('at least one achievement', achievements.some((item) => text.includes(item.label)))
  has('the contact email', text.includes(profile.contact.email))
  has('the GitHub link', html.includes(profile.contact.github))
  has('the LinkedIn link', html.includes(profile.contact.linkedin))
  has('the résumé link', html.includes(`href="${profile.resume.href}"`))
  has('a nav landmark', Boolean(container.querySelector('nav')))
  has('one h1 only', container.querySelectorAll('h1').length === 1)
  has('no WebGL canvas in fallback mode', container.querySelectorAll('canvas').length === 0)

  console.log(`\n▸ console output: ${problems.length ? `${problems.length} problem(s)` : 'clean'}`)
  if (problems.length) {
    for (const problem of [...new Set(problems)]) console.log(`  · ${problem}`)
    process.exitCode = 1
  } else {
    console.log('✓ the app boots clean and degrades gracefully\n')
  }
} catch (error) {
  console.error('\n✗ the app failed to boot\n', error)
  process.exitCode = 1
} finally {
  try {
    unmount()
  } catch {
    /* the tree may never have mounted */
  }
  await server.close()
  try {
    window.close()
  } catch {
    /* jsdom is already gone */
  }
  // jsdom keeps timers and sockets alive; the checks are done, so end the process.
  process.exit(process.exitCode ?? 0)
}
