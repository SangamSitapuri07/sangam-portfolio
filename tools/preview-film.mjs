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
const silhouette = createSilhouette(rig.machine, { assembled: rig.assembled })

/* Flat-shade palette: the display is emissive, the glass is skipped (it is 5%
   transparent in the real renderer and would hide the screen here). */
const meshes = []
rig.machine.traverse((mesh) => {
  if (!mesh.isMesh) return
  if (mesh.name === 'laptop-screen-glass') return
  const isScreen = mesh.name === 'Object_24' || mesh.name === 'Object_25'
  meshes.push({ mesh, color: isScreen ? '#2ad9ef' : '#6d7787', emissive: isScreen })
})

const { scenes } = await server.ssrLoadModule('/src/config/scenes.js')
const { chapters } = await server.ssrLoadModule('/src/data/chapters.js')
const { partByUnit } = await server.ssrLoadModule('/src/config/parts.js')
const { alphaAt } = await server.ssrLoadModule('/src/config/scrim.js')
const { copyZoneFor } = await server.ssrLoadModule('/src/lib/framing.js')
const { createSubjectPicker } = await server.ssrLoadModule('/src/lib/subject.js')
const pickSubject = createSubjectPicker({ silhouette, exploded })

const keys = timeline.buildKeyframes({ variant: args.variant === 'mobile' ? 'mobile' : 'desktop' })

const variant = args.variant === 'mobile' ? 'mobile' : 'desktop'
const aspect = variant === 'mobile' ? 9 / 16 : 16 / 9
/** Put the machine in a keyframe's pose; returns its world silhouette. */
function poseMachine(pose, focus) {
  rig.machine.position.set(...pose.position)
  rig.machine.rotation.set(...pose.rotation)
  rig.applyLid(pose.lid)
  exploded.apply(pose.explode, focus)
  rig.machine.updateMatrixWorld(true)
  return silhouette.refresh()
}

/** A pose at progress p, exactly as the director computes it (sans damping). */
function poseAt(p) {
  const { a, b, t } = timeline.findSegment(keys, p)
  const pose = timeline.blendKeyframes(a, b, t, {})
  const sceneIndex = scenes.findIndex((scene) => scene.id === a.sceneId)
  const focus = timeline.focusAt(scenes[sceneIndex], timeline.sceneLocalAt(sceneIndex, p))
  poseMachine(pose, focus)
  const camA = resolveCamera(a.camera, pickSubject(a), aspect, variant, { pos: [0, 0, 0], target: [0, 0, 0] })
  const camB = resolveCamera(b.camera, pickSubject(b), aspect, variant, { pos: [0, 0, 0], target: [0, 0, 0] })
  const lerp = (x, y) => x + (y - x) * t
  return {
    pose,
    camera: new THREE.Vector3(...camA.pos.map((v, i) => lerp(v, camB.pos[i]))),
    target: new THREE.Vector3(...camA.target.map((v, i) => lerp(v, camB.target[i]))),
    fov: lerp(camA.fov, camB.fov),
  }
}

/**
 * Paint the shield and a stand-in for the DOM copy over one cell.
 *
 * The stills show the 3D film; this shows the *page* — the copy sitting on the
 * shield that `config/scrim.js` defines, at the rectangle `stages.full.copy` says
 * it occupies. It is what the contrast check measures, made visible: if a line is
 * unreadable here it is unreadable in the browser.
 */
function paintPage(ctx, cx, cy, p) {
  const image = ctx.getImageData(cx, cy, W, H)
  const data = image.data
  const [rr, gg, bb] = [0x05, 0x06, 0x0a]
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const a = alphaAt((x + 0.5) / W, (y + 0.5) / H, variant)
      if (a <= 0) continue
      const i = (y * W + x) * 4
      data[i] = data[i] * (1 - a) + rr * a
      data[i + 1] = data[i + 1] * (1 - a) + gg * a
      data[i + 2] = data[i + 2] * (1 - a) + bb * a
    }
  }
  ctx.putImageData(image, cx, cy)

  const sceneIndex = timeline.getActiveSceneIndex(p)
  const scene = scenes[sceneIndex]
  const chapter = chapters[sceneIndex]
  const zone = copyZoneFor('full', variant)
  const x0 = cx + zone.left * W
  const width = (zone.right - zone.left) * W
  const bottom = cy + zone.bottom * H
  const scale = variant === 'mobile' ? 0.62 : 1

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#5ef0ff'
  ctx.font = `${Math.round(10 * scale)}px monospace`
  ctx.fillText(`${chapter.number} · ${chapter.kicker}`.toUpperCase(), x0, bottom - 92 * scale)

  ctx.fillStyle = '#eef2f9'
  ctx.font = `600 ${Math.round(19 * scale)}px sans-serif`
  const title = chapter.title.length > 44 ? `${chapter.title.slice(0, 42)}…` : chapter.title
  ctx.fillText(title, x0, bottom - 66 * scale)

  const local = timeline.sceneLocalAt(sceneIndex, p)
  const focus = timeline.focusAt(scene, local)
  const part = focus.part ? partByUnit[focus.part] : null
  ctx.fillStyle = '#aeb7c6'
  ctx.font = `${Math.round(12 * scale)}px sans-serif`
  if (part) {
    ctx.fillText(`${part.index} / ${part.pillar} — ${part.title}`, x0, bottom - 44 * scale)
    ctx.fillText(part.line.slice(0, 58), x0, bottom - 26 * scale)
  } else {
    ctx.fillText(chapter.body.slice(0, Math.round(width / (6 * scale))), x0, bottom - 44 * scale)
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

    if (args.page) {
      paintPage(ctx, cx, cy, p)
    }

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
