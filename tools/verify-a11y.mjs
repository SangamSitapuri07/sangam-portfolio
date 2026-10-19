/**
 * Accessibility verification (development tool, not shipped).
 *
 * The visual layer is dark-on-dark by design, which is exactly the combination
 * that fails contrast quietly: the palette looks deliberate on a good monitor and
 * is unreadable on a bad one, in sunlight, or for a reader with low vision. The
 * colours that are only ever used for light (violet, the glows) must not be held
 * to a text standard, and the text colours must not be given the benefit of the
 * doubt.
 *
 * So this script parses the real tokens out of `src/index.css`, computes WCAG
 * contrast ratios against the surfaces each colour is actually painted on, and
 * asserts the pairings used for text. It then checks the source-level rules that
 * are easy to regress and impossible to see: skipped heading levels, positive
 * tabindex, images without alternative text, and a document without a language.
 *
 *   node tools/verify-a11y.mjs
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const failures = []
const check = (label, condition, detail = '') => {
  const ok = Boolean(condition)
  console.log(`${ok ? '  ✓' : '  ✗'} ${label}${detail ? `  ${detail}` : ''}`)
  if (!ok) failures.push(label)
}

/* ---------------------------------------------------------------- contrast */

const hexToRgb = (hex) => {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
}

/** Relative luminance, WCAG 2.1. */
const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const css = await readFile(path.join(root, 'src/index.css'), 'utf8')
const tokens = {}
for (const match of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
  tokens[match[1]] = match[2]
}

console.log('\n▸ palette contrast (WCAG 2.1, computed from src/index.css)')

check(
  'the palette declares its tokens',
  ['void', 'surface', 'ink', 'ink-faint', 'accent'].every((name) => tokens[name]),
  `(${Object.keys(tokens).length} colours)`
)

/* The surfaces text is actually painted on, worst first: a card sits on
   surface-2, the page on void. Each pairing is asserted against the surface that
   makes it hardest to read. */
const pairings = [
  ['ink', 'void', 4.5, 'body copy on the page'],
  ['ink', 'surface-2', 4.5, 'body copy on a card'],
  ['ink-soft', 'void', 4.5, 'supporting copy on the page'],
  ['ink-soft', 'surface-2', 4.5, 'supporting copy on a card'],
  ['ink-faint', 'void', 3, 'labels and metadata (large or non-essential only)'],
  ['accent', 'void', 4.5, 'accent links and eyebrows'],
  ['accent-bright', 'void', 4.5, 'accent on hover'],
  ['accent', 'surface-2', 4.5, 'accent inside a card'],
]

for (const [ink, surface, minimum, what] of pairings) {
  const ratio = contrast(tokens[ink], tokens[surface])
  check(
    `${what}: ${ink} on ${surface} ≥ ${minimum}:1`,
    ratio >= minimum,
    `(${ratio.toFixed(2)}:1)`
  )
}

/* Colours that are light, not text. They must be visible, and they are exempt
   from the text standard — this asserts the exemption is earned by being bright
   rather than asserted. */
for (const [name, surface] of [
  ['violet', 'void'],
  ['violet-soft', 'void'],
]) {
  const ratio = contrast(tokens[name], tokens[surface])
  check(`${name} is light enough to read as light on ${surface}`, ratio >= 3, `(${ratio.toFixed(2)}:1)`)
}

/* ------------------------------------------------------- source-level rules */

console.log('\n▸ document and markup rules')

const html = await readFile(path.join(root, 'index.html'), 'utf8')
check('the document declares a language', /<html[^>]+lang="[a-z]{2}/i.test(html))

const sources = {}
const readDir = async (dir) => {
  const { readdir } = await import('node:fs/promises')
  for (const entry of await readdir(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`
    if (entry.isDirectory()) await readDir(rel)
    else if (/\.(jsx|js)$/.test(entry.name)) sources[rel] = await readFile(path.join(root, rel), 'utf8')
  }
}
await readDir('src/components')
await readDir('src/sections')
await readDir('src/components/ui')

/* Heading levels must not skip: h1 → h3 reads as a missing section to a screen
   reader, which is how structural errors are perceived there. */
const headingsUsed = new Set()
for (const source of Object.values(sources)) {
  for (const match of source.matchAll(/<h([1-6])[\s>]/g)) headingsUsed.add(Number(match[1]))
}
const levels = [...headingsUsed].sort()
const missingBetween = []
for (let level = levels[0]; level < levels[levels.length - 1]; level += 1) {
  if (!levels.includes(level)) missingBetween.push(level)
}
check(
  'heading levels are used without gaps',
  missingBetween.length === 0,
  `(h${levels.join(', h')}${missingBetween.length ? ` — nothing uses h${missingBetween.join(', h')}` : ''})`
)

/* Positive tabindex fights the document order and is almost always a mistake. */
const positiveTabindex = Object.entries(sources)
  .filter(([, source]) => /tabIndex=\{?["'{]?\s*[1-9]/.test(source))
  .map(([file]) => file)
check('no positive tabindex anywhere', positiveTabindex.length === 0, positiveTabindex.join(', '))

/* Every image needs alternative text. Reported with its count, because a check
   over zero elements is not a pass — it is a check that measured nothing. */
const imageTags = Object.values(sources).flatMap((source) => [...source.matchAll(/<img\b[^>]*>/g)])
const imagesWithoutAlt = imageTags.filter((match) => !/\balt=/.test(match[0]))
if (imageTags.length === 0) {
  console.log('  – every image carries alt text  (skipped: the app renders no <img> elements)')
} else {
  check(
    'every image carries alt text',
    imagesWithoutAlt.length === 0,
    `(${imageTags.length} images)`
  )
}

/* ------------------------------------------------- text actually in the markup
 * Checking the raw tokens is not enough: Tailwind's `/70` suffix composites the
 * colour with the background, which darkens it, and a dark-on-dark palette has
 * little headroom to give away. So scan the utilities the components really use,
 * composite the alpha, and hold each one to the standard for text.
 */
const alphaComposite = (hex, alpha, background) => {
  const fg = hexToRgb(hex)
  const bg = hexToRgb(background)
  const mix = fg.map((channel, i) => channel * alpha + bg[i] * (1 - alpha))
  return (
    '#' +
    mix
      .map((channel) => Math.round(channel * 255).toString(16).padStart(2, '0'))
      .join('')
  )
}

const used = new Map()
for (const [file, source] of Object.entries(sources)) {
  /* Greedy: `text-ink-faint/70` is one token with an alpha, and a lazy capture
     silently reads it as `ink` — which is how this check first under-reported. */
  for (const match of source.matchAll(/\btext-([a-z0-9-]+)(?:\/(\d{1,3}))?/g)) {
    const [, name, alphaText] = match
    if (!tokens[name]) continue
    const alpha = alphaText ? Number(alphaText) / 100 : 1
    const key = `${name}${alphaText ? `/${alphaText}` : ''}`
    if (!used.has(key)) used.set(key, { name, alpha, files: new Set() })
    used.get(key).files.add(file)
  }
}

console.log('\n▸ every text colour used in the markup')
let dim = []
for (const [key, { name, alpha, files }] of used) {
  const onVoid = contrast(alphaComposite(tokens[name], alpha, tokens.void), tokens.void)
  const onCard = contrast(alphaComposite(tokens[name], alpha, tokens['surface-2']), tokens['surface-2'])
  const worst = Math.min(onVoid, onCard)
  const passes = worst >= 4.5
  if (!passes) dim.push({ key, worst, files: [...files] })
  console.log(
    `  ${passes ? '✓' : '✗'} text-${key.padEnd(18)} ${worst.toFixed(2)}:1` +
      `${passes ? '' : `   → ${[...files].slice(0, 3).join(', ')}`}`
  )
}
check(
  'every text colour clears 4.5:1 on both the page and a card',
  dim.length === 0,
  dim.length ? `→ ${dim.map((entry) => `text-${entry.key} (${entry.worst.toFixed(2)}:1)`).join(', ')}` : ''
)

/* Icon-only controls need an accessible name. A button whose only child is an
   svg or a sr-only span needs aria-label to be announced at all. */
const unlabelledButtons = []
for (const [file, source] of Object.entries(sources)) {
  for (const match of source.matchAll(/<button\b([^>]*)>([\s\S]{0,400}?)<\/button>/g)) {
    const [, attributes, children] = match
    const hasText = /[A-Za-z]{2}/.test(children.replace(/<[^>]*>/g, ' '))
    const hasLabel = /aria-label=|aria-labelledby=|title=/.test(attributes)
    if (!hasText && !hasLabel) unlabelledButtons.push(file)
  }
}
check(
  'every button has a text child or an aria-label',
  unlabelledButtons.length === 0,
  [...new Set(unlabelledButtons)].join(', ')
)

/* Reduced motion has to be honoured where motion is created, not only in the
   engine — a media query for the CSS side and the hook for the JS side. */
const hasMediaQuery = css.includes('prefers-reduced-motion')
const jsHonours = await readFile(path.join(root, 'src/lib/device.js'), 'utf8').then((source) =>
  source.includes('reducedMotion')
)
check('CSS honours prefers-reduced-motion', hasMediaQuery)
check('the JS layer reads the reduced-motion preference', jsHonours)

console.log('')
if (failures.length) {
  console.log(`✗ ${failures.length} check(s) failed`)
  for (const failure of [...new Set(failures)]) console.log(`  · ${failure}`)
  process.exit(1)
} else {
  console.log('✓ accessibility contract holds\n')
  process.exit(0)
}
