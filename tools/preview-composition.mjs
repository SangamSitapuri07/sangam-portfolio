/**
 * Composition check (development tool, not shipped).
 *
 * The stills in `preview-film.mjs` show whether a shot looks good; this shows
 * whether it is *readable* — specifically, whether the machine has been parked on
 * top of the copy. The DOM overlay puts text in a fixed part of the viewport per
 * scene (`overlay.anchor`), so the safe layout is a geometric fact about the
 * projected machine, not a matter of taste.
 *
 * For every camera key it projects the machine's bounding box into normalised
 * screen space and reports the overlap with the copy zone. A shot that overlaps is
 * a shot where a paragraph is sitting on a glowing display.
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

const { resolveCamera } = await server.ssrLoadModule('/src/lib/framing.js')
const timeline = await server.ssrLoadModule('/src/lib/timeline.js')
const { buildKeyframes } = timeline
const { createExplodedView } = await server.ssrLoadModule('/src/lib/explodedView.js')
const { createSilhouette } = await server.ssrLoadModule('/src/lib/silhouette.js')

const { loadLaptopRig } = await import('./preview-raster.mjs')
const rig = await loadLaptopRig()
const exploded = createExplodedView(rig)
const silhouette = createSilhouette(rig.machine)

/* Mesh vertices, for the projected silhouette (a bounding box alone is far too
   coarse for a laptop seen at an angle). Each set keeps its own geometry and is
   projected through the mesh's *live* matrix: the lid and the exploded parts move
   on their own, so a single pre-baked point cloud would measure the loading pose. */
const pointSets = []
rig.machine.traverse((mesh) => {
  if (!mesh.isMesh || mesh.name === 'laptop-screen-glass') return
  pointSets.push({ mesh, attribute: mesh.geometry.attributes.position, stride: 2 })
})

const { copyZoneFor } = await server.ssrLoadModule('/src/lib/framing.js')

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
    exploded.apply(key.explode)
    rig.machine.updateMatrixWorld(true)
    const subject = silhouette.refresh()
    const shot = resolveCamera(key.camera, subject, aspect, variant)
    camera.fov = shot.fov
    camera.position.set(...shot.pos)
    camera.updateProjectionMatrix()
    target.set(...shot.target)
    camera.lookAt(target)
    camera.updateMatrixWorld(true)

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    const projected = new THREE.Vector3()
    for (const set of pointSets) {
      for (let i = 0; i < set.attribute.count; i += set.stride) {
        projected.fromBufferAttribute(set.attribute, i).applyMatrix4(set.mesh.matrixWorld).project(camera)
        if (projected.z > 1) continue
        if (projected.x < minX) minX = projected.x
        if (projected.x > maxX) maxX = projected.x
        if (projected.y < minY) minY = projected.y
        if (projected.y > maxY) maxY = projected.y
      }
    }

    /* NDC → screen fractions (y down). */
    const box = {
      left: minX * 0.5 + 0.5,
      right: maxX * 0.5 + 0.5,
      top: 0.5 - maxY * 0.5,
      bottom: 0.5 - minY * 0.5,
    }

    const zone = { ...copyZoneFor(key.camera.stage, variant), anchor: key.camera.stage }
    const overlap = zone ? overlapArea(box, zone) : 0
    const zoneArea = zone ? (zone.right - zone.left) * (zone.bottom - zone.top) : 1
    const ratio = zoneArea ? overlap / zoneArea : 0
    const cropped = box.left < -0.02 || box.right > 1.02 || box.top < -0.02 || box.bottom > 1.02
    rows.push({ variant, scene: key.sceneId, at: key.at, box, zone, ratio, cropped, fov: shot.fov })
    if (cropped) failures.push({ variant, scene: key.sceneId, at: key.at.toFixed(3), cropped: true })
    if (ratio > 0.02) failures.push({ variant, scene: key.sceneId, at: key.at.toFixed(3), ratio })
  }
}

console.log('\n▸ where the machine sits, and what it covers\n')
console.log(
  `${'view'.padEnd(8)}${'scene'.padEnd(16)}${'x range'.padEnd(18)}${'y range'.padEnd(18)}${'lens'.padEnd(7)}${'copy'.padEnd(8)}overlap`
)
for (const row of rows) {
  const x = `${row.box.left.toFixed(2)}…${row.box.right.toFixed(2)}`
  const y = `${row.box.top.toFixed(2)}…${row.box.bottom.toFixed(2)}`
  const flag = `${row.ratio > 0.02 ? ' copy' : ''}${row.cropped ? ' cropped' : ''}${row.ratio > 0.02 || row.cropped ? '  ✗' : ''}`
  console.log(
    `${row.variant.padEnd(8)}${row.scene.padEnd(16)}${x.padEnd(18)}${y.padEnd(18)}${`${row.fov.toFixed(0)}°`.padEnd(7)}${String(row.zone?.anchor || 'none').padEnd(8)}${(row.ratio * 100).toFixed(0)}%${flag}`
  )
}

if (failures.length) {
  console.log(`\n✗ ${failures.length} shots park the machine on the copy:`)
  for (const failure of failures)
    console.log(
      `   · ${failure.variant} ${failure.scene} @${failure.at} — ${failure.cropped ? 'subject cropped' : `copy ${(failure.ratio * 100).toFixed(0)}% covered`}`
    )
  process.exitCode = 1
} else {
  console.log('\n✓ every shot leaves the copy column clear\n')
}

process.exit(process.exitCode ?? 0)

function overlapArea(a, b) {
  const w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
  const h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
  return w * h
}
