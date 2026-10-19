/**
 * The master timeline.
 *
 * One pure, dependency-free module turns scroll progress (0 → 1) into every
 * animated value in the experience: camera, machine pose, hinge angle, exploded
 * amount, studio lighting, atmosphere and the active screen. Both the WebGL scene
 * and the DOM overlays read from here, which is what guarantees they can never
 * disagree.
 *
 * Everything is a pure function of `p` plus static config — so scrolling backwards
 * reproduces the forward pass exactly, and nothing accumulates state.
 *
 * Keyframes store *anchor-relative* camera descriptions rather than absolute
 * positions, and the camera rig resolves them against the machine's live transform
 * each frame (see `resolveCameraAt`). That keeps the framing correct while the
 * laptop itself rotates and drifts through the storyboard.
 */

import { scenes, overlayTiming } from '@/config/scenes'
import { projects } from '@/data/projects'
import { reducedMotion as rmConfig } from '@/config/animation'
import { resolveCamera } from '@/lib/framing'

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
      chapter: scene.chapter,
      anchorId: scene.anchorId,
      name: scene.id,
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
  return range ? range.from + range.span * 0.34 : 0
}

/* ------------------------------------------------------------------ *
 * Easing
 * ------------------------------------------------------------------ */

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value)

export const smoothstep = (t) => {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

/**
 * Partially eased interpolation. A full smoothstep between every key makes the
 * camera come to a dead stop at each one; blending only part of the way keeps a
 * continuous velocity through the whole film while still softening the arrivals.
 */
const KEYFRAME_EASE_BIAS = 0.55
const easeKeyframe = (t) => {
  const eased = smoothstep(t)
  return t + (eased - t) * KEYFRAME_EASE_BIAS
}

/* ------------------------------------------------------------------ *
 * Keyframes
 * ------------------------------------------------------------------ */

const toKey = (scene, sceneRange, raw, previous, variant) => {
  const camera = variant === 'mobile' ? raw.cameraMobile || raw.camera || previous?.camera : raw.camera || previous?.camera
  return {
    at: sceneRange.from + sceneRange.span * raw.at,
    /** Camera intent — resolved to a position against the real viewport aspect. */
    camera,
    /* Machine / environment */
    lid: raw.lid ?? previous?.lid ?? 1,
    explode: raw.explode ?? previous?.explode ?? 0,
    rotation: raw.rotation ?? previous?.rotation ?? [0, 0, 0],
    position: raw.position ?? previous?.position ?? [0, 0, 0],
    light: raw.light ?? previous?.light ?? { glow: 1, rim: 1, ambient: 0.6 },
    fx: raw.fx ?? previous?.fx ?? { particles: 0.4, grid: 0.5, circuits: 0.2, bloom: 0.9 },
    /* Bookkeeping */
    sceneId: scene.id,
    beat: null,
    projectIndex: -1,
    kind: 'scene',
  }
}

/**
 * Build the sorted keyframe list.
 *
 * Each scene's `keys` are resolved in order; anything a key leaves out is carried
 * forward from the previous key (or the previous scene), which keeps the config
 * readable and means a scene only states what changes.
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
  const keys = []
  let previous = null

  for (const scene of scenes) {
    const sceneRange = rangeOf(scene.id)

    /* Projects: one camera beat per project, interpolated between the scene's
       first and last key so the scene's own entrance and exit still play. */
    if (scene.id === 'universe' && projectList.length > 0) {
      const base = scene.keys[0]
      const camera = variant === 'mobile' ? base.cameraMobile || base.camera : base.camera
      const beats = scene.beats?.length ? scene.beats : [{ azimuth: 0, distance: 1, height: 0 }]
      const usable = sceneRange.span * 0.84
      const step = usable / projectList.length
      const carried = toKey(scene, sceneRange, base, previous, variant)
      previous = carried

      projectList.forEach((project, index) => {
        keys.push({
          ...carried,
          at: sceneRange.from + sceneRange.span * 0.08 + step * (index + 0.5),
          camera: {
            ...camera,
            /* Beat values are authored in degrees, like every other camera value. */
            azimuth: camera.azimuth + beats[index % beats.length].azimuth,
            elevation: camera.elevation + beats[index % beats.length].height * 14,
            dolly: camera.dolly / beats[index % beats.length].distance,
          },
          beat: null,
          rotation: [
            carried.rotation[0],
            carried.rotation[1] + (index % 2 === 0 ? 0.06 : -0.06),
            carried.rotation[2],
          ],
          kind: 'project',
          projectIndex: index,
        })
      })

      /* A scene still has to end on a defined shot: without this key the last
         project beat would be the scene's last word and the handover to Scene 06
         would be interpolated across a quarter of the scene. */
      keys.push({
        ...carried,
        at: sceneRange.from + sceneRange.span * 0.86,
        camera,
        kind: 'scene',
        beat: null,
        projectIndex: -1,
      })
      continue
    }

    for (const raw of scene.keys) {
      const resolved = toKey(scene, sceneRange, raw, previous, variant)
      previous = resolved
      keys.push(resolved)
    }
  }

  keys.sort((a, b) => a.at - b.at)

  if (reducedMotion) {
    /* Same story, almost no travel: the hinge opens once and stays put, and the
       exploded view stops at a hint rather than a full teardown. */
    const anchorLid = 0.9
    for (const key of keys) {
      key.lid = clamp01(anchorLid + (key.lid - anchorLid) * rmConfig.lidTravelScale)
      key.explode = key.explode * rmConfig.explodeScale
    }
  }

  return keys
}

/**
 * Resolve a keyframe's camera into world-space numbers.
 *
 * @param {object} key      keyframe produced by buildKeyframes
 * @param {object} subject  world-space silhouette of the posed machine
 * @param {number} aspect   viewport width ÷ height
 * @param {'desktop'|'mobile'} variant which stage rectangle to fit into
 * @param {object} out      reused output object
 */
export function resolveCameraAt(key, subject, aspect = 16 / 9, variant = 'desktop', out = { pos: [0, 0, 0], target: [0, 0, 0] }) {
  return resolveCamera(key.camera, subject || FALLBACK_SUBJECT, aspect, variant, out)
}

/** Used before the rig exists (first frames): a machine-sized box at the origin. */
const FALLBACK_SUBJECT = { centre: [0, 0.85, 0], min: [-1.02, 0, -0.9], max: [1.02, 1.7, 0.9] }

/** Locate the keyframe segment covering `p`. */
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

/** Interpolate two keyframes into one pose. Shared by the director and previews. */
export function blendKeyframes(a, b, t, out = {}) {
  const lerp = (x, y) => x + (y - x) * t
  out.lid = lerp(a.lid, b.lid)
  out.explode = lerp(a.explode, b.explode)
  out.rotation = [0, 1, 2].map((i) => lerp(a.rotation[i], b.rotation[i]))
  out.position = [0, 1, 2].map((i) => lerp(a.position[i], b.position[i]))
  out.light = {
    glow: lerp(a.light.glow, b.light.glow),
    rim: lerp(a.light.rim, b.light.rim),
    ambient: lerp(a.light.ambient, b.light.ambient),
  }
  out.fx = {
    particles: lerp(a.fx.particles, b.fx.particles),
    grid: lerp(a.fx.grid, b.fx.grid),
    circuits: lerp(a.fx.circuits, b.fx.circuits),
    bloom: lerp(a.fx.bloom, b.fx.bloom),
  }
  return out
}

/* ------------------------------------------------------------------ *
 * Story beats
 *
 * Scene 03 (and the two scenes that follow it) do not just open the machine into a
 * cloud of parts: they stop on one component at a time, and each component carries
 * a claim the portfolio actually makes (`config/parts.js`). A beat is a window in
 * the scene's own 0…1 range, with a single part and a weight that rises and falls.
 *
 * One id at a time, windows non-overlapping, weight a pure function of progress —
 * so scrubbing backwards is identical, and the DOM caption and the 3D emphasis can
 * read the same number instead of two animations trying to stay in step.
 * ------------------------------------------------------------------ */

/** Local progress (0…1) inside a scene. */
export function sceneLocalAt(index, p) {
  const range = sceneRanges[index]
  if (!range) return 0
  const span = Math.max(range.span, 1e-6)
  return clamp01((clamp01(p) - range.from) / span)
}

/**
 * Resolve a scene's beats into absolute windows.
 * Beats are authored as `{ part, from, to }` in scene-local progress.
 */
export function storyBeats(scene, index = sceneRanges.findIndex((range) => range.id === scene?.id)) {
  const range = sceneRanges[index]
  if (!scene?.story?.length || !range) return []
  return scene.story.map((beat) => ({
    ...beat,
    sceneIndex: index,
    from: range.from + range.span * beat.from,
    to: range.from + range.span * beat.to,
  }))
}

/**
 * The story beat active at a scene-local progress, with its weight.
 *
 * The weight peaks in the middle of the window and is exactly zero at both edges,
 * so a part is never emphasised while the camera is arriving or leaving.
 */
export function focusAt(scene, at) {
  if (!scene?.story?.length) return { part: null, weight: 0 }
  const value = clamp01(at)
  for (const beat of scene.story) {
    if (value < beat.from || value > beat.to) continue
    const span = Math.max(beat.to - beat.from, 1e-6)
    const u = (value - beat.from) / span
    /* sin^0.8: wide hold, gentle edges. 0 at u = 0 and u = 1. */
    const weight = Math.pow(Math.sin(Math.PI * clamp01(u)), 0.8)
    return { part: beat.part, weight }
  }
  return { part: null, weight: 0 }
}

/** The beat window for the DOM: which caption is showing, and how strongly. */
export const storyFor = (sceneId) => {
  const index = sceneRanges.findIndex((range) => range.id === sceneId)
  const scene = scenes[index]
  return scene?.story ? storyBeats(scene, index) : []
}

/* ------------------------------------------------------------------ *
 * Screen content
 * ------------------------------------------------------------------ */

/**
 * When each screen interface takes over. A section's interface arrives just
 * before the camera does; a project's changes halfway through its beat, so the
 * new interface is already up when the camera settles on it.
 */
export function buildScreenStates({ projectList = projects } = {}) {
  const states = []

  for (const scene of scenes) {
    const sceneRange = rangeOf(scene.id)

    if (scene.id === 'universe' && projectList.length > 0) {
      const usable = sceneRange.span * 0.84
      const step = usable / projectList.length
      projectList.forEach((project, index) => {
        states.push({
          from: sceneRange.from + sceneRange.span * 0.08 + step * index,
          key: `projects:${index}`,
          section: 'universe',
          projectIndex: index,
          projectId: project.id,
        })
      })
      continue
    }

    states.push({
      /* Each panel takes over a little way into its scene, so the copy is already
         moving when the display changes. The first scene has nothing before it to
         wait for, so its panel is live from progress 0. */
      from: sceneRange.from === 0 ? 0 : sceneRange.from + sceneRange.span * 0.05,
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

/** The nav item a scene belongs to. */
export const getActiveNavId = (p) => {
  const scene = scenes[getActiveSceneIndex(p)]
  return scene?.nav?.id || 'home'
}

/**
 * Opacity for a scene's text overlay at progress `p`: fade in → hold → fade out,
 * as fractions of the scene's own window. The first and last scenes fade only on
 * their inner edge, so the page never opens or closes on a blank frame.
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

/**
 * Nav targets: the progress a nav click should land on, and the DOM section ids it
 * can be reached from. Several scenes share one nav item, so a click lands on the
 * first scene that owns it.
 */
export const navProgressTargets = Object.fromEntries(
  ['home', 'skills', 'projects', 'about', 'contact'].map((id) => {
    const scene = scenes.find((entry) => entry.nav?.id === id)
    return [id, scene ? arrivalProgress(scene.id) : 0]
  })
)

/** Scene → the DOM section id to scroll to (unique per scene). */
export const sectionIdOf = (scene) => scene.anchorId || scene.id

export default {
  sceneRanges,
  buildKeyframes,
  resolveCameraAt,
  findSegment,
  blendKeyframes,
  screenStates,
  getScreenState,
  sceneLocalAt,
  focusAt,
  storyBeats,
  storyFor,
  overlayOpacityFor,
  navProgressTargets,
  sectionIdOf,
}
