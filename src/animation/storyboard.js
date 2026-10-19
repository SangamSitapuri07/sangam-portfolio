import { SCENES, STORY_PROJECT_IDS, FLAGSHIP_PROJECT_ID } from '../data/story.js'

export const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
export const smooth = (value) => { const t = clamp01(value); return t * t * (3 - 2 * t) }
export const range = (start, end, value) => smooth((value - start) / (end - start))
const mix = (a, b, t) => a + (b - a) * t
const vector = (a, b, t) => a.map((value, index) => mix(value, b[index], t))

// One set of poses; no camera tweens compete with these transforms. All
// positions are in the supplied model's measured, Y-up world coordinates.
export const CAMERA_POSES = [
  { at: 0, position: [4.2, 3, 5.5], target: [0, .32, 0], rotation: -.38, exposure: .42 },
  { at: .08, position: [3.2, 2.0, 4.7], target: [0, .69, 0], rotation: -.18, exposure: 1.05 },
  { at: .15, position: [2.6, 2.5, 3.55], target: [0, .36, -.04], rotation: .06, exposure: 1.04 },
  { at: .18, position: [3.5, 2.5, 5.2], target: [0, .73, 0], rotation: .08, exposure: 1.08 },
  { at: .28, position: [-4.2, 3.3, 6.5], target: [0, 1.05, 0], rotation: -.05, exposure: 1.12 },
  { at: .32, position: [-3.5, 2.8, 6.3], target: [0, 1.05, 0], rotation: .08, exposure: 1.07 },
  { at: .40, position: [3.2, 3.3, 6.2], target: [0, 1.0, .12], rotation: .13, exposure: 1.04 },
  { at: .48, position: [4.1, 2.8, 6.4], target: [0, 1.0, 0], rotation: -.12, exposure: 1.05 },
  { at: .60, position: [3.4, 2.5, 6.0], target: [0, 1.05, -.1], rotation: -.08, exposure: 1.02 },
  { at: .635, position: [3.9, 2.9, 6.3], target: [0, 1.0, 0], rotation: -.03, exposure: 1.08 },
  { at: .745, position: [3.1, 1.9, 4.6], target: [0, .72, 0], rotation: -.2, exposure: 1.08 },
  { at: .82, position: [3.2, 2.5, 5.2], target: [0, .62, 0], rotation: -.13, exposure: .98 },
  { at: .94, position: [3.6, 2.1, 5.9], target: [0, .65, 0], rotation: -.26, exposure: .93 },
  { at: 1, position: [4.1, 2.7, 6.7], target: [0, .5, 0], rotation: -.38, exposure: .64 },
]

// These are offsets, never replacement/rest positions. Scene 7 consumes the
// exact same definitions as Scene 3, so e=0 restores every source transform.
export const EXPLODED_PARTS = [
  { name: 'Cube_0', label: 'Chassis', offset: [0, -.42, 0], turn: [0, 0, -.025] },
  { name: 'Cube.001_3', label: 'Display assembly', offset: [.08, .92, -.28], turn: [0, 0, .055] },
  { name: 'Object_5', label: 'Original keycaps', offset: [.08, 1.05, .46], turn: [.055, -.025, 0] },
  { name: 'Object_4', label: 'Original deck', offset: [-.08, .23, .1], turn: [0, .02, 0] },
  { name: 'Object_8', label: 'Original top insert', offset: [-.1, .35, -.05], turn: [0, 0, 0] },
  { name: 'Object_9', label: 'Original auxiliary display', offset: [.12, .42, .04], turn: [0, 0, 0] },
  { name: 'Object_10', label: 'Original upper controls', offset: [.1, .33, -.06], turn: [0, 0, 0] },
]

export function getSceneIndex(progress) {
  const p = clamp01(progress)
  const index = SCENES.findIndex(({ range: [start, end] }) => p >= start && p < end)
  return index < 0 ? SCENES.length - 1 : index
}

export function sampleStory(progress, compact = false, featuredProjectId = FLAGSHIP_PROJECT_ID) {
  const p = clamp01(progress)
  let index = CAMERA_POSES.findIndex((pose) => pose.at >= p)
  if (index < 1) index = 1
  const left = CAMERA_POSES[index - 1], right = CAMERA_POSES[index]
  const t = smooth((p - left.at) / (right.at - left.at))
  const explosion = range(.18, .30, p) * (1 - range(.635, .745, p))
  const position = vector(left.position, right.position, t)
  if (compact) { position[0] *= .72; position[1] = .72 * (position[1] - .65) + .65; position[2] *= .72 }
  const projectIndex = p >= .41 && p < .52 ? Math.min(3, Math.floor((p - .41) / .11 * 4)) : 0
  return {
    progress: p,
    scene: getSceneIndex(p),
    camera: position,
    target: vector(left.target, right.target, t),
    rotation: mix(left.rotation, right.rotation, t),
    lift: -.16 * (1 - range(0, .085, p)),
    exposure: mix(left.exposure, right.exposure, t),
    explosion: explosion * (compact ? .57 : 1),
    rawExplosion: explosion,
    lid: (.16 + .84 * range(.008, .105, p)) * (1 - .23 * range(.94, 1, p)),
    screen: range(.025, .10, p) * (1 - .45 * range(.96, 1, p)),
    projectId: p >= .41 && p < .52 ? STORY_PROJECT_IDS[projectIndex] : STORY_PROJECT_IDS.includes(featuredProjectId) ? featuredProjectId : FLAGSHIP_PROJECT_ID,
    core: range(.205, .29, p) * (1 - range(.68, .74, p)),
  }
}
