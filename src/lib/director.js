/**
 * The director.
 *
 * One function, called once per frame, turns scroll progress into everything the
 * scene does: camera position, hinge angle, machine pose, the exploded view,
 * studio lighting, atmosphere and the interface on the laptop screen. It is the
 * single writer for animated values — which is precisely why pointer parallax,
 * the drag interaction and the scroll timeline can never fight each other.
 *
 * Design notes
 *   • no allocation in the frame loop — every intermediate lives on the instance,
 *   • damped values are kept separate from the pointer offsets, so parallax can
 *     never accumulate into the scroll pose,
 *   • anchors are resolved against the machine's LIVE matrix, so the camera keeps
 *     its aim while the laptop rotates and drifts through the storyboard,
 *   • the exploded view is created once per rig and driven by a single scalar, so
 *     Scene 07 is Scene 03 running backwards by construction.
 */

import * as THREE from 'three'

import { damping as dampingConfig, reducedMotion as rmConfig } from '@/config/animation'
import { parallax as parallaxConfig } from '@/config/laptop'
import { defaultAnchors } from '@/lib/anchors'
import { createExplodedView } from '@/lib/explodedView'
import { createSilhouette } from '@/lib/silhouette'
import { createSubjectPicker } from '@/lib/subject'
import { interaction } from '@/lib/interaction'
import { scenes } from '@/config/scenes'
import {
  buildKeyframes,
  findSegment,
  resolveCameraAt,
  blendKeyframes,
  getScreenState,
  sceneLocalAt,
  focusAt,
} from '@/lib/timeline'

const ANCHOR_KEYS = Object.keys(defaultAnchors)
const SCENE_INDEX = Object.fromEntries(scenes.map((scene, index) => [scene.id, index]))

/** Machine silhouette, in world space, for the auto-framing camera. */
const emptySubject = { centre: [0, 0.85, 0], min: [-1.02, 0, -0.9], max: [1.02, 1.7, 0.9] }

const damp = (current, target, lambda, dt) =>
  current + (target - current) * (1 - Math.exp(-lambda * Math.max(dt, 0)))

export function createDirector({
  quality,
  variant = 'desktop',
  reducedMotion = false,
  screenTextures = null,
  sceneState,
  parallax = parallaxConfig,
}) {
  const keyframes = buildKeyframes({
    variant: variant === 'mobile' ? 'mobile' : 'desktop',
    reducedMotion,
  })

  /* Reusable scratch objects — the frame loop must not allocate. */
  const camA = { pos: [0, 0, 0], target: [0, 0, 0], fov: 32 }
  const camB = { pos: [0, 0, 0], target: [0, 0, 0], fov: 32 }
  const camHero = { pos: [0, 0, 0], target: [0, 0, 0], fov: 32 }
  const blended = {}
  /* One subject per keyframe, reused every frame: the camera is resolved for the
     shot it is leaving and the shot it is arriving at, and each may be framed to a
     different thing (the whole machine, its core, or a single part). */
  let pickSubject = () => emptySubject
  const vec = new THREE.Vector3()
  const anchorMatrix = new THREE.Matrix4()
  const anchorScratch = ANCHOR_KEYS.map(() => new THREE.Vector3())

  const heroKey = keyframes.find((key) => key.sceneId === 'engine') || keyframes[0]

  /** Published animation state. Read by components; never mirrored into React. */
  const film = {
    progress: 0,
    time: 0,
    /** Damped scroll pose of the machine (no parallax baked in). */
    machine: { rotX: 0, rotY: 0, rotZ: 0, posX: 0, posY: 0, posZ: 0 },
    /** Pointer offsets, recomputed every frame and added on top. */
    offset: { rotX: 0, rotY: 0, posX: 0, posY: 0 },
    perspective: {
      pos: new THREE.Vector3(0, 1.2, 4),
      target: new THREE.Vector3(0, 0.5, 0),
      fov: 32,
      desiredPos: new THREE.Vector3(0, 1.2, 4),
      desiredTarget: new THREE.Vector3(0, 0.5, 0),
    },
    lid: 0,
    explode: 0,
    light: { glow: 1, rim: 1, ambient: 0.6 },
    /** Atmosphere intensities, 0…1, read by `Atmosphere`. */
    fx: { particles: 0.4, grid: 0.5, circuits: 0.2, bloom: 0.9 },
    worldAnchors: { ...defaultAnchors },
    projectIndex: -1,
    screenKey: null,
    keyframe: null,
    /** The component the copy is talking about right now (Scene 03 and friends). */
    focus: { part: null, weight: 0 },
  }

  /* Publish the film on the shared state object too: DOM writers and the
     atmosphere components read it directly instead of receiving props, which
     keeps the frame loop out of React entirely. */
  if (sceneState) sceneState.film = film

  let rig = null
  let camera = null
  let lights = null
  let exploded = null
  let silhouette = null

  const measureWorldAnchors = () => {
    const source = rig?.anchors || defaultAnchors
    for (let i = 0; i < ANCHOR_KEYS.length; i += 1) {
      const key = ANCHOR_KEYS[i]
      const anchor = source[key] || defaultAnchors[key]
      vec.set(anchor[0], anchor[1], anchor[2]).applyMatrix4(anchorMatrix)
      const scratch = anchorScratch[i]
      scratch.copy(vec)
      const published = film.worldAnchors[key]
      published[0] = scratch.x
      published[1] = scratch.y
      published[2] = scratch.z
    }
  }

  const api = {
    film,
    keyframes,

    /** Wire the scene objects once they exist. Safe to call repeatedly. */
    register({ camera: threeCamera, rig: laptopRig, lights: lightRefs } = {}) {
      if (threeCamera) camera = threeCamera
      if (laptopRig && laptopRig !== rig) {
        rig = laptopRig
        exploded = createExplodedView(laptopRig)
        silhouette = createSilhouette(laptopRig.machine, { assembled: laptopRig.assembled })
        pickSubject = createSubjectPicker({ silhouette, exploded })
      }
      if (lightRefs) lights = lightRefs
      return api
    },

    update(dt) {
      const progress = sceneState?.smoothProgress ?? 0
      const pointer = sceneState?.pointerSmooth || { x: 0, y: 0 }
      film.progress = progress
      film.time += dt

      const { a, b, t } = findSegment(keyframes, progress)
      film.keyframe = { a, b, t }

      const target = blendKeyframes(a, b, t, blended)

      /* ---- 1. Machine pose (scroll only) ---- */
      const lambda = reducedMotion ? dampingConfig.reducedMotion : dampingConfig.laptop
      const machine = film.machine
      machine.rotX = damp(machine.rotX, target.rotation[0], lambda, dt)
      machine.rotY = damp(machine.rotY, target.rotation[1], lambda, dt)
      machine.rotZ = damp(machine.rotZ, target.rotation[2], lambda, dt)
      machine.posX = damp(machine.posX, target.position[0], lambda, dt)
      machine.posY = damp(machine.posY, target.position[1], lambda, dt)
      machine.posZ = damp(machine.posZ, target.position[2], lambda, dt)

      /* ---- 2. Hinge ---- */
      const lidLambda = reducedMotion ? dampingConfig.reducedMotion : dampingConfig.lid
      film.lid = damp(film.lid, target.lid, lidLambda, dt)
      rig?.applyLid?.(film.lid)

      /* ---- 3. Pointer parallax: additive, smaller than the scroll motion ---- */
      const parallaxOn = !reducedMotion && parallax.enabled && quality?.id !== 'low' && Boolean(rig)
      const offset = film.offset
      offset.rotX = parallaxOn ? -pointer.y * parallax.rotationX : 0
      offset.rotY = parallaxOn ? pointer.x * parallax.rotationY : 0
      offset.posX = parallaxOn ? pointer.x * parallax.positionX : 0
      offset.posY = parallaxOn ? pointer.y * parallax.positionY : 0

      if (rig) {
        const m = rig.machine
        m.rotation.set(machine.rotX + offset.rotX, machine.rotY + offset.rotY, machine.rotZ)
        m.position.set(machine.posX + offset.posX, machine.posY + offset.posY, machine.posZ)
        m.updateMatrixWorld(true)
        anchorMatrix.copy(m.matrixWorld)
      } else {
        anchorMatrix.identity()
      }

      /* ---- 4. World-space anchors ---- */
      measureWorldAnchors()

      /* ---- 4b. Which part is speaking ----
       * A pure function of this scene's own progress, so the DOM caption, the
       * component's extra travel and the camera's push-in are all reading the same
       * number. No damping: scrubbing backwards must land on the same part. */
      const sceneIndex = SCENE_INDEX[a.sceneId] ?? 0
      const scene = scenes[sceneIndex]
      const focus = focusAt(scene, sceneLocalAt(sceneIndex, progress))
      film.focus.part = focus.part
      film.focus.weight = focus.weight

      /* ---- 5. Exploded view ----
       * Driven by one scalar, after the hinge, and before the drag offsets are
       * applied below — the parts belong to the machine, so they inherit the drag
       * rather than fighting it. */
      const explodeLambda = reducedMotion ? dampingConfig.reducedMotion : dampingConfig.explode
      film.explode = damp(film.explode, target.explode, explodeLambda, dt)
      exploded?.apply(film.explode, focus)
      if (rig) rig.machine.updateMatrixWorld(true)

      /* ---- 5a. Silhouette, *before* direct manipulation ----
       * The lens is fitted to the machine as the storyboard poses it. The drag
       * offsets are set below, after this measurement, so a visitor's thumb can
       * never move the camera: dragging turns the object, not the shot. */
      if (rig) {
        const m = rig.machine
        m.rotation.set(machine.rotX + offset.rotX, machine.rotY + offset.rotY, machine.rotZ)
        m.position.set(machine.posX + offset.posX, machine.posY + offset.posY, machine.posZ)
        m.updateMatrixWorld(true)
      }
      if (silhouette) silhouette.refresh()

      /* ---- 5b. Direct manipulation ----
       * Absolute values, not increments: these are re-derived from the storyboard
       * pose every frame, so a drag can never accumulate into the scroll pose. */
      if (rig) {
        const m = rig.machine
        m.rotation.set(
          machine.rotX + offset.rotX + interaction.pitch + interaction.driftPitch,
          machine.rotY + offset.rotY + interaction.yaw + interaction.driftYaw,
          machine.rotZ
        )
        m.position.set(
          machine.posX + offset.posX,
          machine.posY + offset.posY + interaction.bob,
          machine.posZ
        )
        m.updateMatrixWorld(true)
      }

      /* ---- 6. Camera ----
       * The lens is fitted to the machine's *live* bounds, so an exploded view
       * pulls back and a reassembled one moves in without any extra keyframes,
       * and the composition stays inside its stage rectangle at any viewport. */
      const viewport = camera?.aspect || 16 / 9
      resolveCameraAt(a, pickSubject(a), viewport, variant, camA)
      resolveCameraAt(b, pickSubject(b), viewport, variant, camB)

      let posXTarget = camA.pos[0] + (camB.pos[0] - camA.pos[0]) * t
      let posYTarget = camA.pos[1] + (camB.pos[1] - camA.pos[1]) * t
      let posZTarget = camA.pos[2] + (camB.pos[2] - camA.pos[2]) * t
      let tgtX = camA.target[0] + (camB.target[0] - camA.target[0]) * t
      let tgtY = camA.target[1] + (camB.target[1] - camA.target[1]) * t
      let tgtZ = camA.target[2] + (camB.target[2] - camA.target[2]) * t
      const fovTarget = camA.fov + (camB.fov - camA.fov) * t

      if (reducedMotion) {
        // Hold the hero framing; let the storyboard move by a whisper only.
        resolveCameraAt(heroKey, pickSubject(heroKey), viewport, variant, camHero)
        const scale = rmConfig.cameraTravelScale
        posXTarget = camHero.pos[0] + (posXTarget - camHero.pos[0]) * scale
        posYTarget = camHero.pos[1] + (posYTarget - camHero.pos[1]) * scale
        posZTarget = camHero.pos[2] + (posZTarget - camHero.pos[2]) * scale
        tgtX = camHero.target[0] + (tgtX - camHero.target[0]) * scale
        tgtY = camHero.target[1] + (tgtY - camHero.target[1]) * scale
        tgtZ = camHero.target[2] + (tgtZ - camHero.target[2]) * scale
      }

      const perspective = film.perspective
      perspective.desiredPos.set(posXTarget, posYTarget, posZTarget)
      perspective.desiredTarget.set(tgtX, tgtY, tgtZ)

      const camLambda = reducedMotion ? dampingConfig.reducedMotion : dampingConfig.camera
      const tgtLambda = reducedMotion ? dampingConfig.reducedMotion : dampingConfig.cameraTarget
      perspective.pos.x = damp(perspective.pos.x, posXTarget, camLambda, dt)
      perspective.pos.y = damp(perspective.pos.y, posYTarget, camLambda, dt)
      perspective.pos.z = damp(perspective.pos.z, posZTarget, camLambda, dt)
      perspective.target.x = damp(perspective.target.x, tgtX, tgtLambda, dt)
      perspective.target.y = damp(perspective.target.y, tgtY, tgtLambda, dt)
      perspective.target.z = damp(perspective.target.z, tgtZ, tgtLambda, dt)
      perspective.fov = damp(perspective.fov, fovTarget, camLambda * 0.6, dt)

      if (camera) {
        camera.position.copy(perspective.pos)
        camera.lookAt(perspective.target)
        if (Math.abs(camera.fov - perspective.fov) > 0.008) {
          camera.fov = perspective.fov
          camera.updateProjectionMatrix()
        }
      }

      /* ---- 7. Studio lighting ---- */
      const lightLambda = reducedMotion ? dampingConfig.reducedMotion : dampingConfig.glow
      film.light.glow = damp(film.light.glow, target.light.glow, lightLambda, dt)
      film.light.rim = damp(film.light.rim, target.light.rim, lightLambda, dt)
      film.light.ambient = damp(film.light.ambient, target.light.ambient, lightLambda, dt)

      if (lights) {
        if (lights.ambient) lights.ambient.intensity = 0.34 * film.light.ambient
        if (lights.rimA) lights.rimA.intensity = 2.6 * film.light.rim
        if (lights.rimB) lights.rimB.intensity = 2.1 * film.light.rim
        if (lights.key) lights.key.intensity = 1.45 * film.light.glow
        if (lights.screenFill) lights.screenFill.intensity = 0.8 * film.light.glow
        if (lights.underglow) lights.underglow.intensity = 1.1 * film.light.glow * (0.5 + film.fx.circuits)
      }

      /* ---- 8. Atmosphere ---- */
      const fxLambda = reducedMotion ? dampingConfig.reducedMotion : dampingConfig.glow
      film.fx.particles = damp(film.fx.particles, target.fx.particles, fxLambda, dt)
      film.fx.grid = damp(film.fx.grid, target.fx.grid, fxLambda, dt)
      film.fx.circuits = damp(film.fx.circuits, target.fx.circuits, fxLambda, dt)
      film.fx.bloom = damp(film.fx.bloom, target.fx.bloom, fxLambda, dt)

      /* ---- 9. Screen content ---- */
      const state = getScreenState(progress)
      film.projectIndex = state.projectIndex
      if (state.key !== film.screenKey) {
        film.screenKey = state.key
        screenTextures?.setScreen?.(state.key)
      }
      if (screenTextures) {
        screenTextures.update?.(film.time)
      }

      return film
    },
  }

  return api
}

export default createDirector
