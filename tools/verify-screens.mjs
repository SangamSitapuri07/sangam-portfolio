/**
 * Screen texture test + preview generator (development tool, not shipped).
 *
 * The laptop's display content is painted on a 2D canvas by ~1000 lines that no
 * other test touches: it only runs inside the WebGL scene, so a typo there means
 * a blank screen on the model. This runs the real painters in Node against a real
 * Skia canvas and
 *
 *   1. asserts every section paints without throwing,
 *   2. asserts each screen contains the copy it is supposed to (the painter's
 *      text calls are recorded),
 *   3. asserts the result is not a blank rectangle,
 *   4. writes PNGs to .qa/screens/ so the designs can be reviewed by eye.
 *
 *   node tools/verify-screens.mjs
 */

import { createCanvas } from '@napi-rs/canvas'
import { createServer } from 'vite'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const OUT = path.join(root, '.qa', 'screens')

/* ---- The painters only need `document.createElement('canvas')` ---- */
const canvasFor = (tag) => {
  if (tag !== 'canvas') throw new Error(`unsupported element: ${tag}`)
  return createCanvas(2, 2)
}
globalThis.document = { createElement: canvasFor }

/* ---- Record every string the painters draw, so copy is assertable ---- */
const painted = []
const runs = []
const probe = createCanvas(4, 4).getContext('2d')
const proto = Object.getPrototypeOf(probe)
const originalFillText = proto.fillText

/* Opaque rectangles painted after a text run hide it (panels, scrims, chips). */
const covers = []
const originalFillRect = proto.fillRect
proto.fillRect = function fillRect(x, y, w, h) {
  if ((this.globalAlpha ?? 1) > 0.85 && w > 8 && h > 8) {
    covers.push({ left: x, top: y, right: x + w, bottom: y + h, at: runs.length })
  }
  return originalFillRect.call(this, x, y, w, h)
}

const isHidden = (run, index) =>
  covers.some(
    (rect) =>
      rect.at > index &&
      rect.left <= run.left + 1 &&
      rect.right >= run.right - 1 &&
      rect.top <= run.top + 1 &&
      rect.bottom >= run.bottom - 1
  )

const fontSizeOf = (font) => {
  const match = /(\d+(?:\.\d+)?)px/.exec(font ?? '')
  return match ? Number(match[1]) : 16
}

proto.fillText = function fillText(text, x, y, ...rest) {
  const value = String(text)
  painted.push(value)
  const transform = this.getTransform?.()
  const rotated = transform ? Math.abs(transform.b ?? 0) > 1e-6 || Math.abs(transform.c ?? 0) > 1e-6 : false
  const alpha = this.globalAlpha ?? 1
  /* Watermarks and faint monograms are drawn *behind* content on purpose: a
     collision only matters for text a visitor can actually read. */
  const colour = this.fillStyle
  const lum = (() => {
    if (typeof colour !== 'string') return 0 // gradients are decorative here
    const hex = /^#([0-9a-f]{6})$/i.exec(colour.trim())
    if (hex) {
      const n = parseInt(hex[1], 16)
      return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114
    }
    const rgb = /rgba?\(([^)]+)\)/.exec(colour)
    if (rgb) {
      const [r, g, b] = rgb[1].split(',').map((part) => parseFloat(part))
      return (r ?? 0) * 0.299 + (g ?? 0) * 0.587 + (b ?? 0) * 0.114
    }
    return 255
  })()
  const legible = alpha > 0.55 && lum > 90
  if (!rotated && legible && value.trim().length > 1) {
    const size = fontSizeOf(this.font)
    const metrics = this.measureText(value)
    /* Real glyph bounds where the canvas can give them, so a tall numeral is not
       blamed for the whitespace inside its own em box. */
    const ascent = metrics.actualBoundingBoxAscent || size * 0.78
    const descent = metrics.actualBoundingBoxDescent || size * 0.22
    const width = metrics.width
    /* x is the anchor, not the left edge: centred and right-aligned runs must be
       boxed from their own alignment or every chip looks like a collision. */
    const align = this.textAlign ?? 'start'
    const left = align === 'center' ? x - width / 2 : align === 'right' || align === 'end' ? x - width : x
    runs.push({
      text: value,
      x,
      y,
      size,
      left,
      right: left + width,
      top: y - ascent,
      bottom: y + descent,
      alpha,
    })
  }
  return originalFillText.call(this, value, x, y, ...rest)
}

/** Text runs that visibly collide: two labels whose boxes overlap. */
const collisions = (threshold = 6) => {
  const found = []
  const sorted = runs
    .map((run, index) => ({ run, index }))
    .filter(({ run, index }) => !isHidden(run, index))
    .map(({ run }) => run)
    .sort((a, b) => a.top - b.top)
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const a = sorted[i]
      const b = sorted[j]
      if (b.top > a.bottom + threshold) break
      const dy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
      const dx = Math.min(a.right, b.right) - Math.max(a.left, b.left)
      if (dy > threshold && dx > threshold) {
        found.push({
          a: a.text,
          b: b.text,
          dy: Math.round(dy),
          dx: Math.round(dx),
          box: `a[${[a.left, a.top, a.right, a.bottom].map(Math.round).join(',')}] b[${[b.left, b.top, b.right, b.bottom].map(Math.round).join(',')}]`,
        })
      }
    }
  }
  return found
}

const problems = []
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? `  ${detail}` : ''}`)
  if (!ok) problems.push(label)
}

const coverage = (canvas) => {
  // Sample a grid of pixels; a painted screen has many distinct colours.
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  const { data } = ctx.getImageData(0, 0, width, height)
  const seen = new Set()
  let bright = 0
  for (let i = 0; i < data.length; i += 4 * 37) {
    seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`)
    if (data[i] + data[i + 1] + data[i + 2] > 120) bright += 1
  }
  return { colours: seen.size, litFraction: bright / (data.length / (4 * 37)) }
}

const server = await createServer({
  root,
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})

try {
  const { createScreenTextures } = await server.ssrLoadModule('/src/lib/screenTextures.js')
  const { projects } = await server.ssrLoadModule('/src/data/projects.js')
  const { skillCategories } = await server.ssrLoadModule('/src/data/skills.js')
  const { profile } = await server.ssrLoadModule('/src/data/profile.js')

  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })

  const { tiers } = await server.ssrLoadModule('/src/config/quality.js')

  const save = async (canvas, name) => {
    await writeFile(path.join(OUT, name), canvas.toBuffer('image/png'))
    return canvas
  }

  /* Paint the whole film at every quality tier: the same code runs on high-end
     desktops and on the low tier, where the status panel is switched off. */
  let textures
  let reports = []

  const keys = [
    'boot',
    'hero',
    'about',
    'skills',
    ...projects.map((_, index) => `projects:${index}`),
    'experience',
    'contact',
  ]

  for (const tierName of ['high', 'medium', 'low']) {
    const tier = tiers[tierName]
    console.log(`\n▸ ${tierName} tier — painting every section screen`)
    textures = createScreenTextures({
      quality: tier,
      renderer: { capabilities: { getMaxAnisotropy: () => 8 } },
      getProgress: () => 0.42,
      getLoaderProgress: () => 0.86,
    })
    reports = []

    for (const key of keys) {
      painted.length = 0
      runs.length = 0
      covers.length = 0
      let threw = null
      try {
        textures.setScreen(key, true)
      } catch (error) {
        threw = error
      }
      check(`“${key}” paints`, !threw, threw ? `→ ${threw.message}` : '')

      const canvas = textures.mainTexture.image
      const { colours, litFraction } = coverage(canvas)
      check(
        `“${key}” is not blank`,
        colours > 24 && litFraction > 0.01 && litFraction < 0.98,
        `(${colours} colours, ${(litFraction * 100).toFixed(1)}% lit)`
      )
      reports.push({ key, text: [...painted], colours })

      const hits = collisions()
      check(
        `“${key}” has no overlapping text`,
        hits.length === 0,
        hits.length ? `${hits.length} collision(s)` : ''
      )
      if (hits.length) {
        for (const hit of hits.slice(0, 6)) {
          console.log(`      · "${hit.a}" ✕ "${hit.b}"  (${hit.dx}×${hit.dy}px)  ${hit.box}`)
        }
      }
      if (tierName === 'high') await save(canvas, `main-${key.replace(':', '-')}.png`)
    }

    // The status panel is deliberately switched off below the medium tier.
    textures.updateStatus('hero', 0)
    const status = coverage(textures.statusTexture.image)
    if (tier.statusPanel) {
      check(`status panel paints on ${tierName}`, status.colours > 16, `(${status.colours} colours)`)
      if (tierName === 'high') await save(textures.statusTexture.image, 'status.png')
    } else {
      check(`status panel stays off on ${tierName}`, true)
    }
  }

  textures = createScreenTextures({
    quality: tiers.high,
    renderer: { capabilities: { getMaxAnisotropy: () => 8 } },
    getProgress: () => 0.42,
    getLoaderProgress: () => 0.86,
  })

  console.log('\n▸ the copy each screen carries')
  const screenText = (key) => reports.find((report) => report.key === key)?.text.join(' ') ?? ''
  check('hero names the person', screenText('hero').includes(profile.name), `"${profile.name}"`)
  check('hero states the role', screenText('hero').includes(profile.role))
  check('about mentions the university', screenText('about').includes(profile.education.institution))
  check(
    'skills lists every group',
    skillCategories.every((category) => screenText('skills').includes(category.title))
  )
  projects.forEach((project, index) => {
    const text = screenText(`projects:${index}`)
    check(`project screen ${project.index} is “${project.name}”`, text.includes(project.name))
    check(`project screen ${project.index} carries a stat`, text.length > 60)
  })
  check('experience lists entries', screenText('experience').length > 200)
  check('contact shows the email', screenText('contact').includes(profile.contact.email))

  console.log('\n▸ animated pass')
  painted.length = 0
  let animatedThrew = null
  try {
    textures.setScreen('hero', true)
    for (let frame = 0; frame < 12; frame += 1) {
      textures.update(frame / 6)
      textures.updateStatus('hero', frame / 6)
    }
  } catch (error) {
    animatedThrew = error
  }
  check('update() + updateStatus() run without throwing', !animatedThrew, animatedThrew?.message ?? '')
  await save(textures.mainTexture.image, 'main-hero-animated.png')
  await save(textures.statusTexture.image, 'status.png')

  const dataUrl = textures.toDataUrl()
  check('toDataUrl() returns a usable data URL', typeof dataUrl === 'string' && dataUrl.startsWith('data:image'))

  textures.dispose()
  console.log(`\n▸ previews written to .qa/screens/ (${keys.length + 2} images)`)
  if (problems.length) {
    console.log(`\n✗ ${problems.length} problem(s)`)
    for (const problem of problems) console.log(`  · ${problem}`)
    process.exitCode = 1
  } else {
    console.log('✓ every screen paints cleanly and carries its copy\n')
  }
} finally {
  await server.close()
}
