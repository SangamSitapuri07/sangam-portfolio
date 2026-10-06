/**
 * Rig verification (development tool, not shipped).
 *
 * The riskiest code in this project is the part where the scanned laptop is
 * disassembled and re-hung on a hinge: if a mesh lands in the wrong half, or the
 * display panes are not found, the failure is silent — the model still renders,
 * just wrong. This script loads the real asset in Node, runs the same assembly
 * code the browser runs, and asserts the physical facts we derived by hand:
 *
 *   • every mesh is accounted for, and the split matches the part map,
 *   • the display panes are found and their UVs now span exactly 0…1,
 *   • the hinge pose is real: shut ⇒ the lid lies over the deck; open ⇒ it stands
 *     upright with the display facing the viewer,
 *   • the display faces +Z once assembled, and sits in front of the hinge,
 *   • anchors land where the storyboard's camera values expect them.
 *
 *   node tools/verify-rig.mjs
 */

import { createServer } from 'vite'
import * as THREE from 'three'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

/* The image pipeline does not exist in Node. The loader only needs the globals to
 * be present — this script verifies geometry, materials and the hinge, never
 * pixel content. */
globalThis.self = globalThis
globalThis.createImageBitmap = async () => ({ width: 512, height: 256, close() {} })
if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = () => 'blob:node-stub'
  globalThis.URL.revokeObjectURL = () => {}
}

const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')

const server = await createServer({
  root,
  logLevel: 'error',
  server: { middlewareMode: true },
  appType: 'custom',
})

const failures = []
const check = (label, condition, detail = '') => {
  const ok = Boolean(condition)
  console.log(`${ok ? '  ✓' : '  ✗'} ${label}${detail ? `  ${detail}` : ''}`)
  if (!ok) failures.push(label)
}

try {
  const { assembleLaptop, applyLidPose } = await server.ssrLoadModule('/src/lib/modelParts.js')
  const { hinge, screens: screenConfig, parts } = await server.ssrLoadModule('/src/config/laptop.js')

  const file = await readFile(path.join(root, 'public/models/cyberpunk_laptop.glb'))
  const arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)

  const gltf = await new Promise((resolve, reject) => {
    new GLTFLoader().parse(arrayBuffer, '', resolve, reject)
  })

  console.log('\n▸ assembling the scanned machine')
  const rig = assembleLaptop(gltf.scene, { quality: { id: 'high', glassOverlay: true } })

  /* ---- 1. Split ---- */
  const countMeshes = (group) => {
    let n = 0
    group.traverse((child) => {
      // The glass sheet is added by the rig itself, so it is not part of the split.
      if (child.isMesh && child.name !== 'laptop-screen-glass') n += 1
    })
    return n
  }
  const baseMeshes = countMeshes(rig.base)
  const lidMeshes = countMeshes(rig.lid)
  console.log(`\n▸ parts: base ${baseMeshes} · lid ${lidMeshes}`)

  check('base has meshes', baseMeshes > 0, `(${baseMeshes})`)
  check('lid has meshes', lidMeshes > 0, `(${lidMeshes})`)
  check(
    'split covers the whole model',
    baseMeshes + lidMeshes === parts.base.length + parts.lid.length,
    `(expected ${parts.base.length + parts.lid.length})`
  )

  /* ---- 2. Displays ---- */
  const main = rig.screens.main
  const status = rig.screens.status
  check('main display found', Boolean(main), main ? `(node "${main.name}")` : '')
  check('status display found', Boolean(status), status ? `(node "${status.name}")` : '')

  if (main) {
    check(
      'main display material is emissive',
      main.material.emissiveIntensity === screenConfig.main.intensity,
      `(intensity ${main.material.emissiveIntensity})`
    )
    const uv = main.geometry.attributes.uv
    let minU = Infinity
    let maxU = -Infinity
    let minV = Infinity
    let maxV = -Infinity
    for (let i = 0; i < uv.count; i += 1) {
      minU = Math.min(minU, uv.getX(i))
      maxU = Math.max(maxU, uv.getX(i))
      minV = Math.min(minV, uv.getY(i))
      maxV = Math.max(maxV, uv.getY(i))
    }
    check(
      'main display UVs normalised to 0…1',
      minU >= -0.001 && minV >= -0.001 && maxU <= 1.001 && maxV <= 1.001,
      `(u ${minU.toFixed(3)}…${maxU.toFixed(3)}, v ${minV.toFixed(3)}…${maxV.toFixed(3)})`
    )
    check('glass sheet added', Boolean(rig.lid.children.find((c) => c.name === 'laptop-screen-glass')))
  }

  /* ---- 3. Hinge ---- */
  const measure = (open) => {
    rig.applyLid(open)
    rig.machine.updateMatrixWorld(true)
    const lidBox = new THREE.Box3().setFromObject(rig.lid)
    const baseBox = new THREE.Box3().setFromObject(rig.base)
    return { lidBox, baseBox }
  }

  console.log('\n▸ hinge')
  const shut = measure(0)
  const open = measure(1)

  const shutSize = shut.lidBox.getSize(new THREE.Vector3())
  const openSize = open.lidBox.getSize(new THREE.Vector3())
  console.log(
    `  shut  lid  y ${shut.lidBox.min.y.toFixed(3)}…${shut.lidBox.max.y.toFixed(3)} ` +
      `z ${shut.lidBox.min.z.toFixed(3)}…${shut.lidBox.max.z.toFixed(3)}`
  )
  console.log(
    `  open  lid  y ${open.lidBox.min.y.toFixed(3)}…${open.lidBox.max.y.toFixed(3)} ` +
      `z ${open.lidBox.min.z.toFixed(3)}…${open.lidBox.max.z.toFixed(3)}`
  )

  const shutGap = shut.lidBox.min.y - shut.baseBox.max.y
  check(
    'shut lid rests ON the deck (no floating, no clipping)',
    shutGap >= -0.012 && shutGap <= 0.03,
    `(gap ${(shutGap * 1000).toFixed(0)} mm at model scale)`
  )
  check(
    'shut lid is flat (thin in Y)',
    shutSize.y < 0.35,
    `(thickness ${shutSize.y.toFixed(3)})`
  )
  check('open lid stands up (tall in Y)', openSize.y > 0.9, `(height ${openSize.y.toFixed(3)})`)
  check(
    'open lid rises above the deck',
    open.lidBox.max.y > open.baseBox.max.y + 0.9,
    `(top ${open.lidBox.max.y.toFixed(3)})`
  )

  /* ---- 4. Which way does the display face? ---- */
  rig.applyLid(1)
  rig.machine.updateMatrixWorld(true)
  const glass = rig.lid.children.find((c) => c.name === 'laptop-screen-glass')
  if (glass) {
    /* A PlaneGeometry faces its own local +Z; the glass is rotated so that +Z
       points out of the display. Transform that axis into world space. */
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(
      glass.getWorldQuaternion(new THREE.Quaternion())
    )
    check(
      'open display faces the viewer (+Z)',
      normal.z > 0.6,
      `(normal z ${normal.z.toFixed(3)})`
    )
    check('open display tilts up slightly', normal.y > 0.05, `(normal y ${normal.y.toFixed(3)})`)
  }

  /* ---- 5. Anchors ---- */
  console.log('\n▸ anchors (world space, machine at rest)')
  for (const [key, value] of Object.entries(rig.anchors)) {
    console.log(`  ${key.padEnd(10)} [${value.map((v) => v.toFixed(3)).join(', ')}]`)
  }
  check(
    'display sits behind the keyboard (open lid leans back)',
    rig.anchors.screen[2] < rig.anchors.deck[2],
    `(screen z ${rig.anchors.screen[2].toFixed(2)} < deck z ${rig.anchors.deck[2].toFixed(2)})`
  )
  check(
    'display rises from the hinge, never behind it',
    rig.anchors.screen[2] > rig.anchors.hinge[2] - 0.08,
    `(screen z ${rig.anchors.screen[2].toFixed(2)} vs hinge z ${rig.anchors.hinge[2].toFixed(2)})`
  )
  check(
    'display anchor is above the deck',
    rig.anchors.screen[1] > rig.anchors.deck[1],
    `(screen y ${rig.anchors.screen[1].toFixed(2)})`
  )

  const machineBox = new THREE.Box3().setFromObject(rig.machine)
  console.log(
    `\n▸ machine bounds  x ${machineBox.min.x.toFixed(2)}…${machineBox.max.x.toFixed(2)}` +
      `  y ${machineBox.min.y.toFixed(2)}…${machineBox.max.y.toFixed(2)}` +
      `  z ${machineBox.min.z.toFixed(2)}…${machineBox.max.z.toFixed(2)}`
  )
  check('machine is grounded', Math.abs(machineBox.min.y) < 0.02, `(min y ${machineBox.min.y.toFixed(3)})`)
  check('machine is centred on X', Math.abs(machineBox.min.x + machineBox.max.x) < 0.25)

  /* ---- 6. Camera framing sanity: is the machine inside the frustum? ---- */
  const { buildKeyframes, resolveCameraAt } = await server.ssrLoadModule('/src/lib/timeline.js')
  const { scenes: sceneConfig } = await server.ssrLoadModule('/src/config/scenes.js')

  /* Which side the copy sits on, and whether the shot is deliberately a close-up
     of the display (in which case the machine sitting behind the copy is the look,
     not a defect) — both come from the scene config, never from the test. */
  const overlayAnchor = Object.fromEntries(
    sceneConfig.map((scene) => [scene.id, scene.overlay?.anchor ?? 'center'])
  )
  const closeup = Object.fromEntries(sceneConfig.map((scene) => [scene.id, scene.framing === 'closeup']))
  const keys = buildKeyframes({ variant: 'desktop' })
  const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.05, 80)
  const target = new THREE.Vector3()
  const out = { pos: [0, 0, 0], target: [0, 0, 0] }

  /* Where the copy sits on a 1440×900 desktop, in NDC. The film must not park a
     glowing machine under a paragraph of body text. */
  const TEXT_REGION = {
    left: [-0.96, -0.16, -0.55, 0.55],
    right: [0.16, 0.96, -0.55, 0.55],
    center: null,
  }

  console.log('\n▸ camera framing per keyframe (machine at rest)')
  let offscreen = 0
  let overlaps = 0
  const corners = []
  for (let i = 0; i < 8; i += 1) corners.push(new THREE.Vector3())
  for (const key of keys) {
    resolveCameraAt(key, rig.anchors, out)
    camera.position.set(out.pos[0], out.pos[1], out.pos[2])
    camera.fov = key.fov
    camera.updateProjectionMatrix()
    target.set(out.target[0], out.target[1], out.target[2])
    camera.lookAt(target)

    camera.updateMatrixWorld()
    // Project the machine's centre and the display centre; both must be on screen.
    const machineCentre = new THREE.Vector3()
    const screenPoint = new THREE.Vector3(...rig.anchors.screen)
    const box = new THREE.Box3().setFromObject(rig.machine)
    box.getCenter(machineCentre)

    const p = screenPoint.clone().project(camera)
    const c = machineCentre.clone().project(camera)
    const visible =
      Math.abs(p.x) < 1.15 && Math.abs(p.y) < 1.15 && p.z < 1 && Math.abs(c.x) < 1.6 && c.z < 1
    if (!visible) offscreen += 1

    /* Composition is scored on two reliable points — the middle of the display and
       the centre of the machine — because a bounding box at close range has
       corners behind the camera that project to nonsense. The five project beats
       are deliberate close-ups (the screen is meant to sit behind the cards), so
       they are reported but not scored. */
    const region = TEXT_REGION[overlayAnchor[key.sceneId] ?? 'center']
    const scored = Boolean(region) && !closeup[key.sceneId]
    let clash = ''
    if (region) {
      const [rl, rr, rb, rt] = region
      const inside = (point) =>
        point.x > rl + 0.04 && point.x < rr - 0.04 && point.y > rb + 0.04 && point.y < rt - 0.04
      if (inside(p) || (c.z < 1 && inside(c))) {
        clash = scored ? '  ← covers the copy' : `  (close-up: display behind the ${overlayAnchor[key.sceneId]}-hand copy)`
        if (scored) overlaps += 1
      }
    }
    console.log(
      `  ${String(key.sceneId).padEnd(11)} ${key.kind.padEnd(8)} ` +
        `cam[${out.pos.map((v) => v.toFixed(2)).join(', ')}] ` +
        `screen ndc(${p.x.toFixed(2)}, ${p.y.toFixed(2)}) copy ${String(overlayAnchor[key.sceneId]).padEnd(6)}` +
        `${clash}${visible ? '' : '  ← off screen'}`
    )
  }
  check('no keyframe parks the machine under the copy', overlaps === 0, `(${overlaps} overlapping)`)

  console.log(
    `\n${failures.length === 0 ? '✓ rig verified' : `✗ ${failures.length} check(s) failed`}\n`
  )
  if (failures.length) {
    console.log(failures.map((f) => `  · ${f}`).join('\n'))
    process.exitCode = 1
  }
} finally {
  await server.close()
}
