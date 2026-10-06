/**
 * The director.
 *
 * One function, called once per frame, turns scroll progress into everything the
 * scene does: camera position, hinge angle, machine pose, studio lighting and the
 * interface on the laptop screen. It is the single writer for animated values —
 * which is precisely why the mouse parallax, the scroll timeline and the DOM
 * overlays can never fight each other.
 *
 * Design notes
 *   • no allocation in the frame loop — every intermediate lives on the instance,
 *   • damped values are kept separate from the mouse offsets, so parallax can
 *     never accumulate into the scroll pose,
 *   • anchors are resolved against the machine's LIVE matrix, so the camera keeps
 *     its aim while the laptop rotates and drifts through the storyboard.
 */

import * as THREE from 'three'

import { damping as dampingConfig, reducedMotion as rmConfig } from '@/config/animation'
import { parallax as parallaxConfig } from '@/config/laptop'
import { defaultAnchors } from '@/lib/anchors'
import { interaction } from '@/lib/interaction'
import { buildKeyframes, findSegment, resolveCameraAt, getScreenState } from '@/lib/timeline'

const ANCHOR_KEYS = Object.keys(defaultAnchors)

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
  const vec = new THREE.Vector3()
  const anchorMatrix = new THREE.Matrix4()
  const anchorScratch = ANCHOR_KEYS.map(() => new THREE.Vector3())

  const heroKey = keyframes.find((key) => key.sceneId === 'hero') || keyframes[0]

  /** Published animation state. Read by components; never mirrored into React. */
  const film = {
    progress: 0,
    time: 0,
    /** Damped scroll pose of the machine (no parallax baked in). */
    machine: { rotX: 0, rotY: 0, rotZ: 0, posX: 0, posY: 0, posZ: 0 },
    /** Mouse offsets, recomputed every frame and added on top. */
    offset: { rotX: 0, rotY: 0, posX: 0, posY: 0 },
    perspective: {
      pos: new THREE.Vector3(0, 1.2, 4),
      target: new THREE.Vector3(0, 0.5, 0),
      fov: 32,
      desiredPos: new THREE.Vector3(0, 1.2, 4),
      desiredTarget: new THREE.Vector3(0, 0.5, 0),
    },
    lid: 0,
    light: { glow: 1, rim: 1, ambient: 0.6 },
    worldAnchors: { ...defaultAnchors },
    projectIndex: -1,
    screenKey: null,
  }

  let rig = null
  let camera = null
  let lights = null

  /* Named `perspective` above rather than `camera`, so `film.camera` can never be
     confused with the THREE camera instance. */

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
      if (laptopRig) rig = laptopRig
      if (lightRefs) lights = lightRefs
      return api
    },

    update(dt) {
      const progress = sceneState?.smoothProgress ?? 0
      const pointer = sceneState?.pointerSmooth || { x: 0, y: 0 }
      film.progress = progress
      film.time += dt

      const { a, b, t } = findSegment(keyframes, progress)

      /* ---- 1. Machine pose (scroll only) ---- */
      const lambda = reducedMotion ? dampingConfig.reducedMotion : dampingConfig.laptop
      const machine = film.machine
      const rotX = a.laptop.rotation[0] + (b.laptop.rotation[0] - a.laptop.rotation[0]) * t
      const rotY = a.laptop.rotation[1] + (b.laptop.rotation[1] - a.laptop.rotation[1]) * t
      const rotZ = a.laptop.rotation[2] + (b.laptop.rotation[2] - a.laptop.rotation[2]) * t
      const posX = a.laptop.position[0] + (b.laptop.position[0] - a.laptop.position[0]) * t
      const posZ = a.laptop.position[2] + (b.laptop.position[2] - a.laptop.position[2]) * t

      machine.rotX = damp(machine.rotX, rotX, lambda, dt)
      machine.rotY = damp(machine.rotY, rotY, lambda, dt)
      machine.rotZ = damp(machine.rotZ, rotZ, lambda, dt)
      machine.posX = damp(machine.posX, posX, lambda, dt)
      machine.posZ = damp(machine.posZ, posZ, lambda, dt)

      /* ---- 2. Hinge ---- */
      const targetLid = a.lid + (b.lid - a.lid) * t
      const lidLambda = reducedMotion ? dampingConfig.reducedMotion : dampingConfig.lid
      film.lid = damp(film.lid, targetLid, lidLambda, dt)
      rig?.applyLid?.(film.lid)

      /* ---- 3. Mouse parallax: additive, smaller than the scroll motion ---- */
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

      /* ---- 4b. Direct manipulation ----
       * Applied AFTER the anchors are measured, and deliberately excluded from
       * `anchorMatrix`. The camera aims at anchors, so feeding a drag into them
       * would swing the camera with the machine and the whole frame would rotate —
       * the visitor would be turning the camera, not the object. Read here, the
       * drag turns the machine and the camera stays composed on the storyboard,
       * which is also what keeps every keyframe framed the way it was verified. */
      if (rig) {
        const m = rig.machine
        m.rotation.x += interaction.pitch + interaction.driftPitch
        m.rotation.y += interaction.yaw + interaction.driftYaw
        m.position.y += interaction.bob
        m.updateMatrixWorld(true)
      }

      /* ---- 5. Camera ---- */
      resolveCameraAt(a, film.worldAnchors, camA)
      resolveCameraAt(b, film.worldAnchors, camB)

      let posXTarget = camA.pos[0] + (camB.pos[0] - camA.pos[0]) * t
      let posYTarget = camA.pos[1] + (camB.pos[1] - camA.pos[1]) * t
      let posZTarget = camA.pos[2] + (camB.pos[2] - camA.pos[2]) * t
      let tgtX = camA.target[0] + (camB.target[0] - camA.target[0]) * t
      let tgtY = camA.target[1] + (camB.target[1] - camA.target[1]) * t
      let tgtZ = camA.target[2] + (camB.target[2] - camA.target[2]) * t
      const fovTarget = camA.fov + (camB.fov - camA.fov) * t

      if (reducedMotion) {
        // Hold the hero framing; let the storyboard move by a whisper only.
        resolveCameraAt(heroKey, film.worldAnchors, camHero)
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

      /* ---- 6. Studio lighting ---- */
      const glowTarget = a.light.glow + (b.light.glow - a.light.glow) * t
      const rimTarget = a.light.rim + (b.light.rim - a.light.rim) * t
      const ambientTarget = a.light.ambient + (b.light.ambient - a.light.ambient) * t
      const lightLambda = reducedMotion ? dampingConfig.reducedMotion : dampingConfig.glow
      film.light.glow = damp(film.light.glow, glowTarget, lightLambda, dt)
      film.light.rim = damp(film.light.rim, rimTarget, lightLambda, dt)
      film.light.ambient = damp(film.light.ambient, ambientTarget, lightLambda, dt)

      if (lights) {
        if (lights.ambient) lights.ambient.intensity = 0.34 * film.light.ambient
        if (lights.rimA) lights.rimA.intensity = 2.6 * film.light.rim
        if (lights.rimB) lights.rimB.intensity = 2.1 * film.light.rim
        if (lights.key) lights.key.intensity = 1.45 * film.light.glow
        if (lights.screenFill) lights.screenFill.intensity = 0.8 * film.light.glow
      }

      /* ---- 7. Screen content ---- */
      const state = getScreenState(progress)
      film.projectIndex = state.projectIndex
      if (state.key !== film.screenKey) {
        film.screenKey = state.key
        screenTextures?.setScreen?.(state.key)
      }
      if (screenTextures) {
        screenTextures.updateStatus?.(state.key, film.time)
        screenTextures.update?.(film.time)
      }

      return film
    },
  }

  return api
}

export default createDirector
