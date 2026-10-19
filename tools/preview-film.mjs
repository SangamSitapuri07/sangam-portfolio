/**
 * Film-strip preview (development tool, not shipped).
 *
 * Renders the REAL storyboard — the camera keys from `config/scenes.js`, resolved
 * against the real assembled machine, with the real hinge pose and the real
 * exploded view — as contact sheets, so composition can be judged without a GPU.
 * The sandbox has no browser; a camera value that parks the lens inside the lid
 * looks perfectly fine in numbers, and did exactly that for a whole afternoon.
 *
 *   node tools/preview-film.mjs                  # one still per scene
 *   node tools/preview-film.mjs --beats=9        # nine stills across the film
 *   node tools/preview-film.mjs --progress=0.1,0.3,0.5 --out=.qa/check.png
 *
 * Output lands in `.qa/` (git-ignored).
 */

import * as THREE from 'three'
import { createCanvas } from '@napi-rs/canvas'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

import { renderMeshes, loadLaptopRig } from './preview-raster.mjs'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)

/* Portrait panels for the phone variant: rendering a 9:16 framing into a 16:9
   canvas would stretch it and misrepresent the composition. */
const W = Number(args.w || (args.variant === 'mobile' ? 288 : 512))
const H = Number(args.h || (args.variant === 'mobile' ? 512 : 288))
const COLS = Number(args.cols || 3)

const server = await createServer({
  root,
  logLevel: 'error',
  server: { middlewareMode: true },
  appType: 'custom',
})

const timeline = await server.ssrLoadModule('/src/lib/timeline.js')
const { createExplodedView } = await server.ssrLoadModule('/src/lib/explodedView.js')
const { createSilhouette } = await server.ssrLoadModule('/src/lib/silhouette.js')
const { resolveCamera } = await server.ssrLoadModule('/src/lib/framing.js')

const rig = await loadLaptopRig()
const exploded = createExplodedView(rig)
const silhouette = createSilhouette(rig.machine)

/* Flat-shade palette: the display is emissive, the glass is skipped (it is 5%
   transparent in the real renderer and would hide the screen here). */
const meshes = []
rig.machine.traverse((mesh) => {
  if (!mesh.isMesh) return
  if (mesh.name === 'laptop-screen-glass') return
  const isScreen = mesh.name === 'Object_24' || mesh.name === 'Object_25'
  meshes.push({ mesh, color: isScreen ? '#2ad9ef' : '#6d7787', emissive: isScreen })
})

const keys = timeline.buildKeyframes({ variant: args.variant === 'mobile' ? 'mobile' : 'desktop' })

const variant = args.variant === 'mobile' ? 'mobile' : 'desktop'
const aspect = variant === 'mobile' ? 9 / 16 : 16 / 9
/** Put the machine in a keyframe's pose; returns its world silhouette. */
function poseMachine(pose) {
  rig.machine.position.set(...pose.position)
  rig.machine.rotation.set(...pose.rotation)
  rig.applyLid(pose.lid)
  exploded.apply(pose.explode)
  rig.machine.updateMatrixWorld(true)
  return silhouette.refresh()
}

/** A pose at progress p, exactly as the director computes it (sans damping). */
function poseAt(p) {
  const { a, b, t } = timeline.findSegment(keys, p)
  const pose = timeline.blendKeyframes(a, b, t, {})
  const subject = poseMachine(pose)
  const camA = resolveCamera(a.camera, subject, aspect, variant, { pos: [0, 0, 0], target: [0, 0, 0] })
  const camB = resolveCamera(b.camera, subject, aspect, variant, { pos: [0, 0, 0], target: [0, 0, 0] })
  const lerp = (x, y) => x + (y - x) * t
  return {
    pose,
    camera: new THREE.Vector3(...camA.pos.map((v, i) => lerp(v, camB.pos[i]))),
    target: new THREE.Vector3(...camA.target.map((v, i) => lerp(v, camB.target[i]))),
    fov: lerp(camA.fov, camB.fov),
  }
}

async function renderSheet(progressList, out) {
  const rows = Math.ceil(progressList.length / COLS)
  const sheet = createCanvas(W * COLS, H * rows)
  const ctx = sheet.getContext('2d')
  ctx.fillStyle = '#05060a'
  ctx.fillRect(0, 0, sheet.width, sheet.height)

  for (let i = 0; i < progressList.length; i += 1) {
    const p = progressList[i]
    const { pose, camera, target, fov } = poseAt(p)

    const canvas = renderMeshes({ meshes, camera, target, fov, width: W, height: H })
    const cx = (i % COLS) * W
    const cy = Math.floor(i / COLS) * H
    ctx.drawImage(canvas, cx, cy)
    ctx.fillStyle = '#5ef0ff'
    ctx.font = '13px monospace'
    const scene = timeline.sceneRanges[timeline.getActiveSceneIndex(p)]
    ctx.fillText(`${scene.id} · p=${p.toFixed(3)} · x${pose.explode.toFixed(2)}`, cx + 7, cy + 16)
  }

  await mkdir(path.dirname(out), { recursive: true })
  await writeFile(out, await sheet.encode('png'))
  return out
}

let list
if (args.progress) list = String(args.progress).split(',').map(Number)
else if (args.beats) {
  const n = Number(args.beats)
  list = Array.from({ length: n }, (_, i) => i / (n - 1))
} else {
  list = timeline.sceneRanges.map((range) => range.from + range.span * 0.42)
}

const out = args.out || path.join(root, '.qa/film.png')
console.log(await renderSheet(list, out))
process.exit(0)
