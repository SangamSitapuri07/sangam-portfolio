/**
 * Which thing the camera is framing, and where it is looking.
 *
 * A camera key says what it wants in frame — the whole machine (`fit: 'all'`), the
 * assembled core (`fit: 'core'`) — and, for a story beat, a `focus`: the part the
 * copy is talking about. Two different ideas, deliberately kept apart:
 *
 *   • **framing** decides the lens and the orbit distance. It stays on the machine,
 *     so a teardown reads as one continuous take: the chassis holds the frame while
 *     components lift out of it. Fitting the frame to each flying part in turn made
 *     the camera whip between four macro shots, which measurably broke the "no jump
 *     cut" promise in `tools/verify-film.mjs`.
 *   • **aim** is where the lens points. A focused key shifts the target part of the
 *     way toward its part — enough that the eye follows the component, not enough
 *     to lose the machine.
 *
 * It lives outside the director because the still previews, the composition check
 * and the film check all have to frame exactly what the film frames; a second copy
 * of this logic in a tool is how a check starts passing on a picture the visitor
 * never sees.
 */

import { boxSubject } from './silhouette.js'

/** How far the aim point travels toward a focused part, unless a key overrides it. */
const DEFAULT_AIM = 0.42

/**
 * @param {{silhouette: object|null, exploded: object|null}} rig
 * @returns {(key: object) => object|null} subject for a keyframe
 */
export function createSubjectPicker({ silhouette, exploded }) {
  /* One reusable subject per keyframe: no allocation in the frame loop. */
  const boxes = new Map()
  const partBox = { min: [0, 0, 0], max: [0, 0, 0], centre: [0, 0, 0] }

  const scratchFor = (key) => {
    let boxed = boxes.get(key)
    if (!boxed) {
      boxed = { min: null, max: null, points: null, centre: [0, 0, 0] }
      boxes.set(key, boxed)
    }
    return boxed
  }

  return (key) => {
    if (!silhouette) return null
    const intent = key?.camera || {}
    const base = intent.fit === 'core' ? silhouette.core : silhouette.subject

    if (!intent.focus || !exploded) return base

    const objects = exploded.unitObjects(intent.focus)
    if (!objects.length) return base

    /* The part's own box, tight — this is an aim point, not a frame. */
    const part = boxSubject(objects, { pad: 0, floor: 0 }, partBox)
    if (!part) return base

    const weight = intent.aim ?? DEFAULT_AIM
    const out = scratchFor(key)
    out.min = base.min
    out.max = base.max
    out.points = base.points || null
    for (let i = 0; i < 3; i += 1) {
      out.centre[i] = base.centre[i] + (part.centre[i] - base.centre[i]) * weight
    }
    return out
  }
}

export default createSubjectPicker
