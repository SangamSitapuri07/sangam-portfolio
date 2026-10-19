/**
 * Composition check (development tool, not shipped).
 *
 * The stills in `preview-film.mjs` show whether a shot looks good; this shows
 * whether it is *doing what the film is for*:
 *
 *   1. the machine fills the frame — it is the background, not an illustration in
 *      one half of the viewport, so its projected span has to cover the screen on
 *      at least one axis and it has to sit centred,
 *   2. the copy sits on a shield strong enough to read through — measured from the
 *      same stops the DOM paints (`config/scrim.js`), composited with the brightest
 *      thing the scene can put behind it (the emissive display),
 *   3. the shot is not so tight that the subject falls out of the frame by accident.
 *
 *   node tools/preview-composition.mjs
 */

import * as THREE from 'three'
import { createServer } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

globalThis.self = globalThis
globalThis.createImageBitmap = async () => ({ width: 2, height: 2, close() {} })

const server = await createServer({
  root,
  logLevel: 'error',
  server: { middlewareMode: true },
  appType: 'custom',
})

const { resolveCamera, copyZoneFor } = await server.ssrLoadModule('/src/lib/framing.js')
const timeline = await server.ssrLoadModule('/src/lib/timeline.js')
const { buildKeyframes, focusAt, sceneLocalAt } = timeline
const { scenes } = await server.ssrLoadModule('/src/config/scenes.js')
const { createExplodedView } = await server.ssrLoadModule('/src/lib/explodedView.js')
const { createSilhouette } = await server.ssrLoadModule('/src/lib/silhouette.js')
const { createSubjectPicker } = await server.ssrLoadModule('/src/lib/subject.js')
const { minAlphaOver, scrim } = await server.ssrLoadModule('/src/config/scrim.js')

const { loadLaptopRig } = await import('./preview-raster.mjs')
const rig = await loadLaptopRig()
const exploded = createExplodedView(rig)
const silhouette = createSilhouette(rig.machine, { assembled: rig.assembled })
const pickSubject = createSubjectPicker({ silhouette, exploded })

/* Mesh vertices, projected through each mesh's *live* matrix: the lid and the
   exploded parts move on their own, so a baked point cloud would measure the
   loading pose and quietly lie. */
const pointSets = []
rig.machine.traverse((mesh) => {
  if (!mesh.isMesh || mesh.name === 'laptop-screen-glass') return
  pointSets.push({ mesh, attribute: mesh.geometry.attributes.position, stride: 2 })
})

/* The brightest surface the machine can put behind the words. The display is
   emissive cyan in the real renderer; compositing the shield over that is the
   worst case for contrast. */
const BRIGHTEST = [0x2a / 255, 0xd9 / 255, 0xef / 255]
const INK = '#eef2f9'
const VOID = [0x05 / 255, 0x06 / 255, 0x0a / 255]

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const luminance = ([r, g, b]) =>
  0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const ink = [1, 3, 5].map((i) => parseInt(INK.slice(i, i + 2), 16) / 255)

/** What the words sit on: the shield over the brightest possible surface. */
function shieldedBackground(alpha) {
  return BRIGHTEST.map((c, i) => VOID[i] * alpha + c * (1 - alpha))
}

const failures = []
const rows = []

for (const variant of ['desktop', 'mobile']) {
  const keys = buildKeyframes({ variant })
  const aspect = variant === 'mobile' ? 9 / 16 : 16 / 9
  const camera = new THREE.PerspectiveCamera(32, aspect, 0.05, 120)
  const target = new THREE.Vector3()

  for (const key of keys) {
    rig.machine.position.set(...key.position)
    rig.machine.rotation.set(...key.rotation)
    rig.applyLid(key.lid)
    const sceneIndex = scenes.findIndex((scene) => scene.id === key.sceneId)
    const focus = focusAt(scenes[sceneIndex], sceneLocalAt(sceneIndex, key.at))
    exploded.apply(key.explode, focus)
    rig.machine.updateMatrixWorld(true)
    silhouette.refresh()

    const shot = resolveCamera(key.camera, pickSubject(key), aspect, variant)
    camera.fov = shot.fov
    camera.position.set(...shot.pos)
    camera.updateProjectionMatrix()
    target.set(...shot.target)
    camera.lookAt(target)
    camera.updateMatrixWorld(true)

    /* What the shot is *framed on* — the whole machine, its core, or one part —
       measured by projecting that subject's own bounds. Measuring every mesh
       instead would call a deliberate close-up of the keyboard "small" because
       the rest of the machine is off screen, which is the opposite of the truth. */
    const subject = pickSubject(key)
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    const projected = new THREE.Vector3()
    const corners = []
    if (subject?.min) {
      for (let i = 0; i < 8; i += 1) {
        corners.push(
          new THREE.Vector3(
            i & 1 ? subject.max[0] : subject.min[0],
            i & 2 ? subject.max[1] : subject.min[1],
            i & 4 ? subject.max[2] : subject.min[2]
          )
        )
      }
    }
    const project = (v) => {
      projected.copy(v).project(camera)
      if (projected.z > 1) return
      if (projected.x < minX) minX = projected.x
      if (projected.x > maxX) maxX = projected.x
      if (projected.y < minY) minY = projected.y
      if (projected.y > maxY) maxY = projected.y
    }
    if (corners.length) {
      corners.forEach(project)
    } else {
      for (const set of pointSets) {
        for (let i = 0; i < set.attribute.count; i += set.stride) {
          project(projected.fromBufferAttribute(set.attribute, i).applyMatrix4(set.mesh.matrixWorld).clone())
        }
      }
    }

    /* NDC → screen fractions (y down). */
    const box = {
      left: minX * 0.5 + 0.5,
      right: maxX * 0.5 + 0.5,
      top: 0.5 - maxY * 0.5,
      bottom: 0.5 - minY * 0.5,
    }
    const width = box.right - box.left
    const height = box.bottom - box.top
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
    const area = clamp01(width) * clamp01(height)
    const span = Math.max(width, height)
    const centreX = (box.left + box.right) / 2

    const zone = copyZoneFor(key.camera.stage, variant)
    const shield = minAlphaOver(zone, variant)
    const contrastNow = contrast(ink, shieldedBackground(shield))

    const row = {
      variant,
      scene: key.sceneId,
      at: key.at,
      focus: key.camera.focus || key.camera.fit,
      box,
      area,
      span,
      centreX,
      shield,
      contrast: contrastNow,
      fov: shot.fov,
    }
    rows.push(row)

    if (span < 0.8) failures.push(`${variant} ${key.sceneId} @${key.at.toFixed(3)} — only ${(span * 100).toFixed(0)}% of the frame`)
    /* Area alone would reject the correct portrait composition: a shut laptop is a
       wide, shallow slab, so filling the width of a 9:16 frame cannot also fill
       its height without cropping the machine in half. The floor is set so a
       full-width subject passes and a shrunk one does not. */
    if (area < 0.18) failures.push(`${variant} ${key.sceneId} @${key.at.toFixed(3)} — covers just ${(area * 100).toFixed(0)}% of the screen`)
    if (centreX < 0.3 || centreX > 0.7) failures.push(`${variant} ${key.sceneId} @${key.at.toFixed(3)} — pushed to x ${centreX.toFixed(2)}`)
    if (shield < scrim.minAlpha) failures.push(`${variant} ${key.sceneId} @${key.at.toFixed(3)} — shield only ${(shield * 100).toFixed(0)}% under the copy`)
    if (contrastNow < 4.5) failures.push(`${variant} ${key.sceneId} @${key.at.toFixed(3)} — ink ${contrastNow.toFixed(1)}:1 over the shield`)
  }
}

console.log('\n▸ the machine fills the frame, centred, and the copy stays readable\n')
console.log(
  `${'view'.padEnd(8)}${'scene'.padEnd(13)}${'lens'.padEnd(7)}${'span'.padEnd(7)}${'area'.padEnd(7)}${'centre'.padEnd(8)}${'shield'.padEnd(8)}contrast`
)
for (const row of rows) {
  const flagged =
    row.span < 0.8 || row.area < 0.18 || row.centreX < 0.3 || row.centreX > 0.7 || row.shield < scrim.minAlpha
  console.log(
    `${row.variant.padEnd(8)}${row.scene.padEnd(13)}${`${row.fov.toFixed(0)}°`.padEnd(7)}` +
      `${`${(row.span * 100).toFixed(0)}%`.padEnd(7)}${`${(row.area * 100).toFixed(0)}%`.padEnd(7)}` +
      `${row.centreX.toFixed(2).padEnd(8)}${`${(row.shield * 100).toFixed(0)}%`.padEnd(8)}${row.contrast.toFixed(1)}:1` +
      `${flagged ? '  ✗' : ''}`
  )
}

console.log('')
if (failures.length) {
  console.log(`✗ ${failures.length} composition problem(s)\n`)
  for (const failure of failures) console.log(`  · ${failure}`)
  process.exitCode = 1
} else {
  console.log('✓ every shot fills the frame and every word clears 4.5:1')
}

await server.close()
process.exit(process.exitCode || 0)
