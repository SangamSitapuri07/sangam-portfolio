/**
 * Screen content.
 *
 * Every interface shown on the laptop is drawn to an offscreen 2D canvas and
 * uploaded as a `THREE.CanvasTexture`. That buys three things at once:
 *
 *   • crisp, real typography (Inter for prose, monospace for technical values),
 *   • no image assets to download — the screen content ships as code,
 *   • a natural fallback: the same content exists as HTML in the page.
 *
 * The drawn layout is designed around the model's physical display: the main
 * panel is three panes (33.4% / 36.6–63.5% / 66.7%) separated by two recessed
 * seams, so the interface is built as three columns and its dividers land exactly
 * on the hardware seams.
 *
 * Cost control: a full repaint happens only when the screen changes section, and
 * — only on capable devices — a light animated pass runs at ~7 fps (caret, scan
 * line, live indicators, progress rail).
 */

import * as THREE from 'three'

import { sceneState } from '@/lib/scrollEngine'

import { screens as screenConfig } from '@/config/laptop'
import { screenTheme as theme } from '@/config/screen'
import { profile } from '@/data/profile'
import { projects, flagshipProject } from '@/data/projects'
import { onProjectChange } from '@/lib/uiBus'
import { skillCategories } from '@/data/skills'
import { timeline } from '@/data/timeline'
import { chapters } from '@/data/chapters'

/* ------------------------------------------------------------------ *
 * Hardware column geometry (fractions of the display width)
 * ------------------------------------------------------------------ */
const COLUMNS = {
  seamA: [0.3336, 0.3655],
  seamB: [0.6353, 0.6672],
}

const px = (value) => `${value}px`
const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.arcTo(x + w, y, x + w, y + radius, radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius)
  ctx.lineTo(x + radius, y + h)
  ctx.arcTo(x, y + h, x, y + h - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
}

/**
 * One line of type. `maxWidth` clamps it with an ellipsis, which is what keeps a
 * long institution name or job title inside its column instead of printing over
 * the seam into the next one.
 */
function text(ctx, value, x, y, { size = 22, weight = 400, color = theme.ink, mono = false, align = 'left', spacing = 0, alpha = 1, maxWidth = 0 } = {}) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.font = `${weight} ${px(size)} ${mono ? theme.fontMono : theme.fontSans}`
  if (spacing) ctx.letterSpacing = px(spacing)
  const out = maxWidth > 0 ? truncate(ctx, value, maxWidth, ctx.font) : value
  ctx.fillText(out, x, y)
  ctx.restore()
}

function truncate(ctx, value, maxWidth, font) {
  ctx.save()
  ctx.font = font
  if (ctx.measureText(value).width <= maxWidth) {
    ctx.restore()
    return value
  }
  let out = value
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1)
  ctx.restore()
  return `${out}…`
}

/* ------------------------------------------------------------------ *
 * Module
 * ------------------------------------------------------------------ */

export function createScreenTextures({ quality, renderer } = {}) {
  /* Progress comes from the shared scroll state rather than a React ref: the
     canvases are painted outside the render pass, and reading a ref inside a memo
     is exactly the kind of render-time read that makes a component lie about its
     dependencies. */
  const readProgress = () => sceneState.film?.progress ?? 0
  /* The case study the display is showing. The DOM announces the visitor's choice
     on the bus; the painter never reads React state. */
  let deepDiveProject = flagshipProject
  const stopProjectWatch = onProjectChange((projectId) => {
    const next = projects.find((project) => project.id === projectId)
    if (!next || next === deepDiveProject) return
    deepDiveProject = next
    /* `setScreen` is declared below; this runs on an interaction, never before. */
    if (currentKey === 'deep-dive') setScreen('deep-dive', true)
  })
  const maxAnisotropy = renderer?.capabilities?.getMaxAnisotropy?.() ?? 1
  const scale = clamp(quality?.screenQuality ?? 1, 0.5, 1)

  const mainHeight = Math.round((screenConfig.main.resolution * scale) / 1) // long edge = resolution
  const mainWidth = Math.round(mainHeight * screenConfig.main.aspect)
  const statusHeight = Math.round(screenConfig.status.resolution * scale)
  const statusWidth = Math.round(statusHeight * screenConfig.status.aspect)

  const mainCanvas = document.createElement('canvas')
  mainCanvas.width = mainWidth
  mainCanvas.height = mainHeight
  const mainCtx = mainCanvas.getContext('2d', { alpha: false })

  const statusCanvas = document.createElement('canvas')
  statusCanvas.width = statusWidth
  statusCanvas.height = statusHeight
  const statusCtx = statusCanvas.getContext('2d', { alpha: false })

  const makeTexture = (canvas) => {
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    // Canvas textures sample correctly against the glTF panel UVs with flipY on
    // (see config/screen.js for the derivation).
    texture.flipY = true
    texture.anisotropy = maxAnisotropy
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = true
    texture.needsUpdate = true
    return texture
  }

  const mainTexture = makeTexture(mainCanvas)
  const statusTexture = makeTexture(statusCanvas)

  let currentKey = null
  let statusKey = null
  let animationAccumulator = 0

  /* ---------------- Frame scaffolding ---------------- */

  const W = mainWidth
  const H = mainHeight
  const u = (fraction) => fraction * W

  function drawBackdrop(ctx, accent) {
    ctx.fillStyle = theme.background
    ctx.fillRect(0, 0, W, H)

    // Very faint engineering grid
    ctx.strokeStyle = 'rgba(255,255,255,0.028)'
    ctx.lineWidth = 1
    const grid = Math.round(W / 32)
    for (let x = 0; x <= W; x += grid) {
      ctx.beginPath()
      ctx.moveTo(x + 0.5, 0)
      ctx.lineTo(x + 0.5, H)
      ctx.stroke()
    }
    for (let y = 0; y <= H; y += grid) {
      ctx.beginPath()
      ctx.moveTo(0, y + 0.5)
      ctx.lineTo(W, y + 0.5)
      ctx.stroke()
    }

    // Accent wash from the top, kept extremely subtle
    const wash = ctx.createLinearGradient(0, 0, 0, H * 0.6)
    wash.addColorStop(0, `${accent}22`)
    wash.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = wash
    ctx.fillRect(0, 0, W, H * 0.6)

    // Hardware seams — drawn where the model actually has its recessed dividers
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(u(COLUMNS.seamA[0]), 0, u(COLUMNS.seamA[1] - COLUMNS.seamA[0]), H)
    ctx.fillRect(u(COLUMNS.seamB[0]), 0, u(COLUMNS.seamB[1] - COLUMNS.seamB[0]), H)
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.fillRect(u(COLUMNS.seamA[0]), 0, 1, H)
    ctx.fillRect(u(COLUMNS.seamB[0]), 0, 1, H)
  }

  function drawChrome(ctx, { accent, breadcrumb, right = '' }) {
    const barH = H * 0.072
    ctx.fillStyle = 'rgba(8,11,18,0.86)'
    ctx.fillRect(0, 0, W, barH)
    ctx.fillStyle = theme.line
    ctx.fillRect(0, barH, W, 1)

    // Traffic lights
    const r = H * 0.009
    ;['#ff5f57', '#febc2e', '#28c840'].forEach((colour, index) => {
      ctx.beginPath()
      ctx.fillStyle = colour
      ctx.globalAlpha = 0.75
      ctx.arc(H * 0.035 + index * r * 3.4, barH / 2, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

    text(ctx, breadcrumb, H * 0.16, barH * 0.63, {
      size: Math.round(H * 0.024),
      color: theme.inkSoft,
      mono: true,
      spacing: 0.4,
    })

    if (right) {
      text(ctx, right, W - H * 0.04, barH * 0.63, {
        size: Math.round(H * 0.022),
        color: theme.inkFaint,
        mono: true,
        align: 'right',
        spacing: 0.6,
      })
    }

    // Overall scroll progress, drawn along the top edge of the display
    const progress = clamp(readProgress(), 0, 1)
    ctx.fillStyle = accent
    ctx.globalAlpha = 0.9
    ctx.fillRect(0, barH - 2, W * progress, 2)
    ctx.globalAlpha = 1
  }

  /* The display is nearly square, so below the content there was a band of dead
     space on every screen. The chapter rail fills it with something true: where
     this scene sits in the ten-scene film. It reads the *screen key*, so it can
     never disagree with what the camera is doing. */
  function drawChapterRail(ctx, key, accent) {
    if (!key) return
    const active = key.startsWith('projects:') ? 'universe' : key
    const activeIndex = chapters.findIndex((chapter) => chapter.id === active)
    if (activeIndex === -1) return

    const railH = H * 0.078
    const y = H - H * 0.058 - railH
    const gutter = H * 0.04
    const width = W - gutter * 2
    const slot = width / chapters.length

    ctx.fillStyle = theme.line
    ctx.fillRect(gutter, y + railH * 0.52, width, 1)

    chapters.forEach((chapter, index) => {
      const x = gutter + slot * index + slot / 2
      const on = index === activeIndex
      const done = index < activeIndex

      ctx.fillStyle = on ? accent : done ? theme.inkSoft : theme.line
      const tickH = on ? railH * 0.22 : railH * 0.12
      ctx.fillRect(x - (on ? 1 : 0.5), y + railH * 0.52 - tickH / 2, on ? 2 : 1, tickH)

      text(ctx, chapter.number, x, y + railH * 0.3, {
        size: Math.round(H * 0.017),
        mono: true,
        align: 'center',
        color: on ? accent : done ? theme.inkSoft : theme.inkFaint,
        alpha: done ? 0.85 : 1,
      })
    })

    /* The active chapter, named once — ten labels side by side would collide. */
    const chapter = chapters[activeIndex]
    text(ctx, `${chapter.number} · ${chapter.label.toUpperCase()}`, W - gutter, y - H * 0.018, {
      size: Math.round(H * 0.019),
      mono: true,
      align: 'right',
      color: accent,
      spacing: 1.2,
    })
  }

  function drawFooter(ctx, left, right = '', accent = theme.accent) {
    drawChapterRail(ctx, currentKey, accent)
    const barH = H * 0.058
    const y = H - barH
    ctx.fillStyle = 'rgba(8,11,18,0.9)'
    ctx.fillRect(0, y, W, barH)
    ctx.fillStyle = theme.line
    ctx.fillRect(0, y, W, 1)
    text(ctx, left, H * 0.04, y + barH * 0.68, {
      size: Math.round(H * 0.02),
      color: theme.inkFaint,
      mono: true,
      spacing: 0.5,
    })
    if (right) {
      text(ctx, right, W - H * 0.04, y + barH * 0.68, {
        size: Math.round(H * 0.02),
        color: theme.inkFaint,
        mono: true,
        align: 'right',
        spacing: 0.5,
      })
    }
  }

  /** Width a chip will occupy — shared with chip() so the two cannot drift. */
  function chipWidth(ctx, label, size = 0.019) {
    const fontSize = Math.round(H * size)
    ctx.save()
    ctx.font = `500 ${px(fontSize)} ${theme.fontMono}`
    const width = ctx.measureText(label).width + fontSize * 0.7 * 2
    ctx.restore()
    return width
  }

  function chip(ctx, label, x, y, { accent = theme.accent, size = 0.019, solid = false } = {}) {
    const fontSize = Math.round(H * size)
    ctx.save()
    ctx.font = `500 ${px(fontSize)} ${theme.fontMono}`
    const width = chipWidth(ctx, label, size)
    const height = fontSize * 1.9
    if (solid) {
      ctx.fillStyle = accent
      ctx.globalAlpha = 0.9
    } else {
      ctx.fillStyle = `${accent}1f`
      ctx.strokeStyle = `${accent}66`
      ctx.lineWidth = 1
    }
    roundRect(ctx, x, y, width, height, height / 2)
    ctx.fill()
    if (!solid) ctx.stroke()
    ctx.globalAlpha = 1
    text(ctx, label, x + width / 2, y + height * 0.66, {
      size: fontSize,
      mono: true,
      align: 'center',
      color: solid ? '#04101f' : theme.ink,
    })
    ctx.restore()
    return width
  }

  function sectionHeading(ctx, title, x, y, { accent }) {
    text(ctx, title, x, y, { size: Math.round(H * 0.045), weight: 600, color: theme.ink })
    ctx.fillStyle = accent
    ctx.fillRect(x, y + H * 0.018, H * 0.05, 2)
  }

  function label(ctx, value, x, y, colour = theme.inkFaint) {
    text(ctx, value, x, y, {
      size: Math.round(H * 0.019),
      color: colour,
      mono: true,
      spacing: 1.6,
    })
  }

  /**
   * Wrapped paragraph. Returns the baseline it finished on, so stacked blocks can
   * flow instead of being placed on a guessed pitch — the bug that made long
   * copy overprint the block below it.
   *
   * `maxLines` clamps a block: the last line is ellipsised rather than allowed to
   * push everything under it out of the panel.
   */
  /* --------------------------------------------------------------- copy shaping
     The panes are narrow — the middle one fits about sixteen characters per line,
     the outer two about twenty-four — so a sentence from the DOM card always ends
     in an ellipsis up here. These two helpers show the same words in a shorter
     form: the opening clauses, or the first sentence, cut at a boundary rather
     than mid-phrase. Nothing the site says changes; only what fits on a display
     that is read from across a room. */
  const CLAUSE_SPLIT = /,\s*| — |: /
  function screenForm(value, budget = 46, { min = 6 } = {}) {
    const clauses = String(value).split(CLAUSE_SPLIT)
    let out = clauses[0]
    for (const clause of clauses.slice(1)) {
      if (clause.length < min || out.length + clause.length + 2 > budget) break
      out += `, ${clause}`
    }
    /* A cut that is not shown as a cut is a lie, so the ellipsis is mandatory. */
    if (out.length <= budget) return out
    return `${trimDangling(wholeWords(out, budget))}…`
  }

  /** Never leave a sentence hanging on a dash, comma or space. */
  const trimDangling = (value) => String(value).replace(/[\s\u2014\-–—,;:]+$/u, '')

  /* Glyphs outside Inter's Latin subset fall back to a system font, which means a
     different shape — and different metrics — on every machine. Anything the data
     does not cover with plain letters is drawn instead of typed. */
  function star(ctx, x, y, radius, color) {
    ctx.save()
    ctx.fillStyle = color
    ctx.beginPath()
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? radius : radius * 0.42
      const angle = -Math.PI / 2 + (i * Math.PI) / 5
      const px2 = x + Math.cos(angle) * r
      const py = y + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(px2, py)
      else ctx.lineTo(px2, py)
    }
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  function wholeWords(value, budget) {
    let out = ''
    for (const word of String(value).split(' ')) {
      if (out && out.length + word.length + 1 > budget) break
      out = out ? `${out} ${word}` : word
    }
    return out
  }

  function firstSentence(value, budget = 132) {
    const text = String(value).trim()
    /* Only a real sentence end counts. An em dash introduces an explanation, so
       stopping there would leave the screen reading "…the text overlays —". */
    const stop = text.search(/[.!?](\s|$)/)
    const opening = stop === -1 ? text : text.slice(0, stop + 1)
    return opening.length <= budget ? opening : `${trimDangling(wholeWords(opening, budget))}…`
  }

  function bodyText(
    ctx,
    value,
    x,
    y,
    maxWidth,
    {
      size = 0.024,
      color = theme.inkSoft,
      lineHeight = 1.5,
      mono = false,
      weight = 400,
      maxLines = Infinity,
      spacing = 0,
      /* The chapter rail and footer own the bottom of the panel; body copy stops
         above them by default so no paragraph can ever run under the rail. */
      maxY = H * 0.82,
    } = {}
  ) {
    const fontSize = Math.round(H * size)
    ctx.save()
    ctx.font = `${weight} ${px(fontSize)} ${mono ? theme.fontMono : theme.fontSans}`
    if (spacing) ctx.letterSpacing = px(spacing)
    const words = String(value).split(' ')
    let line = ''
    let cursor = y
    let lines = 1
    const flush = (text) => {
      ctx.fillStyle = color
      ctx.fillText(text, x, cursor)
    }
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width > maxWidth && line) {
        if (lines >= maxLines) {
          flush(truncate(ctx, test, maxWidth, ctx.font))
          ctx.restore()
          return cursor
        }
        flush(line)
        line = word
        lines += 1
        cursor += fontSize * lineHeight
        if (cursor > maxY) {
          ctx.restore()
          return cursor
        }
      } else {
        line = test
      }
    }
    if (line) flush(line)
    ctx.restore()
    return cursor
  }

  /** Largest size from `sizes` that fits `maxWidth`; ellipsised if none do. */
  function fitText(
    ctx,
    value,
    x,
    y,
    maxWidth,
    { sizes, weight = 600, color = theme.ink, mono = false, spacing = 0, wrap = false, lineHeight = 1.06 } = {}
  ) {
    for (const size of sizes) {
      const fontSize = Math.round(H * size)
      const font = `${weight} ${px(fontSize)} ${mono ? theme.fontMono : theme.fontSans}`
      ctx.save()
      ctx.font = font
      const fits = ctx.measureText(value).width <= maxWidth
      ctx.restore()
      if (fits) {
        text(ctx, value, x, y, { size: fontSize, weight, color, mono, spacing })
        return y
      }
    }
    const last = Math.round(H * sizes[sizes.length - 1])
    if (wrap) {
      // Two lines of the smallest size still read better than half a name.
      return bodyText(ctx, value, x, y, maxWidth, {
        size: sizes[sizes.length - 1],
        weight,
        color,
        mono,
        spacing,
        lineHeight,
        maxLines: 2,
      })
    }
    const font = `${weight} ${px(last)} ${mono ? theme.fontMono : theme.fontSans}`
    text(ctx, truncate(ctx, value, maxWidth, font), x, y, { size: last, weight, color, mono, spacing })
    return y
  }

  /**
   * Chips laid out as a flowing row. Measured first and drawn second, so a chip
   * that would overflow the column moves to the next row instead of being painted
   * past the edge and then wrapped.
   */
  /* `bottom` is the rail line: a chip that would land on it is dropped rather
     than drawn over the film's chapter rail. */
  function flowChips(
    ctx,
    items,
    x,
    y,
    maxWidth,
    { accent = theme.accent, size = 0.0155, gap = 0.012, rowGap = 0.048, bottom = H * 0.845 } = {}
  ) {
    let cursorX = x
    let cursorY = y
    for (const item of items) {
      const width = chipWidth(ctx, item, size)
      if (cursorX > x && cursorX + width > x + maxWidth) {
        cursorX = x
        cursorY += H * rowGap
      }
      if (cursorY > bottom) break
      chip(ctx, item, cursorX, cursorY, { accent, size })
      cursorX += width + H * gap
    }
    return cursorY
  }

  /* ---------------- Section painters ---------------- */

  const colX = [
    u(0.028), // column A
    u(COLUMNS.seamA[1] + 0.022), // column B
    u(COLUMNS.seamB[1] + 0.022), // column C
  ]
  const colWidth = [
    u(COLUMNS.seamA[0] - 0.028 - 0.014),
    u(COLUMNS.seamB[0] - COLUMNS.seamA[1] - 0.044),
    u(1 - COLUMNS.seamB[1] - 0.028 - 0.014),
  ]

  function paintBoot(ctx) {
    const accent = theme.accent
    drawBackdrop(ctx, accent)

    const cx = W / 2
    const monogramSize = H * 0.2
    ctx.save()
    ctx.strokeStyle = `${accent}88`
    ctx.lineWidth = 2
    roundRect(ctx, cx - monogramSize / 2, H * 0.24, monogramSize, monogramSize, monogramSize * 0.24)
    ctx.stroke()
    ctx.fillStyle = `${accent}14`
    ctx.fill()
    ctx.restore()

    text(ctx, profile.initials, cx, H * 0.24 + monogramSize * 0.66, {
      size: Math.round(monogramSize * 0.46),
      weight: 600,
      align: 'center',
      color: theme.ink,
    })

    text(ctx, profile.name.toUpperCase(), cx, H * 0.52, {
      size: Math.round(H * 0.036),
      weight: 500,
      align: 'center',
      color: theme.ink,
      spacing: 5,
    })
    text(ctx, profile.role.toUpperCase(), cx, H * 0.565, {
      size: Math.round(H * 0.021),
      align: 'center',
      color: theme.inkFaint,
      mono: true,
      spacing: 3,
    })

    // Progress rail — mirrors the real loading progress
    const barWidth = W * 0.52
    const barY = H * 0.63
    const barH = 3
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(cx - barWidth / 2, barY, barWidth, barH)
    const pct = clamp(sceneState.loaderProgress ?? 1, 0, 1)
    ctx.fillStyle = accent
    ctx.fillRect(cx - barWidth / 2, barY, barWidth * pct, barH)

    text(ctx, `${String(Math.round(pct * 100)).padStart(3, '0')}%`, cx + barWidth / 2 + H * 0.035, barY + barH, {
      size: Math.round(H * 0.022),
      mono: true,
      color: theme.inkSoft,
    })

    const logs = [
      'webgl context ................ ok',
      'cyberpunk_laptop.glb ......... ok',
      'timeline · 10 chapters ....... ready',
    ]
    logs.forEach((line, index) => {
      text(ctx, line, cx, H * 0.72 + index * H * 0.038, {
        size: Math.round(H * 0.019),
        mono: true,
        align: 'center',
        color: theme.inkFaint,
        alpha: 0.5 + index * 0.2,
      })
    })
  }

  function paintHero(ctx, t) {
    const accent = theme.accent
    drawBackdrop(ctx, accent)
    drawChrome(ctx, { accent, breadcrumb: '~/sangam-sitapuri', right: 'portfolio.tsx' })

    // Column A — identity
    let y = H * 0.22
    label(ctx, 'DEVELOPER', colX[0], y)
    y += H * 0.075
    const nameLines = profile.name.split(' ')
    nameLines.forEach((line, index) => {
      text(ctx, line, colX[0], y + index * H * 0.072, {
        size: Math.round(H * 0.062),
        weight: 600,
        color: theme.ink,
      })
    })
    y += nameLines.length * H * 0.072 + H * 0.03
    bodyText(ctx, profile.role, colX[0], y, colWidth[0], { size: 0.028, color: accent, weight: 500 })
    y += H * 0.06
    chip(ctx, profile.status, colX[0], y, { accent: theme.positive, size: 0.017 })
    y += H * 0.08
    text(ctx, profile.location.full, colX[0], y, {
      size: Math.round(H * 0.021),
      color: theme.inkFaint,
      mono: true,
    })

    // Column B — the portfolio expressed as code
    const codeX = colX[1]
    let cy = H * 0.2
    label(ctx, 'WHOAMI', codeX, cy)
    cy += H * 0.055
    const code = [
      ['const ', 'sangam', ' = {'],
      ['  role: ', "'Full-Stack & Android'", ','],
      ['  stack: ', "['React', 'Node', 'Kotlin']", ','],
      ['  three: ', "'WebGL / R3F'", ','],
      ['  now: ', "'ORCA · SIH × ISRO'", ','],
      ['  open to: ', "'internships'", ','],
      ['}'],
    ]
    code.forEach((line, index) => {
      let x = codeX
      const fontSize = Math.round(H * 0.0235)
      const draw = (value, colour, weight = 400) => {
        text(ctx, value, x, cy + index * H * 0.042, { size: fontSize, mono: true, color: colour, weight })
        ctx.save()
        ctx.font = `${weight} ${px(fontSize)} ${theme.fontMono}`
        x += ctx.measureText(value).width
        ctx.restore()
      }
      draw(line[0], theme.violet)
      if (line[1]) draw(line[1], theme.ink)
      if (line[2]) draw(line[2], theme.inkFaint)
    })
    // Blinking caret
    if (Math.floor(t * 1.6) % 2 === 0) {
      ctx.fillStyle = accent
      const caretY = cy + code.length * H * 0.042
      ctx.fillRect(codeX, caretY - H * 0.022, H * 0.012, H * 0.026)
    }

    // Column C — signal + contact
    const cx3 = colX[2]
    let y3 = H * 0.2
    label(ctx, 'SIGNAL', cx3, y3)
    y3 += H * 0.05
    const bars = 26
    const barW = (colWidth[2] / bars) * 0.62
    for (let i = 0; i < bars; i += 1) {
      const phase = t * 1.4 + i * 0.42
      const value = 0.22 + 0.78 * (0.5 + 0.5 * Math.sin(phase)) * (0.55 + 0.45 * Math.sin(i * 0.7))
      const height = clamp(value, 0.08, 1) * H * 0.16
      ctx.fillStyle = i > bars - 7 ? accent : 'rgba(255,255,255,0.16)'
      ctx.fillRect(cx3 + (colWidth[2] / bars) * i, y3 + H * 0.16 - height, barW, height)
    }
    y3 += H * 0.24
    const stats = [
      ['CGPA', '8.52'],
      ['DSA', '200+'],
      ['CERTS', '5'],
    ]
    stats.forEach(([key, value], index) => {
      const rowY = y3 + index * H * 0.072
      text(ctx, key, cx3, rowY, { size: Math.round(H * 0.019), mono: true, color: theme.inkFaint, spacing: 1.4 })
      text(ctx, value, cx3 + colWidth[2], rowY, {
        size: Math.round(H * 0.038),
        weight: 600,
        align: 'right',
        color: theme.ink,
      })
      ctx.fillStyle = 'rgba(255,255,255,0.07)'
      ctx.fillRect(cx3, rowY + H * 0.016, colWidth[2], 1)
    })

    drawFooter(ctx, 'scroll · cinematic timeline', `${projects.length} projects · ${timeline.length} milestones`, accent)
  }

  function paintAbout(ctx) {
    const accent = theme.accent
    drawBackdrop(ctx, accent)
    drawChrome(ctx, { accent, breadcrumb: '~/about.md', right: 'markdown' })

    let y = H * 0.2
    sectionHeading(ctx, 'About', colX[0], y, { accent })
    y += H * 0.085
    y = bodyText(ctx, profile.about.headline, colX[0], y, colWidth[0], { size: 0.03, color: theme.ink, weight: 500 })
    y += H * 0.05
    y = bodyText(ctx, profile.about.intro, colX[0], y, colWidth[0], { size: 0.023, color: theme.inkSoft })
    y += H * 0.09
    label(ctx, 'EDUCATION', colX[0], y)
    y += H * 0.045
    y = bodyText(ctx, profile.education.degree, colX[0], y, colWidth[0], {
      size: 0.023,
      color: theme.ink,
      lineHeight: 1.25,
      maxLines: 2,
    })
    y += H * 0.034
    y = bodyText(ctx, profile.education.institution, colX[0], y, colWidth[0], {
      size: 0.019,
      color: theme.inkFaint,
      mono: true,
      lineHeight: 1.35,
      maxLines: 1,
    })
    y += H * 0.03
    bodyText(ctx, profile.education.years, colX[0], y, colWidth[0], {
      size: 0.019,
      color: theme.inkFaint,
      mono: true,
      maxLines: 1,
    })

    // Column B — the four capability rows
    const bx = colX[1]
    let by = H * 0.2
    label(ctx, 'WHAT I DO', bx, by)
    by += H * 0.055
    let rowY = by
    profile.about.facts.forEach((fact, index) => {
      ctx.fillStyle = `${accent}${index === 0 ? 'ff' : '55'}`
      ctx.fillRect(bx, rowY - H * 0.026, H * 0.006, H * 0.03)
      text(ctx, fact.title, bx + H * 0.026, rowY, { size: Math.round(H * 0.026), weight: 500, color: theme.ink })
      // Each row flows from the measured height of the previous one, and the
      // detail is clamped so four rows always clear the footer.
      const lastLine = bodyText(ctx, screenForm(fact.detail, 34), bx + H * 0.026, rowY + H * 0.03, colWidth[1] - H * 0.03, {
        size: 0.0195,
        color: theme.inkSoft,
        lineHeight: 1.3,
        maxLines: 3,
      })
      rowY = lastLine + H * 0.0195 * 1.3 + H * 0.024
    })

    // Column C — the quiet proof
    const cx3 = colX[2]
    let y3 = H * 0.2
    label(ctx, 'PROOF', cx3, y3)
    y3 += H * 0.1
    text(ctx, profile.education.cgpa, cx3, y3, { size: Math.round(H * 0.1), weight: 600, color: theme.ink })
    text(ctx, 'CGPA · B.TECH CSE', cx3, y3 + H * 0.036, {
      size: Math.round(H * 0.019),
      mono: true,
      color: theme.inkFaint,
      spacing: 1.6,
    })
    y3 += H * 0.145
    profile.about.footer.forEach((line) => {
      y3 = bodyText(ctx, `— ${line}`, cx3, y3, colWidth[2], {
        size: 0.0205,
        color: theme.inkFaint,
        lineHeight: 1.34,
        maxLines: 3,
      })
      y3 += H * 0.026
    })
    drawFooter(ctx, 'available for internships & freelance', 'updated 2026', accent)
  }

  function paintSkills(ctx) {
    const accent = theme.accent
    drawBackdrop(ctx, accent)
    drawChrome(ctx, { accent, breadcrumb: '~/skills.json', right: '4 categories' })

    const paintCategory = (category, x, y, maxWidth) => {
      text(ctx, category.title, x, y, { size: Math.round(H * 0.03), weight: 600, color: theme.ink })
      ctx.fillStyle = `${category.accent}cc`
      ctx.fillRect(x, y + H * 0.014, H * 0.04, 2)
      // The note wraps to two lines on narrow columns, so the item list starts
      // from where it actually ended.
      const noteEnd = bodyText(ctx, category.note, x, y + H * 0.055, maxWidth, {
        size: 0.0175,
        color: theme.inkFaint,
        lineHeight: 1.4,
        maxLines: 3,
      })
      let cy = noteEnd + H * 0.0175 * 1.4 + H * 0.016
      /* Items go through `bodyText`, so a long one wraps instead of running into
         its neighbour, and the list stops above the chapter rail. */
      category.items.forEach((item) => {
        if (cy > H * 0.78) return
        ctx.fillStyle = `${category.accent}bb`
        ctx.fillRect(x, cy - H * 0.019, H * 0.008, H * 0.022)
        const end = bodyText(ctx, item, x + H * 0.028, cy, maxWidth - H * 0.028, {
          size: 0.024,
          color: theme.ink,
          lineHeight: 1.25,
          maxLines: 2,
          maxY: H * 0.8,
        })
        cy = end + H * 0.03
      })
      return cy
    }

    let y = paintCategory(skillCategories[0], colX[0], H * 0.19, colWidth[0])
    paintCategory(skillCategories[1], colX[0], y + H * 0.03, colWidth[0])

    let by = paintCategory(skillCategories[2], colX[1], H * 0.19, colWidth[1])
    paintCategory(skillCategories[3], colX[1], by + H * 0.03, colWidth[1])

    // Column C — a compact distribution view
    const cx3 = colX[2]
    label(ctx, 'BREADTH', cx3, H * 0.19)
    let y3 = H * 0.265
    const distribution = [
      ['Web', 0.92],
      ['Backend', 0.78],
      ['Android', 0.74],
      ['Data', 0.7],
    ]
    distribution.forEach(([name, value], index) => {
      const rowY = y3 + index * H * 0.075
      text(ctx, name, cx3, rowY, { size: Math.round(H * 0.021), color: theme.inkSoft })
      text(ctx, `${Math.round(value * 100)}`, cx3 + colWidth[2], rowY, {
        size: Math.round(H * 0.021),
        mono: true,
        align: 'right',
        color: theme.inkFaint,
      })
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fillRect(cx3, rowY + H * 0.014, colWidth[2], 3)
      ctx.fillStyle = accent
      ctx.fillRect(cx3, rowY + H * 0.014, colWidth[2] * value, 3)
    })

    y3 += H * 0.38
    /* Keep the chip cloud clear of the chapter rail that closes the panel. */
    const alsoTop = Math.min(y3, H * 0.58)
    label(ctx, 'ALSO USING', cx3, alsoTop)
    const also = [...new Set(skillCategories.flatMap((category) => category.also))].slice(0, 5)
    flowChips(ctx, also, cx3, alsoTop + H * 0.042, colWidth[2], {
      accent,
      size: 0.013,
      gap: 0.012,
      rowGap: 0.036,
      bottom: H * 0.815,
    })

    drawFooter(ctx, 'tools · languages · platforms', 'frontend · backend · programming · dev', accent)
  }

  function paintProject(ctx, project, t) {
    const accent = project.screen?.accent || theme.accent
    drawBackdrop(ctx, accent)
    drawChrome(ctx, {
      accent,
      breadcrumb: `~/projects/${project.id}`,
      right: `${project.index} / ${String(projects.length).padStart(2, '0')}`,
    })

    // Column A — the story
    let y = H * 0.2
    text(ctx, project.index, colX[0], y, {
      size: Math.round(H * 0.03),
      mono: true,
      color: `${accent}cc`,
      spacing: 2,
    })
    y += H * 0.075
    /* Long names ("AI Debate Coach") step down a size or two rather than run into
       the next column, and stay on a single line so the column height is stable. */
    y = fitText(ctx, project.name, colX[0], y, colWidth[0], {
      sizes: [0.062, 0.052, 0.045, 0.038],
      weight: 600,
      color: theme.ink,
      spacing: -0.5,
      wrap: true,
    })
    y += H * 0.05
    y = bodyText(ctx, project.subtitle, colX[0], y, colWidth[0], {
      size: 0.021,
      color: accent,
      lineHeight: 1.3,
      maxLines: 2,
    })
    y += H * 0.038
    y = bodyText(ctx, firstSentence(project.summary), colX[0], y, colWidth[0], {
      size: 0.021,
      color: theme.inkSoft,
      lineHeight: 1.5,
      maxLines: 6,
    })
    y += H * 0.055
    label(ctx, 'STACK', colX[0], y)
    y += H * 0.042
    flowChips(ctx, project.tech, colX[0], y, colWidth[0], { accent, size: 0.0155 })

    // Column B — what it does
    const bx = colX[1]
    let by = H * 0.2
    label(ctx, 'HIGHLIGHTS', bx, by)
    by += H * 0.055
    let highlightY = by
    project.highlights.slice(0, 4).forEach((highlight) => {
      ctx.fillStyle = `${accent}88`
      ctx.fillRect(bx, highlightY - H * 0.02, H * 0.014, 1.5)
      const lastLine = bodyText(ctx, highlight, bx + H * 0.03, highlightY, colWidth[1] - H * 0.034, {
        size: 0.0195,
        color: theme.inkSoft,
        lineHeight: 1.4,
        maxLines: 4,
      })
      highlightY = lastLine + H * 0.021 * 1.4 + H * 0.030
    })

    // Column C — a diagram whose shape follows the project's own nature
    const cx3 = colX[2]
    let y3 = H * 0.2
    label(ctx, project.screen?.mode?.toUpperCase() || 'SYSTEM', cx3, y3)
    y3 += H * 0.045
    drawDiagram(ctx, project.screen?.mode, cx3, y3, colWidth[2], H * 0.27, accent, t)

    /* Label on its own line above the figure: side by side, "route verification"
       and "2 km" only just fit at full resolution and collided at lower ones. */
    /* The rail and footer own the bottom of the panel, so the stats block is
       measured against them instead of drifting down from the diagram: three
       rows have to finish above 0.82 of the height at every quality tier. */
    const statRows = (project.stats || []).slice(0, 3)
    const statTop = Math.max(y3 + H * 0.335, H * 0.62)
    const statStep = Math.min(H * 0.112, (H * 0.82 - statTop) / Math.max(statRows.length, 1))
    let sy = statTop
    statRows.forEach((stat, index) => {
      const rowY = sy + index * statStep
      text(ctx, stat.label, cx3, rowY, {
        size: Math.round(H * 0.019),
        mono: true,
        color: theme.inkFaint,
        spacing: 1.2,
        maxWidth: colWidth[2],
      })
      text(ctx, stat.value, cx3, rowY + Math.min(H * 0.052, statStep * 0.62), {
        size: Math.round(Math.min(H * 0.05, statStep * 0.55)),
        weight: 600,
        color: theme.ink,
        maxWidth: colWidth[2],
      })
      ctx.fillStyle = 'rgba(255,255,255,0.07)'
      ctx.fillRect(cx3, rowY + H * 0.016, colWidth[2], 1)
    })

    if (project.links?.live) {
      /* Beside the diagram's own label rather than at a fixed height, where it
         used to land on the last statistic. */
      ctx.font = `400 ${px(Math.round(H * 0.019))} ${theme.fontMono}`
      const labelWidth = ctx.measureText(project.screen?.mode?.toUpperCase() || 'SYSTEM').width
      chip(ctx, 'LIVE', cx3 + labelWidth + H * 0.045, H * 0.2, {
        accent: theme.positive,
        size: 0.016,
        solid: true,
      })
    }

    drawFooter(ctx, screenForm(project.tagline, 52), project.year, accent)
  }

  /** A small, honest diagram of how each project is put together. */
  function drawDiagram(ctx, mode, x, y, width, height, accent, t) {
    ctx.save()
    ctx.strokeStyle = `${accent}77`
    ctx.fillStyle = `${accent}18`
    ctx.lineWidth = 1.4

    const box = (bx, by, bw, bh, filled = true) => {
      roundRect(ctx, bx, by, bw, bh, 4)
      if (filled) ctx.fill()
      ctx.stroke()
    }

    if (mode === 'map') {
      // Coastline grid with a verified route
      for (let i = 0; i < 5; i += 1) {
        ctx.globalAlpha = 0.35
        ctx.beginPath()
        ctx.moveTo(x, y + (height / 5) * i + 6)
        ctx.lineTo(x + width, y + (height / 5) * i + 6)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      box(x + width * 0.12, y + height * 0.18, width * 0.3, height * 0.34)
      const route = [
        [0.74, 0.16],
        [0.6, 0.34],
        [0.68, 0.55],
        [0.42, 0.72],
        [0.3, 0.9],
      ]
      ctx.strokeStyle = theme.positive
      ctx.lineWidth = 2
      ctx.beginPath()
      route.forEach(([rx, ry], index) => {
        const px2 = x + width * rx
        const py2 = y + height * ry
        if (index === 0) ctx.moveTo(px2, py2)
        else ctx.lineTo(px2, py2)
      })
      ctx.stroke()
      ctx.fillStyle = theme.positive
      route.forEach(([rx, ry]) => {
        ctx.beginPath()
        ctx.arc(x + width * rx, y + height * ry, 2.6, 0, Math.PI * 2)
        ctx.fill()
      })
    } else if (mode === 'terminal') {
      // Server + clients
      box(x + width * 0.3, y + height * 0.12, width * 0.4, height * 0.24)
      text(ctx, 'SERVER', x + width * 0.5, y + height * 0.27, {
        size: Math.round(H * 0.016),
        mono: true,
        align: 'center',
        color: accent,
        spacing: 1.4,
      })
      const clients = 4
      for (let i = 0; i < clients; i += 1) {
        const cxp = x + (width / clients) * i + width / clients / 2
        box(cxp - width * 0.055, y + height * 0.72, width * 0.11, height * 0.16)
        ctx.beginPath()
        ctx.strokeStyle = `${accent}66`
        ctx.moveTo(x + width * 0.5, y + height * 0.36)
        ctx.lineTo(cxp, y + height * 0.72)
        ctx.stroke()
      }
    } else if (mode === 'arena') {
      // Two sides facing off
      box(x + width * 0.06, y + height * 0.3, width * 0.34, height * 0.3)
      box(x + width * 0.6, y + height * 0.3, width * 0.34, height * 0.3)
      text(ctx, 'YOU', x + width * 0.23, y + height * 0.48, {
        size: Math.round(H * 0.016), mono: true, align: 'center', color: theme.ink,
      })
      text(ctx, 'AI', x + width * 0.77, y + height * 0.48, {
        size: Math.round(H * 0.016), mono: true, align: 'center', color: accent,
      })
      for (let i = 0; i < 4; i += 1) {
        const ly = y + height * (0.36 + i * 0.06)
        ctx.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2 + i))
        ctx.beginPath()
        ctx.strokeStyle = accent
        ctx.moveTo(x + width * 0.4, ly)
        ctx.lineTo(x + width * 0.6, ly)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    } else if (mode === 'mobile') {
      // A phone frame with a feed
      roundRect(ctx, x + width * 0.3, y + height * 0.04, width * 0.4, height * 0.92, 10)
      ctx.strokeStyle = `${accent}99`
      ctx.stroke()
      for (let i = 0; i < 4; i += 1) {
        ctx.fillStyle = i === 0 ? `${accent}55` : 'rgba(255,255,255,0.08)'
        roundRect(ctx, x + width * 0.35, y + height * (0.12 + i * 0.2), width * 0.3, height * 0.13, 4)
        ctx.fill()
      }
    } else {
      // editor / default — a component tree
      const rows = [
        [0.0, 0.6],
        [0.1, 0.5],
        [0.1, 0.5],
        [0.2, 0.4],
      ]
      rows.forEach(([inset, w2], index) => {
        const by = y + height * (0.1 + index * 0.22)
        ctx.globalAlpha = 1 - index * 0.16
        box(x + width * inset, by, width * w2, height * 0.14)
      })
      ctx.globalAlpha = 1
    }

    ctx.restore()
  }

  function paintContact(ctx, t) {
    const accent = theme.accent
    drawBackdrop(ctx, accent)
    drawChrome(ctx, { accent, breadcrumb: '~/contact', right: 'end of film' })

    let y = H * 0.24
    label(ctx, 'THE END', colX[0], y)
    y += H * 0.075
    y = bodyText(ctx, profile.closing.title, colX[0], y, colWidth[0], {
      size: 0.052,
      color: theme.ink,
      weight: 600,
      lineHeight: 1.18,
    })
    y += H * 0.06
    bodyText(ctx, profile.closing.subtitle, colX[0], y, colWidth[0], {
      size: 0.0215,
      color: theme.inkSoft,
      lineHeight: 1.5,
    })

    const rows = [
      ['EMAIL', profile.contact.email],
      ['GITHUB', profile.contact.githubHandle],
      ['LINKEDIN', profile.contact.linkedinHandle],
      ['RÉSUMÉ', 'SangamCV.pdf'],
    ]
    rows.forEach(([key, value], index) => {
      const rowY = H * 0.26 + index * H * 0.1
      text(ctx, key, colX[1], rowY, {
        size: Math.round(H * 0.0185),
        mono: true,
        color: theme.inkFaint,
        spacing: 1.6,
      })
      fitText(ctx, value, colX[1], rowY + H * 0.037, colWidth[1], {
        sizes: [0.0245, 0.021, 0.019, 0.017, 0.0155, 0.014, 0.013],
        weight: 400,
        color: theme.ink,
      })
      ctx.fillStyle = 'rgba(255,255,255,0.07)'
      ctx.fillRect(colX[1], rowY + H * 0.055, colWidth[1], 1)
    })

    /* Column C — availability, then the numbers it is worth ending on. The
       chapter list that used to live here is now the film rail below every
       screen, so this space recaps the numbers instead. */
    const cx3 = colX[2]
    let y3 = H * 0.24
    const pulse = 0.6 + 0.4 * Math.sin(t * 2.2)
    ctx.beginPath()
    ctx.fillStyle = theme.positive
    ctx.globalAlpha = pulse
    ctx.arc(cx3 + 5, y3 - 6, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    y3 = bodyText(ctx, profile.status, cx3 + H * 0.035, y3, colWidth[2] - H * 0.035, {
      size: 0.023,
      color: theme.ink,
      lineHeight: 1.25,
      maxLines: 2,
    })

    y3 += H * 0.075
    label(ctx, 'BY THE NUMBERS', cx3, y3)
    y3 += H * 0.05
    profile.facts.forEach((fact) => {
      const value = String(fact.value).replace(/★/g, '').trim()
      const figureSize = Math.round(H * 0.04)
      text(ctx, value, cx3, y3, {
        size: Math.round(H * 0.04),
        weight: 600,
        color: accent,
        maxWidth: colWidth[2],
      })
      if (/★/.test(String(fact.value))) {
        ctx.font = `600 ${px(figureSize)} ${theme.fontSans}`
        const stars = (String(fact.value).match(/★/g) || []).length
        let starX = cx3 + ctx.measureText(value).width + figureSize * 0.2
        for (let i = 0; i < stars; i += 1) {
          star(ctx, starX + figureSize * 0.3, y3 - figureSize * 0.3, figureSize * 0.26, accent)
          starX += figureSize * 0.6
        }
      }
      const labelEnd = bodyText(ctx, fact.label, cx3, y3 + H * 0.024, colWidth[2], {
        size: 0.0195,
        color: theme.inkSoft,
        lineHeight: 1.3,
        maxLines: 2,
      })
      y3 = labelEnd + H * 0.0195 * 1.3 + H * 0.036
    })

    drawFooter(ctx, 'thanks for scrolling', `updated ${new Date().getFullYear()}`, accent)
  }

  /* ---------------- Scenes 03, 06, 07, 10 ---------------- */

  /**
   * Scene 03 — the machine is being taken apart. The display shows an
   * assembly manifest: which part is where, and how far out it has travelled.
   * It is a manifest of the meshes that actually exist in the model, so the
   * screen never describes hardware the file does not contain.
   */
  function paintBreakdown(ctx) {
    const accent = theme.accent
    drawBackdrop(ctx, accent)
    drawChrome(ctx, { accent, breadcrumb: '~/system/disassemble', right: 'teardown' })

    let y = H * 0.2
    sectionHeading(ctx, 'Breakdown', colX[0], y, { accent })
    y += H * 0.09
    y = bodyText(ctx, 'Every component has a purpose. Each one is moving along a fixed trajectory, and every trajectory is reversible.', colX[0], y, colWidth[0], {
      size: 0.0215,
      color: theme.inkSoft,
    })
    y += H * 0.07
    label(ctx, 'MANIFEST', colX[0], y)
    y += H * 0.045

    const partsList = [
      ['01', 'Lid assembly', 'lifted + rotated'],
      ['02', 'Display panes', 'out of the bezel'],
      ['03', 'Keyboard', 'raised off the deck'],
      ['04', 'Deck plate', 'floating clear'],
      ['05', 'Chassis shell', 'stationary datum'],
      ['06', 'Bottom plate', 'lowered'],
      ['07', 'Accent strip', 'released sideways'],
    ]
    const manifestStep = Math.min(H * 0.058, Math.max(H * 0.044, (H * 0.78 - y) / partsList.length))
    partsList.forEach(([index, name, state], row) => {
      const rowY = y + row * manifestStep
      text(ctx, index, colX[0], rowY, { size: Math.round(H * 0.019), mono: true, color: theme.inkFaint, spacing: 1 })
      text(ctx, name, colX[0] + H * 0.055, rowY, {
        size: Math.round(H * 0.0235),
        color: row === 4 ? accent : theme.ink,
        weight: row === 4 ? 500 : 400,
        maxWidth: colWidth[0] - H * 0.055,
      })
      text(ctx, state, colX[0] + H * 0.055, rowY + H * 0.026, {
        size: Math.round(H * 0.017),
        mono: true,
        color: theme.inkFaint,
      })
    })

    /* Column B — a small exploded diagram, drawn from the same order. */
    const bx = colX[1] + colWidth[1] * 0.5
    const top = H * 0.26
    label(ctx, 'TRAJECTORY', colX[1], H * 0.2)
    const rows = [
      { y: 0.0, w: 0.62, label: 'lid' },
      { y: 0.17, w: 0.58, label: 'display' },
      { y: 0.38, w: 0.86, label: 'keyboard' },
      { y: 0.55, w: 0.92, label: 'deck' },
      { y: 0.72, w: 0.96, label: 'chassis' },
      { y: 0.89, w: 0.9, label: 'bottom' },
    ]
    const diagramW = colWidth[1] * 0.92
    rows.forEach((row, index) => {
      const rowY = top + row.y * H * 0.56
      const w = diagramW * row.w
      const x = bx - w / 2
      ctx.fillStyle = index === 4 ? `${accent}33` : 'rgba(255,255,255,0.05)'
      ctx.fillRect(x, rowY, w, H * 0.035)
      ctx.strokeStyle = index === 4 ? accent : 'rgba(255,255,255,0.16)'
      ctx.lineWidth = 1
      ctx.strokeRect(x + 0.5, rowY + 0.5, w - 1, H * 0.034)
      text(ctx, row.label, x + H * 0.014, rowY + H * 0.024, {
        size: Math.round(H * 0.016),
        mono: true,
        color: index === 4 ? accent : theme.inkFaint,
      })
    })
    // Vertical guide lines between the layers
    ctx.strokeStyle = 'rgba(53,231,255,0.28)'
    ctx.setLineDash([3, 4])
    ;[0.22, 0.78].forEach((fraction) => {
      const x = bx - diagramW / 2 + diagramW * fraction
      ctx.beginPath()
      ctx.moveTo(x, top + H * 0.04)
      ctx.lineTo(x, top + H * 0.53)
      ctx.stroke()
    })
    ctx.setLineDash([])

    /* Column C — what the operation is for. */
    const cx3 = colX[2]
    let y3 = H * 0.2
    label(ctx, 'WHY', cx3, y3)
    y3 += H * 0.06
    const notes = [
      'A system is only as strong as the parts you understand.',
      'Read the machine before you trust it.',
      'Scroll back and it rebuilds itself.',
    ]
    notes.forEach((note, index) => {
      ctx.fillStyle = `${accent}${index === 0 ? 'ff' : '44'}`
      ctx.fillRect(cx3, y3 - H * 0.024, H * 0.006, H * 0.028)
      y3 = bodyText(ctx, note, cx3 + H * 0.026, y3, colWidth[2] - H * 0.03, {
        size: 0.021,
        color: theme.inkSoft,
        lineHeight: 1.4,
        maxLines: 4,
      })
      y3 += H * 0.075
    })

    y3 += H * 0.02
    label(ctx, 'PARTS IN THE FILE', cx3, y3)
    y3 += H * 0.045
    text(ctx, '37 meshes · 2 groups', cx3, y3, {
      size: Math.round(H * 0.021),
      mono: true,
      color: theme.ink,
    })

    drawFooter(ctx, 'disassembly in progress', 'reversible · deterministic', accent)
  }

  /** Scene 06 — the flagship project, laid out as a case study. */
  function paintDeepDive(ctx, project) {
    const accent = project.screen?.accent || theme.accent
    drawBackdrop(ctx, accent)
    drawChrome(ctx, {
      accent,
      breadcrumb: `~/projects/${project.id}/deep-dive`,
      right: 'case study',
    })

    let y = H * 0.2
    label(ctx, 'FLAGSHIP', colX[0], y)
    y += H * 0.06
    y = bodyText(ctx, project.name, colX[0], y, colWidth[0], {
      size: 0.052,
      weight: 600,
      color: theme.ink,
      lineHeight: 1.1,
      maxLines: 2,
    })
    y += H * 0.04
    y = bodyText(ctx, project.subtitle, colX[0], y, colWidth[0], {
      size: 0.021,
      color: accent,
      weight: 500,
      maxLines: 2,
    })
    y += H * 0.05
    y = bodyText(ctx, project.tagline, colX[0], y, colWidth[0], {
      size: 0.0215,
      color: theme.inkSoft,
      lineHeight: 1.45,
      maxLines: 5,
    })
    y += H * 0.06
    label(ctx, 'STACK', colX[0], y)
    y += H * 0.045
    flowChips(ctx, project.tech, colX[0], y, colWidth[0], { accent, size: 0.0145, gap: 0.012, bottom: H * 0.8 })

    /* Column B — problem, approach, outcome. */
    const bx = colX[1]
    let by = H * 0.2
    label(ctx, 'PROBLEM · APPROACH', bx, by)
    by += H * 0.055
    by = bodyText(ctx, project.subtitle, bx, by, colWidth[1], {
      size: 0.0215,
      color: theme.ink,
      weight: 500,
      lineHeight: 1.35,
      maxLines: 2,
    })
    by += H * 0.05
    /* Every line is the project's own copy — the same fields the DOM case study
       reads. Nothing here is written for the panel. */
    const rows = [
      ['Problem', screenForm(project.tagline, 96)],
      ['Approach', firstSentence(project.summary, 104)],
      ['Implementation', screenForm(project.highlights[0], 104)],
      ['Outcome', screenForm(project.outcome, 104)],
    ]
    rows.forEach(([labelText, body]) => {
      by += H * 0.012
      text(ctx, labelText, bx, by, { size: Math.round(H * 0.018), mono: true, color: accent, spacing: 1.2 })
      by += H * 0.028
      by = bodyText(ctx, body, bx, by, colWidth[1], {
        size: 0.0185,
        color: theme.inkSoft,
        lineHeight: 1.3,
        maxLines: 4,
      })
      by += H * 0.02
    })

    /* Column C — the project's real figures and the role. No invented scores: if a
       number is not in the data, it is not on the panel. */
    const cx3 = colX[2]
    let y3 = H * 0.2
    label(ctx, 'AT A GLANCE', cx3, y3)
    y3 += H * 0.06
    ;(project.stats || []).slice(0, 3).forEach((stat, index) => {
      const rowY = y3 + index * H * 0.085
      text(ctx, stat.value, cx3, rowY, { size: Math.round(H * 0.036), weight: 600, color: theme.ink })
      text(ctx, stat.label, cx3, rowY + H * 0.032, {
        size: Math.round(H * 0.0175),
        mono: true,
        color: theme.inkFaint,
        spacing: 1,
      })
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fillRect(cx3, rowY + H * 0.05, colWidth[2], 1)
    })
    y3 += H * 0.30
    label(ctx, 'ROLE', cx3, y3)
    y3 += H * 0.04
    bodyText(ctx, project.role, cx3, y3, colWidth[2], {
      size: 0.0205,
      color: theme.ink,
      lineHeight: 1.35,
      maxLines: 3,
    })

    drawFooter(ctx, 'problem · approach · implementation', 'outcome · links', accent)
  }

  /** Scene 07 — the machine is going back together. */
  function paintRebuild(ctx) {
    const accent = theme.accent
    drawBackdrop(ctx, accent)
    drawChrome(ctx, { accent, breadcrumb: '~/system/reassemble', right: 'rebuild' })

    let y = H * 0.2
    sectionHeading(ctx, 'Reassembly', colX[0], y, { accent })
    y += H * 0.09
    y = bodyText(ctx, 'The same trajectories, played backwards. Every component returns to the position it held before the machine was opened.', colX[0], y, colWidth[0], {
      size: 0.0215,
      color: theme.inkSoft,
    })
    y += H * 0.08
    label(ctx, 'SEQUENCE', colX[0], y)
    y += H * 0.05
    const steps = [
      ['01', 'Hardware returns'],
      ['02', 'Bottom plate seats'],
      ['03', 'Deck plate drops in'],
      ['04', 'Keyboard locks'],
      ['05', 'Display seats in the bezel'],
      ['06', 'Lid swings closed'],
    ]
    const sequenceStep = Math.min(H * 0.058, Math.max(H * 0.044, (H * 0.78 - y) / steps.length))
    steps.forEach(([index, name], row) => {
      const rowY = y + row * sequenceStep
      text(ctx, index, colX[0], rowY, { size: Math.round(H * 0.019), mono: true, color: theme.inkFaint, spacing: 1 })
      ctx.fillStyle = `${accent}${row === steps.length - 1 ? 'ff' : '44'}`
      ctx.fillRect(colX[0] + H * 0.036, rowY - H * 0.008, H * 0.008, H * 0.008)
      text(ctx, name, colX[0] + H * 0.055, rowY, {
        size: Math.round(H * 0.0235),
        color: theme.ink,
        maxWidth: colWidth[0] - H * 0.06,
      })
    })

    /* Column B — a progress ladder that fills as the assembly completes. */
    const bx = colX[1]
    let by = H * 0.2
    label(ctx, 'ASSEMBLY', bx, by)
    by += H * 0.06
    for (let i = 0; i < 8; i += 1) {
      const rowY = by + i * H * 0.062
      const filled = 8 - i
      ctx.fillStyle = filled > 5 ? `${accent}55` : 'rgba(255,255,255,0.05)'
      ctx.fillRect(bx, rowY, (colWidth[1] * filled) / 8, H * 0.034)
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 1
      ctx.strokeRect(bx + 0.5, rowY + 0.5, colWidth[1] - 1, H * 0.033)
    }
    by += H * 0.55
    bodyText(ctx, 'One scalar drives all of it. There is no second animation to keep in sync.', bx, by, colWidth[1], {
      size: 0.0195,
      color: theme.inkFaint,
      lineHeight: 1.35,
      maxLines: 4,
    })

    /* Column C — the startup sequence. */
    const cx3 = colX[2]
    let y3 = H * 0.2
    label(ctx, 'BOOT', cx3, y3)
    y3 += H * 0.06
    const logs = [
      'display ................. seated',
      'hinge ................... locked',
      'chassis ................. closed',
      'backlight ............... on',
      'system .................. ready',
    ]
    logs.forEach((line, index) => {
      text(ctx, line, cx3, y3 + index * H * 0.05, {
        size: Math.round(H * 0.0185),
        mono: true,
        color: index === logs.length - 1 ? accent : theme.inkFaint,
        alpha: 0.6 + index * 0.1,
      })
    })
    y3 += H * 0.32
    text(ctx, 'NO MISSING PARTS', cx3, y3, {
      size: Math.round(H * 0.019),
      mono: true,
      color: theme.positive,
      spacing: 1.6,
    })

    drawFooter(ctx, 'reassembly in progress', 'same trajectories, reversed', accent)
  }

  /** Scene 10 — the quiet end. Almost nothing on the display. */
  function paintAfterglow(ctx) {
    const accent = theme.accent
    drawBackdrop(ctx, accent)
    drawChrome(ctx, { accent, breadcrumb: '~', right: 'standby' })

    const cx = W / 2
    text(ctx, profile.initials, cx, H * 0.36, {
      size: Math.round(H * 0.11),
      weight: 600,
      align: 'center',
      color: theme.ink,
      spacing: 6,
    })
    text(ctx, 'THE NEXT BUILD STARTS HERE', cx, H * 0.45, {
      size: Math.round(H * 0.024),
      mono: true,
      align: 'center',
      color: accent,
      spacing: 3,
    })
    text(ctx, `${profile.name} · ${profile.role}`, cx, H * 0.52, {
      size: Math.round(H * 0.021),
      align: 'center',
      color: theme.inkSoft,
    })
    text(ctx, profile.contact.email, cx, H * 0.56, {
      size: Math.round(H * 0.021),
      mono: true,
      align: 'center',
      color: theme.inkFaint,
    })

    /* An idle waveform, barely moving. */
    const bars = 44
    const barW = (W * 0.5) / bars
    for (let i = 0; i < bars; i += 1) {
      const value = 0.5 + 0.5 * Math.sin(i * 0.55)
      const h = value * H * 0.05
      ctx.fillStyle = i % 11 === 0 ? accent : 'rgba(255,255,255,0.12)'
      ctx.fillRect(cx - (W * 0.25) + i * barW, H * 0.66 - h / 2, barW * 0.5, h)
    }

    drawFooter(ctx, 'standby', 'scroll up to replay', accent)
  }

  /* ---------------- Status panel ---------------- */

  function paintStatus(ctx, key) {
    const accent = theme.accent
    const w = statusWidth
    const h = statusHeight
    ctx.fillStyle = theme.backgroundAlt
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    const grid = Math.round(w / 8)
    for (let x = 0; x <= w; x += grid) {
      ctx.beginPath()
      ctx.moveTo(x + 0.5, 0)
      ctx.lineTo(x + 0.5, h)
      ctx.stroke()
    }

    const scale = w / 512
    const label = (value, x, y, opts = {}) =>
      text(ctx, value, x, y, { size: Math.round(20 * scale), mono: true, color: theme.inkFaint, spacing: 1.4, ...opts })

    label('SYSTEM', w * 0.1, h * 0.075)
    label(key ? key.toUpperCase() : 'IDLE', w * 0.1, h * 0.13, { color: theme.ink, size: Math.round(26 * scale) })

    // Circular progress gauge
    const cx = w / 2
    const cy = h * 0.46
    const radius = Math.min(w, h) * 0.3
    ctx.lineWidth = Math.max(3, 5 * scale)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = accent
    ctx.beginPath()
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(readProgress(), 0, 1))
    ctx.stroke()
    text(ctx, `${Math.round(clamp(readProgress(), 0, 1) * 100)}%`, cx, cy + 10 * scale, {
      size: Math.round(52 * scale),
      weight: 600,
      align: 'center',
      color: theme.ink,
    })
    label('FILM PROGRESS', cx, cy + radius + 34 * scale, { align: 'center' })

    const rows = [
      ['SCENES', '7'],
      ['PROJECTS', String(projects.length)],
      ['STACK', 'R3F'],
    ]
    rows.forEach(([k, v], index) => {
      const rowY = h * 0.8 + index * h * 0.058
      label(k, w * 0.1, rowY)
      text(ctx, v, w * 0.9, rowY, {
        size: Math.round(20 * scale),
        mono: true,
        align: 'right',
        color: theme.ink,
      })
    })
  }

  /* ---------------- Dispatch ---------------- */

  const PAINTERS = {
    awakening: (ctx) => paintBoot(ctx),
    engine: (ctx) => paintHero(ctx, 0),
    breakdown: (ctx) => paintBreakdown(ctx),
    core: (ctx) => paintSkills(ctx),
    'deep-dive': (ctx) => paintDeepDive(ctx, deepDiveProject),
    rebuild: (ctx) => paintRebuild(ctx),
    beyond: (ctx) => paintAbout(ctx),
    transmission: (ctx) => paintContact(ctx, 0),
    afterglow: (ctx) => paintAfterglow(ctx),
  }

  function paintMain(key, t) {
    const ctx = mainCtx
    ctx.save()
    if (key === 'boot') paintBoot(ctx)
    else if (key.startsWith('projects:')) {
      const index = Number(key.split(':')[1])
      paintProject(ctx, projects[index] || projects[0], t)
    } else if (PAINTERS[key]) PAINTERS[key](ctx)
    else paintHero(ctx, t)
    ctx.restore()
  }

  /** A single thin scan line travels down the display — the only global motion. */
  function paintScanLine(ctx, t) {
    const y = ((t * 0.06) % 1) * H
    const gradient = ctx.createLinearGradient(0, y - H * 0.05, 0, y + H * 0.05)
    gradient.addColorStop(0, 'rgba(255,255,255,0)')
    gradient.addColorStop(0.5, 'rgba(180,210,255,0.045)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, y - H * 0.05, W, H * 0.1)
  }

  /* ---------------- Public API ---------------- */

  /**
   * Set (or refresh) the interface shown on the display.
   * @param {string} key 'boot' | 'hero' | … | 'projects:2'
   * @param {boolean} [force] repaint even if the key is unchanged
   */
  function setScreen(key, force = false) {
    if (!force && key === currentKey) return false
    currentKey = key
    paintMain(key, 0)
    mainTexture.needsUpdate = true
    return true
  }

  function update(time) {
    if (!currentKey) return
    if (!quality?.screenAnimation) return

    animationAccumulator += 1
    // The caller passes a monotonically increasing clock; the interval gate keeps
    // repaints at ~7 fps so the texture upload stays cheap.
    if (animationAccumulator < 1) return
    animationAccumulator = 0

    const seconds = time
    paintMain(currentKey, seconds)
    paintScanLine(mainCtx, seconds)
    mainTexture.needsUpdate = true
  }

  function updateStatus(key, time) {
    if (!quality?.statusPanel) return
    if (key === statusKey && !quality.screenAnimation) return
    statusKey = key
    paintStatus(statusCtx, key)
    statusTexture.needsUpdate = true
    if (quality.screenAnimation) {
      // Cheap animated flourish: the outer ring only.
      const w = statusWidth
      const h = statusHeight
      const cx = w / 2
      const cy = h * 0.46
      const radius = Math.min(w, h) * 0.3
      statusCtx.strokeStyle = 'rgba(255,255,255,0.06)'
      statusCtx.lineWidth = 1
      statusCtx.beginPath()
      statusCtx.arc(cx, cy, radius + 8, time % (Math.PI * 2), (time % (Math.PI * 2)) + 1.1)
      statusCtx.stroke()
      statusTexture.needsUpdate = true
    }
  }

  function dispose() {
    stopProjectWatch()
    mainTexture.dispose()
    statusTexture.dispose()
    mainCanvas.width = 0
    mainCanvas.height = 0
    statusCanvas.width = 0
    statusCanvas.height = 0
  }

  return {
    mainTexture,
    statusTexture,
    setScreen,
    update,
    updateStatus,
    dispose,
    get currentKey() {
      return currentKey
    },
    /** Exposed for the DOM fallback: a PNG of the current screen. */
    toDataUrl: () => mainCanvas.toDataURL('image/png'),
  }
}

export default createScreenTextures
