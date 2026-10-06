/**
 * Film verification (development tool, not shipped).
 *
 * The headline promise of this project is that one scroll position drives
 * everything, and that scrolling back up plays the whole thing backwards
 * *exactly*. That promise is easy to state and easy to break: a value that
 * accumulates, a target that depends on the direction of travel, a state that
 * is only initialised on the way in — any of those make the film path-dependent,
 * and the symptom would be a machine that lands somewhere slightly different
 * depending on how the reader got there.
 *
 * This script runs the real director in Node against the real rig and asserts
 * the properties that make the promise true:
 *
 *   • the storyboard (camera target, lid, screen, overlay) is a pure function of
 *     progress — sampled backwards it returns exactly what it returned forwards,
 *   • the damped film converges to the same pose when approached from either
 *     direction, and does so far inside the eye's tolerance,
 *   • the travel between adjacent samples is continuous: no jump cuts, no NaNs,
 *   • the screen key changes only at scene boundaries, so the display cannot
 *     flicker between two panels mid-scene,
 *   • the per-frame CPU cost of the whole director stays inside a 60 fps budget,
 *   • no React state is written from inside a frame callback (the architecture
 *     rule that keeps the film off the React render path).
 *
 *   node tools/verify-film.mjs
 */

import { createServer } from 'vite'
import * as THREE from 'three'
import { readFile, readFile as readSource } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

/* The loader needs the browser globals present; it never decodes an image here. */
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

/** Deterministic sample points: scene boundaries included, plus a fine grid. */
const grid = (step) => {
  const out = []
  for (let p = 0; p <= 1 + 1e-9; p += step) out.push(Math.min(1, Number(p.toFixed(6))))
  return out
}

try {
  const { assembleLaptop } = await server.ssrLoadModule('/src/lib/modelParts.js')
  const { createDirector } = await server.ssrLoadModule('/src/lib/director.js')
  const {
    buildKeyframes,
    findSegment,
    resolveCameraAt,
    screenStates,
    getScreenState,
    getActiveSceneId,
    overlayOpacityFor,
    sceneRanges,
    arrivalProgress,
  } = await server.ssrLoadModule('/src/lib/timeline.js')
  const { scenes } = await server.ssrLoadModule('/src/config/scenes.js')
  const { defaultAnchors } = await server.ssrLoadModule('/src/lib/anchors.js')

  const file = await readFile(path.join(root, 'public/models/cyberpunk_laptop.glb'))
  const arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
  const gltf = await new Promise((resolve, reject) => {
    new GLTFLoader().parse(arrayBuffer, '', resolve, reject)
  })
  const rig = assembleLaptop(gltf.scene, { quality: { id: 'high', glassOverlay: true } })

  const keyframes = buildKeyframes({ variant: 'desktop', reducedMotion: false })

  /* ------------------------------------------------------------------ 1. purity
   * The interpolated camera is the film's target. Sampled forwards and backwards
   * it must be the same number, not merely a similar one.
   */
  console.log('\n▸ the storyboard is a pure function of progress')

  const targetAt = (p, out) => {
    const { a, b, t } = findSegment(keyframes, p)
    const ca = resolveCameraAt(a, defaultAnchors, { pos: [0, 0, 0], target: [0, 0, 0] })
    const cb = resolveCameraAt(b, defaultAnchors, { pos: [0, 0, 0], target: [0, 0, 0] })
    for (let i = 0; i < 3; i += 1) {
      out.pos[i] = ca.pos[i] + (cb.pos[i] - ca.pos[i]) * t
      out.target[i] = ca.target[i] + (cb.target[i] - ca.target[i]) * t
    }
    out.fov = ca.fov + (cb.fov - ca.fov) * t
    return out
  }

  const samples = grid(0.002)
  const forward = samples.map((p) => ({ p, cam: targetAt(p, { pos: [0, 0, 0], target: [0, 0, 0] }) }))
  const backward = [...samples]
    .reverse()
    .map((p) => ({ p, cam: targetAt(p, { pos: [0, 0, 0], target: [0, 0, 0] }) }))
    .reverse()

  let mismatched = 0
  let worst = 0
  forward.forEach((entry, index) => {
    const other = backward[index]
    const delta = Math.max(
      ...entry.cam.pos.map((v, i) => Math.abs(v - other.cam.pos[i])),
      ...entry.cam.target.map((v, i) => Math.abs(v - other.cam.target[i])),
      Math.abs(entry.cam.fov - other.cam.fov)
    )
    worst = Math.max(worst, delta)
    if (delta !== 0) mismatched += 1
  })
  check(
    'the camera target is bit-identical sampled in either direction',
    mismatched === 0,
    `(${samples.length} samples, worst ${worst})`
  )

  const discreteFns = {
    screen: (p) => getScreenState(p).key,
    scene: (p) => getActiveSceneId(p),
    opacity: (p) => overlayOpacityFor(sceneRanges.findIndex((r) => getActiveSceneId(p) === r.id), p),
  }
  let discreteMismatch = 0
  for (const [name, fn] of Object.entries(discreteFns)) {
    const f = samples.map(fn)
    const b = [...samples].reverse().map(fn).reverse()
    if (f.some((value, i) => value !== b[i])) {
      discreteMismatch += 1
      console.log(`      · ${name} differed by direction`)
    }
  }
  check('screen, scene and overlay opacity are direction-independent', discreteMismatch === 0)

  /* ------------------------------------------------------------------ 2. reverse
   * Now the damped film itself: approach each checkpoint from below, then from
   * above, and require the settled pose to agree. 600 frames is ten seconds of
   * settling, which leaves a residual around 1e-10 for the configured damping.
   */
  console.log('\n▸ scrubbing backwards lands in the same place')

  const makeFilm = (sceneState) => {
    const director = createDirector({
      quality: { id: 'high' },
      variant: 'desktop',
      reducedMotion: false,
      screenTextures: null,
      sceneState,
    })
    director.register({ camera: new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 100), rig, lights: null })
    return director
  }

  const SETTLE_FRAMES = 600
  const DT = 1 / 60
  const checkpoints = [0.08, 0.24, 0.42, 0.63, 0.81, 0.95]

  /* One pass in each direction through the same list of checkpoints. */
  const runPass = (order, rampStep) => {
    const sceneState = { smoothProgress: order[0], pointerSmooth: { x: 0, y: 0 } }
    const director = makeFilm(sceneState)
    const results = []
    for (const p of order) {
      const from = sceneState.smoothProgress
      const steps = Math.max(1, Math.ceil(Math.abs(p - from) / rampStep))
      for (let i = 1; i <= steps; i += 1) {
        sceneState.smoothProgress = from + ((p - from) * i) / steps
        director.update(DT)
      }
      for (let i = 0; i < SETTLE_FRAMES; i += 1) director.update(DT)
      results.push({
        p,
        pos: director.film.perspective.pos.toArray(),
        target: director.film.perspective.target.toArray(),
        fov: director.film.perspective.fov,
        lid: director.film.lid,
        machine: { ...director.film.machine },
        screen: director.film.screenKey,
      })
    }
    return results
  }

  let lidApplications = 0
  let lidMin = Infinity
  let lidMax = -Infinity
  {
    const realApplyLid = rig.applyLid
    rig.applyLid = (value) => {
      lidApplications += 1
      lidMin = Math.min(lidMin, value)
      lidMax = Math.max(lidMax, value)
      return realApplyLid(value)
    }
  }

  const upward = runPass(checkpoints, 0.004)
  const downward = runPass([...checkpoints].reverse(), 0.004).reverse()

  const deltas = upward.map((entry, index) => {
    const other = downward[index]
    const numbers = [
      ...entry.pos.map((v, i) => Math.abs(v - other.pos[i])),
      ...entry.target.map((v, i) => Math.abs(v - other.target[i])),
      Math.abs(entry.fov - other.fov),
      Math.abs(entry.lid - other.lid),
      ...Object.keys(entry.machine).map((key) => Math.abs(entry.machine[key] - other.machine[key])),
    ]
    return { p: entry.p, worst: Math.max(...numbers), screen: [entry.screen, other.screen] }
  })

  const worstReverse = Math.max(...deltas.map((d) => d.worst))
  check(
    'the settled pose is identical from either direction',
    worstReverse < 1e-6,
    `(worst delta ${worstReverse.toExponential(2)} over ${checkpoints.length} checkpoints)`
  )
  const screenMismatch = deltas.filter(({ screen }) => screen[0] !== screen[1])
  check('the same screen is showing at the same progress', screenMismatch.length === 0)

  /* A harness that measures nothing passes everything: prove the film actually
     moved, and that the hinge was driven every frame of the pass. */
  const cameraTravel = Math.hypot(
    upward[upward.length - 1].pos[0] - upward[0].pos[0],
    upward[upward.length - 1].pos[1] - upward[0].pos[1],
    upward[upward.length - 1].pos[2] - upward[0].pos[2]
  )
  check('the camera actually travels the film', cameraTravel > 1, `(${cameraTravel.toFixed(2)} units)`)
  check(
    'the hinge is driven every frame of the pass',
    lidApplications >= checkpoints.length * SETTLE_FRAMES,
    `(${lidApplications} applications, lid ${lidMin.toFixed(2)}…${lidMax.toFixed(2)})`
  )
  check('the lid moves across the film', lidMax - lidMin > 0.1, `(range ${(lidMax - lidMin).toFixed(2)})`)

  /* ------------------------------------------------------------------ 3. travel
   * A "jump cut": adjacent samples of the target far apart relative to their
   * neighbours. Report the ratio rather than an absolute bound, so the check
   * cannot be satisfied by simply making everything slow.
   */
  console.log('\n▸ the camera travels continuously')

  const poses = grid(0.0005).map((p) => targetAt(p, { pos: [0, 0, 0], target: [0, 0, 0] }))

  const steps = []
  for (let i = 1; i < poses.length; i += 1) {
    steps.push(
      Math.hypot(
        poses[i].pos[0] - poses[i - 1].pos[0],
        poses[i].pos[1] - poses[i - 1].pos[1],
        poses[i].pos[2] - poses[i - 1].pos[2]
      )
    )
  }
  const finite = steps.every((value) => Number.isFinite(value))
  const sorted = [...steps].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const maxStep = sorted[sorted.length - 1]
  check('every sample of the camera path is a real number', finite)
  check(
    'no jump cut between adjacent samples',
    maxStep <= median * 8,
    `(max step ${maxStep.toFixed(5)} vs median ${median.toFixed(5)} ${median ? `= ${(maxStep / median).toFixed(1)}×` : ''})`
  )

  /* ------------------------------------------------------------------ 4. flicker
   * The display may only change panel at the boundaries the storyboard defines.
   */
  console.log('\n▸ the display changes panel only where it should')

  const changes = []
  let previous = null
  for (const p of grid(0.0005)) {
    const key = getScreenState(p).key
    if (key !== previous) {
      changes.push({ p, key })
      previous = key
    }
  }
  const expected = screenStates.map((state) => state.key)
  check(
    'every panel appears exactly once, in storyboard order',
    changes.length === expected.length && changes.every((change, i) => change.key === expected[i]),
    `(${changes.length} changes for ${expected.length} storyboard entries)`
  )
  /* Sampled on a grid, the panel can only be seen to change at the first sample
     at or after its boundary — so the exact property is "never before, never more
     than one step after", not "equal within an epsilon". */
  const STEP = 0.0005
  const late = changes.filter(
    (change, i) => change.p < screenStates[i].from - 1e-9 || change.p - screenStates[i].from >= STEP
  )
  const boundaryError = Math.max(
    ...changes.map((change, i) => Math.max(0, change.p - screenStates[i].from))
  )
  check(
    'each change lands on its storyboard boundary, never early',
    late.length === 0,
    `(worst lag ${boundaryError.toFixed(6)}, under one ${STEP} sample step)`
  )
  check(
    'the panels change in storyboard order as progress advances',
    changes.every((change, i) => i === 0 || change.p > changes[i - 1].p)
  )

  /* ------------------------------------------------------------------ 5. budget
   * The CPU share of the frame: director maths + hinge application. The GPU is
   * not part of this number and is not claimed to be.
   */
  console.log('\n▸ frame budget (director CPU work, no render)')

  const sceneState = { smoothProgress: 0, pointerSmooth: { x: 0.3, y: -0.2 } }
  const director = makeFilm(sceneState)
  const frames = 900
  const times = []
  for (let i = 0; i < frames; i += 1) {
    sceneState.smoothProgress = (i % 400) / 400
    const t0 = process.hrtime.bigint()
    director.update(DT)
    times.push(Number(process.hrtime.bigint() - t0) / 1e6)
  }
  times.sort((a, b) => a - b)
  const medianMs = times[Math.floor(times.length / 2)]
  const p95 = times[Math.floor(times.length * 0.95)]
  const worstMs = times[times.length - 1]
  console.log(
    `      median ${medianMs.toFixed(3)} ms · p95 ${p95.toFixed(3)} ms · worst ${worstMs.toFixed(2)} ms`
  )
  check(
    'the director leaves the frame budget alone',
    p95 < 2,
    `(p95 ${p95.toFixed(3)} ms of a 16.7 ms frame; headless Node, so an upper bound)`
  )

  /* ------------------------------------------------------------------ 6. the rule
   * "No per-frame React state" is an architectural constraint, and the cheapest
   * way to enforce it is to look for the violation in the source.
   */
  console.log('\n▸ no React state is written from a frame callback')

  const loopFiles = [
    'src/components/Experience.jsx',
    'src/components/CameraRig.jsx',
    'src/components/Laptop.jsx',
    'src/components/Studio.jsx',
    'src/components/Effects.jsx',
  ]

  /** Text of each `useFrame(...)` / `useEffect(...)` body, by brace matching. */
  const callbackBodies = (source, call) => {
    const bodies = []
    let index = source.indexOf(`${call}(`)
    while (index !== -1) {
      let depth = 0
      let start = source.indexOf('(', index)
      let end = start
      for (let i = start; i < source.length; i += 1) {
        const ch = source[i]
        if (ch === '(') depth += 1
        else if (ch === ')') {
          depth -= 1
          if (depth === 0) {
            end = i
            break
          }
        }
      }
      bodies.push(source.slice(start, end))
      index = source.indexOf(`${call}(`, end)
    }
    return bodies
  }

  let violations = []
  for (const file of loopFiles) {
    const source = await readSource(path.join(root, file), 'utf8')
    for (const body of callbackBodies(source, 'useFrame')) {
      /* setFoo( — a React state setter. Setters are the only ones that match:
         `offset.set(...)` and friends are three.js methods on a lowercase name. */
      const matches = body.match(/(?<![.\w])set[A-Z]\w*\s*\(/g)
      if (matches) violations.push(`${file}: ${[...new Set(matches)].join(', ')}`)
    }
  }
  check(
    'no setState inside useFrame',
    violations.length === 0,
    violations.length ? `→ ${violations.join(' · ')}` : `(${loopFiles.length} files scanned)`
  )

  /* The film is driven by scroll, never by React: assert the loop reads the
     engine's mutable state instead of a prop. */
  const engineState = await readSource(path.join(root, 'src/lib/director.js'), 'utf8')
  check(
    'the director reads progress from the scroll engine, not from React',
    engineState.includes('sceneState?.smoothProgress'),
    ''
  )

  /* ------------------------------------------------------------------ 7. arrival
   * Clicking a nav item must land inside the scene it names, not near it.
   */
  console.log('\n▸ navigation targets land inside their own scene')

  const offTarget = scenes
    .filter((scene) => scene.nav)
    .filter((scene) => {
      const p = arrivalProgress(scene.id)
      const id = getActiveSceneId(p)
      return id !== scene.id
    })
    .map((scene) => scene.id)
  check(
    'every nav target resolves to the scene it points at',
    offTarget.length === 0,
    offTarget.length ? `→ ${offTarget.join(', ')}` : `(${scenes.filter((s) => s.nav).length} scenes)`
  )
} catch (error) {
  console.error('\n✗ the film check could not run\n', error)
  failures.push('threw')
} finally {
  await server.close()
}

console.log('')
if (failures.length) {
  console.log(`✗ ${failures.length} check(s) failed`)
  for (const failure of [...new Set(failures)]) console.log(`  · ${failure}`)
  process.exit(1)
} else {
  console.log('✓ film verified\n')
  process.exit(0)
}
