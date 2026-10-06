/**
 * The master timeline.
 *
 * One pure, dependency-free module turns scroll progress (0 → 1) into every
 * animated value in the experience: camera, laptop pose, hinge angle, lighting
 * and the active screen. Both the WebGL scene and the DOM overlays read from
 * here, which is what guarantees they can never disagree.
 *
 * Everything is a pure function of `p` plus static config — so scrolling
 * backwards reproduces the forward pass exactly, and nothing accumulates state.
 *
 * Keyframes store *anchor-relative* camera descriptions rather than absolute
 * positions, and the camera rig resolves them against the machine's live
 * transform each frame (see `resolveCameraAt`). That keeps the framing correct
 * while the laptop itself rotates and drifts through the storyboard.
 */

import { scenes, endKeyframe, overlayTiming } from '@/config/scenes'
import { projects } from '@/data/projects'
import { reducedMotion as rmConfig } from '@/config/animation'
import { defaultAnchors, applyAnchor } from '@/lib/anchors'

/* ------------------------------------------------------------------ *
 * Scroll ranges — derived from each scene's height, so the DOM spacer
 * and the 3D timeline are guaranteed to share the same boundaries.
 * ------------------------------------------------------------------ */

const TOTAL_HEIGHT = scenes.reduce((sum, scene) => sum + scene.height, 0)

export const sceneRanges = (() => {
  let acc = 0
  return scenes.map((scene, index) => {
    const from = acc / TOTAL_HEIGHT
    acc += scene.height
    return {
      id: scene.id,
      name: scene.name,
      index,
      height: scene.height,
      from,
      to: acc / TOTAL_HEIGHT,
      span: scene.height / TOTAL_HEIGHT,
    }
  })
})()

export const totalHeightVh = TOTAL_HEIGHT

export const rangeOf = (id) => sceneRanges.find((range) => range.id === id)

/** Progress at which a scene is fully composed (what a nav click scrolls to). */
export const arrivalProgress = (id) => {
  const range = rangeOf(id)
  return range ? range.from + range.span * 0.35 : 0
}

/* ------------------------------------------------------------------ *
 * Easing helpers
 * ------------------------------------------------------------------ */

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value)

const smoothstep = (t) => {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

/**
 * Partially eased interpolation. A full smoothstep between every keyframe makes
 * the camera come to a dead stop at each one; blending only part of the way
 * keeps a continuous velocity through the whole film while still softening the
 * arrivals.
 */
const KEYFRAME_EASE_BIAS = 0.62
const easeKeyframe = (t) => {
  const eased = smoothstep(t)
  return t + (eased - t) * KEYFRAME_EASE_BIAS
}

const lerp = (a, b, t) => a + (b - a) * t

/* ------------------------------------------------------------------ *
 * Keyframes
 * ------------------------------------------------------------------ */

/**
 * Rotate a camera around its target, scale its distance, nudge its height.
 * Operates on (and returns) plain arrays so the rig can reuse objects.
 */
export function orbitCamera(pos, target, { azimuth = 0, distance = 1, height = 0 } = {}) {
  const dx = pos[0] - target[0]
  const dz = pos[2] - target[2]
  const cos = Math.cos(azimuth)
  const sin = Math.sin(azimuth)
  const ox = dx * cos - dz * sin
  const oz = dx * sin + dz * cos
  pos[0] = target[0] + ox * distance
  pos[1] = target[1] + (pos[1] - target[1]) * distance + height
  pos[2] = target[2] + oz * distance
  return pos
}

const describe = (camera, extra = {}) => ({
  anchor: camera.anchor,
  offset: camera.offset,
  lookAnchor: camera.look.anchor,
  lookOffset: camera.look.offset || [0, 0, 0],
  fov: camera.fov,
  ...extra,
})

/**
 * Build the sorted keyframe list.
 *
 * @param {object}  [options]
 * @param {'desktop'|'mobile'} [options.variant]
 * @param {boolean} [options.reducedMotion]
 * @param {Array}   [options.projectList]
 * @returns {Array<object>} keyframes, ascending by `at`
 */
export function buildKeyframes({
  variant = 'desktop',
  reducedMotion = false,
  projectList = projects,
} = {}) {
  const pick = (scene) => (variant === 'mobile' ? scene.cameraMobile || scene.camera : scene.camera)
  const keys = []

  for (const scene of scenes) {
    const range = rangeOf(scene.id)

    if (scene.id === 'projects' && projectList.length > 0) {
      const beats = scene.beats?.length ? scene.beats : [{ azimuth: 0, distance: 1, height: 0 }]
      const base = pick(scene)
      const usable = range.span * 0.82
      const step = usable / projectList.length

      projectList.forEach((project, index) => {
        keys.push({
          ...describe(base),
          at: range.from + range.span * 0.09 + step * (index + 0.5),
          beat: beats[index % beats.length],
          laptop: {
            position: scene.laptop.position,
            rotation: [
              scene.laptop.rotation[0],
              scene.laptop.rotation[1] + (index % 2 === 0 ? 0.05 : -0.05),
              scene.laptop.rotation[2],
            ],
          },
          lid: scene.lid,
          light: scene.light,
          kind: 'project',
          projectIndex: index,
          sceneId: scene.id,
        })
      })
      continue
    }

    keys.push({
      ...describe(pick(scene)),
      at: range.from + range.span * 0.34,
      beat: null,
      laptop: scene.laptop,
      lid: scene.lid,
      light: scene.light,
      kind: 'scene',
      projectIndex: -1,
      sceneId: scene.id,
    })
  }

  /* Closing drift: the camera withdraws and the lid settles nearly shut. */
  const lastRange = sceneRanges[sceneRanges.length - 1]
  keys.push({
    ...describe(variant === 'mobile' ? endKeyframe.cameraMobile : endKeyframe.camera),
    at: lerp(lastRange.from, 1, 0.72),
    beat: null,
    laptop: endKeyframe.laptop,
    lid: endKeyframe.lid,
    light: endKeyframe.light,
    kind: 'outro',
    projectIndex: -1,
    sceneId: 'contact',
  })

  keys.sort((a, b) => a.at - b.at)

  if (reducedMotion) {
    // Same story, almost no travel: the lid opens once and stays put.
    const anchorLid = 0.86
    for (const key of keys) {
      key.lid = clamp01(anchorLid + (key.lid - anchorLid) * rmConfig.lidTravelScale)
    }
  }

  return keys
}

/**
 * Resolve a keyframe's camera into absolute numbers for the machine's current
 * world transform.
 *
 * @param {object} key          keyframe produced by buildKeyframes
 * @param {object} worldAnchors anchor positions already transformed into world space
 * @param {{pos:number[],target:number[]}} out reused output object
 */
export function resolveCameraAt(key, worldAnchors, out) {
  const pos = out.pos || (out.pos = [0, 0, 0])
  const target = out.target || (out.target = [0, 0, 0])

  const anchor = worldAnchors[key.anchor] || defaultAnchors[key.anchor] || defaultAnchors.machine
  const look = worldAnchors[key.lookAnchor] || defaultAnchors[key.lookAnchor] || defaultAnchors.machine

  pos[0] = anchor[0] + key.offset[0]
  pos[1] = anchor[1] + key.offset[1]
  pos[2] = anchor[2] + key.offset[2]

  target[0] = look[0] + key.lookOffset[0]
  target[1] = look[1] + key.lookOffset[1]
  target[2] = look[2] + key.lookOffset[2]

  if (key.beat) orbitCamera(pos, target, key.beat)

  out.fov = key.fov
  return out
}

/**
 * Locate the keyframe segment covering `p`.
 * @returns {{a:object, b:object, t:number}}
 */
export function findSegment(keys, p) {
  const progress = clamp01(p)
  const count = keys.length
  let index = 0
  while (index < count - 1 && keys[index + 1].at <= progress) index += 1

  const a = keys[index]
  const b = keys[index + 1] || a
  const span = Math.max(b.at - a.at, 1e-6)
  const raw = clamp01((progress - a.at) / span)
  const t = a === b ? 0 : easeKeyframe(raw)
  return { a, b, t, index }
}

/* ------------------------------------------------------------------ *
 * Screen content
 * ------------------------------------------------------------------ */

/**
 * When each screen interface takes over. Section screens arrive just before the
 * camera does; project screens change halfway through the move, so the new
 * interface is already up when the camera settles on it.
 */
export function buildScreenStates({ projectList = projects } = {}) {
  const states = []

  for (const scene of scenes) {
    const range = rangeOf(scene.id)

    if (scene.id === 'projects' && projectList.length > 0) {
      const usable = range.span * 0.82
      const step = usable / projectList.length
      projectList.forEach((project, index) => {
        states.push({
          from: range.from + range.span * 0.09 + step * index,
          key: `projects:${index}`,
          section: 'projects',
          projectIndex: index,
          projectId: project.id,
        })
      })
      continue
    }

    states.push({
      /* Each panel takes over a little way into its scene, so the copy is already
         moving when the display changes. The first scene has nothing before it to
         wait for, so its panel is live from progress 0 — which is what
         getScreenState() already returns for the opening stretch. */
      from: range.from === 0 ? 0 : range.from + range.span * 0.04,
      key: scene.screen.section,
      section: scene.screen.section,
      projectIndex: -1,
      projectId: null,
    })
  }

  states.sort((a, b) => a.from - b.from)
  return states
}

export const screenStates = buildScreenStates()

/** The screen interface that should be on the panel at progress `p`. */
export function getScreenState(p, states = screenStates) {
  const progress = clamp01(p)
  let current = states[0]
  for (const state of states) {
    if (state.from <= progress) current = state
    else break
  }
  return current
}

/* ------------------------------------------------------------------ *
 * Overlays and navigation
 * ------------------------------------------------------------------ */

export function getActiveSceneIndex(p) {
  const progress = clamp01(p)
  for (let i = sceneRanges.length - 1; i >= 0; i -= 1) {
    if (progress >= sceneRanges[i].from) return i
  }
  return 0
}

export const getActiveSceneId = (p) => sceneRanges[getActiveSceneIndex(p)].id

/**
 * Opacity for a scene's text overlay at progress `p`:
 * fade in → hold → fade out, as fractions of the scene's own window.
 * The first and last scenes fade only on their inner edge, so the page never
 * opens or closes on a blank frame.
 */
export function overlayOpacityFor(index, p) {
  const range = sceneRanges[index]
  if (!range) return 0

  const progress = clamp01(p)
  const { enterFraction, holdFraction, exitFraction } = overlayTiming
  const rel = (progress - range.from) / range.span

  if (rel < 0 || rel > 1) return 0

  const isFirst = index === 0
  const isLast = index === sceneRanges.length - 1

  if (rel < enterFraction) {
    return isFirst ? 1 : smoothstep(rel / Math.max(enterFraction, 1e-6))
  }

  const exitStart = enterFraction + holdFraction
  if (rel > exitStart) {
    if (isLast) return 1
    const exitRel = (rel - exitStart) / Math.max(exitFraction, 1e-6)
    return 1 - smoothstep(exitRel)
  }

  return 1
}

/** How far an overlay has travelled in (0 → 1) — drives its small rise-in. */
export function overlayRiseFor(index, p) {
  const range = sceneRanges[index]
  if (!range) return 1
  const rel = (clamp01(p) - range.from) / range.span
  return smoothstep(rel / Math.max(overlayTiming.enterFraction, 1e-6))
}

/** Nav items resolve to a scene id, and scenes resolve back to nav items. */
export const navProgressTargets = {
  home: arrivalProgress('hero'),
  about: arrivalProgress('about'),
  skills: arrivalProgress('skills'),
  projects: arrivalProgress('projects'),
  experience: arrivalProgress('experience'),
  contact: arrivalProgress('contact'),
}

/** Shared helper so components can map a scene index to its DOM section. */
export const sectionHeightsVh = scenes.map((scene) => scene.height)

export default {
  sceneRanges,
  buildKeyframes,
  resolveCameraAt,
  findSegment,
  screenStates,
  getScreenState,
  overlayOpacityFor,
  navProgressTargets,
  applyAnchor,
}
