/**
 * Social + icon asset generation (development tool, not shipped in the bundle).
 *
 * Writes:
 *   public/images/favicon.svg         hand-authored monogram, no font dependency
 *   public/images/apple-touch-icon.png 180×180, opaque (iOS ignores transparency)
 *   public/images/og-image.jpg        1200×630 social card
 *
 * The artwork is pure SVG rasterised by sharp, so it stays crisp at any size and
 * the committed assets can always be regenerated: `npm run og`.
 *
 * Text is drawn with the first font of the stack that exists locally. Inter is
 * preferred; when it is not installed (CI, a bare container) DejaVu Sans stands
 * in — the card is set in uppercase with wide tracking, which reads cleanly in
 * any neutral grotesque. The monogram itself is drawn as paths, so the mark is
 * always identical.
 */

import sharp from 'sharp'
import { mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const OUT = path.join(root, 'public', 'images')

const palette = {
  void: '#05060A',
  ink: '#EEF2FA',
  inkSoft: '#A9B4C9',
  accent: '#4B8CFF',
  accentBright: '#8FB6FF',
  violet: '#7C5CFF',
}

const FONT_CANDIDATES = [
  '/usr/share/fonts/truetype/inter/Inter-Regular.ttf',
  '/usr/share/fonts/opentype/inter/Inter-Regular.otf',
  '/Library/Fonts/Inter.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
]

const fileExists = (file) =>
  access(file).then(
    () => true,
    () => false
  )

/* ---------------------------------------------------------------- the mark */
/* A single S, stroked: two tangent arcs, flat terminals, drawn as one path so
   the geometry is deterministic and needs no font. */
const monogram = ({ size, colourFrom, colourTo, stroke }) => `
  <defs>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colourFrom}"/>
      <stop offset="1" stop-color="${colourTo}"/>
    </linearGradient>
  </defs>
  <path d="M 64 34 C 40 34 28 46 28 60 C 28 74 40 82 64 82 C 88 82 100 90 100 104 C 100 118 88 130 64 130"
        fill="none" stroke="url(#mark)" stroke-width="${stroke}"
        stroke-linecap="round" stroke-linejoin="round"
        transform="scale(${size / 128})"/>`

/* ------------------------------------------------------------- the card */
const ogCard = (font) => `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#070912"/>
      <stop offset="0.55" stop-color="${palette.void}"/>
      <stop offset="1" stop-color="#04050B"/>
    </linearGradient>
    <radialGradient id="glowA" cx="0.18" cy="0.16" r="0.75">
      <stop offset="0" stop-color="${palette.accent}" stop-opacity="0.42"/>
      <stop offset="0.55" stop-color="${palette.accent}" stop-opacity="0.08"/>
      <stop offset="1" stop-color="${palette.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="0.92" cy="0.94" r="0.7">
      <stop offset="0" stop-color="${palette.violet}" stop-opacity="0.30"/>
      <stop offset="1" stop-color="${palette.violet}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.78">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${palette.accent}" stop-opacity="0.85"/>
      <stop offset="1" stop-color="${palette.violet}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#FFFFFF" stroke-opacity="0.035" stroke-width="1"/>
    </pattern>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.accentBright}"/>
      <stop offset="1" stop-color="${palette.violet}"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glowA)"/>
  <rect width="1200" height="630" fill="url(#glowB)"/>

  <!-- monogram badge -->
  <g transform="translate(88 82)">
    <rect x="0" y="0" width="72" height="72" rx="20" fill="#0B1020" stroke="#FFFFFF" stroke-opacity="0.10"/>
    <g transform="translate(16 12) scale(0.31)">
      <path d="M 64 34 C 40 34 28 46 28 60 C 28 74 40 82 64 82 C 88 82 100 90 100 104 C 100 118 88 130 64 130"
            fill="none" stroke="url(#mark)" stroke-width="20"
            stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <text x="184" y="132" font-family="${font}" font-size="24" font-weight="600"
        letter-spacing="6" fill="${palette.accentBright}">FULL-STACK · ANDROID · WEBGL</text>

  <!-- name -->
  <text x="88" y="316" font-family="${font}" font-size="92" font-weight="700"
        letter-spacing="-2" fill="${palette.ink}">Sangam Sitapuri</text>
  <text x="88" y="384" font-family="${font}" font-size="34" font-weight="400"
        letter-spacing="0.4" fill="${palette.inkSoft}">Real-time systems, AI apps and 3D interfaces.</text>

  <rect x="88" y="446" width="520" height="3" fill="url(#rule)"/>

  <text x="88" y="512" font-family="${font}" font-size="24" font-weight="500"
        letter-spacing="0.8" fill="${palette.inkSoft}">github.com/SangamSitapuri07</text>
  <text x="88" y="552" font-family="${font}" font-size="24" font-weight="500"
        letter-spacing="0.8" fill="${palette.inkSoft}">linkedin.com/in/sangam-sitapuri</text>

  <text x="1112" y="552" text-anchor="end" font-family="${font}" font-size="24" font-weight="600"
        letter-spacing="2" fill="${palette.accentBright}">PORTFOLIO</text>

  <rect x="0" y="0" width="1200" height="630" fill="url(#vignette)"/>
</svg>`

/* ------------------------------------------------------------ the favicon */
const favicon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Sangam Sitapuri">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B1020"/>
      <stop offset="1" stop-color="#05060A"/>
    </linearGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.accentBright}"/>
      <stop offset="1" stop-color="${palette.violet}"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="30" fill="url(#bg)"/>
  <rect x="1.5" y="1.5" width="125" height="125" rx="28.5" fill="none"
        stroke="#FFFFFF" stroke-opacity="0.10" stroke-width="3"/>
  <path d="M 64 34 C 40 34 28 46 28 60 C 28 74 40 82 64 82 C 88 82 100 90 100 104 C 100 118 88 130 64 130"
        fill="none" stroke="url(#mark)" stroke-width="20"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

/* --------------------------------------------------------------- icons */
const touchIcon = (font) => `
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B1020"/>
      <stop offset="1" stop-color="#05060A"/>
    </linearGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.accentBright}"/>
      <stop offset="1" stop-color="${palette.violet}"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" fill="url(#bg)"/>
  <path d="M 64 34 C 40 34 28 46 28 60 C 28 74 40 82 64 82 C 88 82 100 90 100 104 C 100 118 88 130 64 130"
        fill="none" stroke="url(#mark)" stroke-width="18"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

async function main() {
  await mkdir(OUT, { recursive: true })

  let font = "Inter, 'Helvetica Neue', Arial, sans-serif"
  for (const candidate of FONT_CANDIDATES) {
    if (await fileExists(candidate)) {
      font = `'${path.basename(candidate, path.extname(candidate))}', sans-serif`
      break
    }
  }
  console.log(`▸ fonts   ${font}`)

  await sharp(Buffer.from(ogCard(font))).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, 'og-image.jpg'))
  await sharp(Buffer.from(touchIcon(font))).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'apple-touch-icon.png'))
  for (const size of [192, 512]) {
    await sharp(Buffer.from(touchIcon(font)))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT, `icon-${size}.png`))
  }
  await writeFile(path.join(OUT, 'favicon.svg'), favicon.trimStart() + '\n')

  const { statSync } = await import('node:fs')
  for (const name of ['og-image.jpg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'favicon.svg']) {
    const size = statSync(path.join(OUT, name)).size
    console.log(`▸ wrote   public/images/${name.padEnd(22)} ${(size / 1024).toFixed(1)} kB`)
  }
}

main().catch((error) => {
  console.error('\n✗ asset generation failed\n', error)
  process.exitCode = 1
})
