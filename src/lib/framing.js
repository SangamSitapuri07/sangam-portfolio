/**
 * Framing.
 *
 * A camera in this project is described by *intent*, not coordinates:
 *
 *     frame({ azimuth: -20, elevation: 12, stage: 'split', fill: 0.92 })
 *     → "from twenty degrees to the machine's left and twelve degrees above it,
 *        fitted into the copy-free part of the viewport, filling 92% of it"
 *
 * `resolveCamera()` turns that into a position and aim point for a live machine
 * and a live viewport, by iterating until the machine's projected silhouette sits
 * inside the stage rectangle. That is what makes the composition hold on an
 * ultrawide monitor, a laptop and a phone: the same intent produces a different
 * distance, and the machine keeps its place in the frame instead of cropping on
 * one screen and shrinking to a speck on another.
 *
 * The machine is the film, so it is framed *full bleed*: `full` is the whole
 * viewport (with a little bleed allowed at the edges), and the copy floats over it
 * on a scrim. The `copy` rectangle beside each stage is therefore no longer "the
 * place the machine may not go" — it is the rectangle the shield has to keep dark
 * enough to read against, and `config/scrim.js` is checked against it.
 *
 * Pure maths, no three.js, so the config, the director, the still previews and the
 * composition check all share one implementation.
 */

const DEG = Math.PI / 180

/**
 * Where the machine may sit. Screen fractions: x from the left, y from the top.
 *
 * `full`   — the whole viewport; the machine is the background and the copy sits
 *            over it on a scrim. This is the film's default.
 * `split`  — machine on one side, copy on the other. Kept for the loader/intro and
 *            for any shot that genuinely needs clear space beside the machine.
 * `banner` — copy underneath a centred machine, used for the closing line.
 *
 * `copy` is where the words go, in screen fractions, and it is shared with the
 * shield in `config/scrim.js` — one definition for the DOM, the canvas and the
 * checks.
 */
export const stages = {
  full: {
    /* Slightly larger than the viewport: the machine is allowed to bleed past the
       edges, which is what makes it read as the background rather than a picture
       frame sitting in the middle of one. */
    desktop: { left: -0.04, right: 1.04, top: -0.06, bottom: 1.06 },
    /* Portrait gets the same treatment: the machine is the background there too,
       and the upper third stays the calmest part of the frame because the copy
       sits low and the shield covers it. Confining the film to the top of a phone
       shrank it to a band, which is the picture-in-a-box look this rewrite is
       removing. */
    mobile: { left: -0.14, right: 1.14, top: -0.04, bottom: 1.04 },
    copy: {
      /* Bottom-left on a desktop: the calmest part of the frame once the machine
         is lit from the front, and the part a reader's eye reaches last. */
      desktop: { left: 0.045, right: 0.46, top: 0.4, bottom: 0.94 },
      /* A phone has less room, so the words start higher — the shield is already
         near-opaque by 52% of the height, which the composition check verifies. */
      mobile: { left: 0.05, right: 0.95, top: 0.52, bottom: 0.97 },
    },
  },
  split: {
    desktop: { left: 0.47, right: 0.995, top: 0.05, bottom: 0.95 },
    mobile: { left: 0.05, right: 0.95, top: 0.07, bottom: 0.5 },
    /* Where the words go — the complement of the stage, defined beside it so the
       DOM and the composition check cannot disagree. */
    copy: {
      desktop: { left: 0.03, right: 0.44, top: 0.08, bottom: 0.95 },
      mobile: { left: 0.02, right: 0.98, top: 0.56, bottom: 0.98 },
    },
  },
  banner: {
    desktop: { left: 0.22, right: 0.78, top: 0.04, bottom: 0.52 },
    mobile: { left: 0.05, right: 0.95, top: 0.07, bottom: 0.48 },
    copy: {
      desktop: { left: 0.14, right: 0.86, top: 0.58, bottom: 0.95 },
      mobile: { left: 0.02, right: 0.98, top: 0.54, bottom: 0.98 },
    },
  },
}

/** The copy rectangle for a camera's stage on this breakpoint. */
export const copyZoneFor = (stage, variant = 'desktop') => {
  const set = stages[stage] || stages.split
  return set.copy[variant] || set.copy.desktop
}

/**
 * Describe a camera.
 *
 * @param {object} [options]
 * @param {number} [options.azimuth]   degrees around the machine: 0 = in front, + = to its right
 * @param {number} [options.elevation] degrees above it
 * @param {keyof stages} [options.stage] which part of the viewport to fill
 * @param {number} [options.fill]      fraction of the stage the machine should fill
 * @param {number} [options.dolly]     how many subject-radii away the lens sits
 */
export const frame = ({
  azimuth = 0,
  elevation = 10,
  stage = 'full',
  fill = 0.95,
  dolly = 3.4,
  /* Which subject the lens is fitted to:
     `all`  — the machine as posed, exploded parts included. Correct for a wide
              shot where every flying component should stay in frame.
     `core` — the assembled envelope, carried along by the machine's transform.
              The chassis fills the screen and the parts fly *out* of frame, which
              is what makes a teardown feel like it is happening around you rather
              than shrinking away. */
  fit = 'all',
  /* A story beat: the id of a part in `config/parts.js`. The key does not re-frame
     the shot around that part — the framing stays on the machine, so the teardown
     plays as one continuous take — it pulls the aim point toward the part, by
     `aim` of the way (see `lib/subject.js`). */
  focus = null,
  aim = 0.42,
} = {}) => ({
  azimuth,
  elevation,
  stage,
  fill,
  dolly,
  fit,
  focus,
  aim,
})

/**
 * Resolve a camera intent against the machine's live silhouette.
 *
 * @param {object} camera  from `frame()`
 * @param {{centre:number[], points:Float32Array, box:object}} subject
 *   world-space silhouette: its centre and the points the frame is fitted to
 * @param {number} aspect  viewport width ÷ height
 * @param {'desktop'|'mobile'} variant
 * @param {{pos:number[],target:number[],fov:number}} [out] reused output
 */
export function resolveCamera(camera, subject, aspect, variant = 'desktop', out = { pos: [0, 0, 0], target: [0, 0, 0] }) {
  const pos = out.pos || (out.pos = [0, 0, 0])
  const target = out.target || (out.target = [0, 0, 0])
  const safeAspect = aspect > 0.05 ? aspect : 0.05

  const stageSet = stages[camera.stage] || stages.split
  const stage = stageSet[variant] || stageSet.desktop

  /* Inset the stage by the unfilled margin, then re-centre on what is left. */
  const inset = (1 - Math.min(Math.max(camera.fill, 0.2), 1.15)) / 2
  const left = stage.left + inset * (stage.right - stage.left)
  const right = stage.right - inset * (stage.right - stage.left)
  const top = stage.top + inset * (stage.bottom - stage.top)
  const bottom = stage.bottom - inset * (stage.bottom - stage.top)
  const cx = (left + right) / 2
  const cy = (top + bottom) / 2
  const targetW = right - left
  const targetH = bottom - top

  /* Subject centre and silhouette points. A plain box is accepted too, so the
     very first frames (before the rig exists) still frame sensibly. */
  const c = subject.centre || [
    (subject.min[0] + subject.max[0]) / 2,
    (subject.min[1] + subject.max[1]) / 2,
    (subject.min[2] + subject.max[2]) / 2,
  ]
  let points = subject.points
  if (!points) {
    points = []
    for (let i = 0; i < 8; i += 1) {
      points.push(
        i & 1 ? subject.max[0] : subject.min[0],
        i & 2 ? subject.max[1] : subject.min[1],
        i & 4 ? subject.max[2] : subject.min[2]
      )
    }
  }

  /* A radius, for the dolly: the camera keeps a consistent relationship to the
     subject's size, so an exploded view pulls back in perspective terms too. */
  let radius = 0.2
  for (let i = 0; i < points.length; i += 3) {
    const dx = points[i] - c[0]
    const dy = points[i + 1] - c[1]
    const dz = points[i + 2] - c[2]
    const distance = Math.hypot(dx, dy, dz)
    if (distance > radius) radius = distance
  }
  const dolly = camera.dolly > 0.2 ? camera.dolly : 3.4
  const distance = Math.max(0.9, dolly * radius)

  /* View direction and the camera's basis, from the intent. */
  const az = camera.azimuth * DEG
  const el = camera.elevation * DEG
  const dX = Math.sin(az) * Math.cos(el)
  const dY = Math.sin(el)
  const dZ = Math.cos(az) * Math.cos(el)
  const fX = -dX
  const fY = -dY
  const fZ = -dZ

  /* right = normalize(forward × worldUp) — +X when looking down −Z. */
  let rX = -fZ
  let rY = 0
  let rZ = fX
  const rLen = Math.hypot(rX, rY, rZ) || 1
  rX /= rLen
  rY /= rLen
  rZ /= rLen

  /* up = right × forward */
  const uX = rY * fZ - rZ * fY
  const uY = rZ * fX - rX * fZ
  const uZ = rX * fY - rY * fX

  const m = { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, cx: 0, cy: 0 }

  /**
   * Project the silhouette for a candidate lens.
   *
   * The lens is described by `tanHalf` (the tangent of half the vertical field of
   * view) rather than the fov itself: apparent size is inversely proportional to
   * it, which makes the fit a single division instead of a search.
   */
  const measure = (tanHalf, sx, sy) => {
    const px = c[0] + dX * distance
    const py = c[1] + dY * distance
    const pz = c[2] + dZ * distance
    const tx = c[0] + rX * sx + uX * sy
    const ty = c[1] + rY * sx + uY * sy
    const tz = c[2] + rZ * sx + uZ * sy

    /* The real basis of a lookAt camera aimed at that target. */
    let ax = tx - px
    let ay = ty - py
    let az2 = tz - pz
    const aLen = Math.hypot(ax, ay, az2) || 1
    ax /= aLen
    ay /= aLen
    az2 /= aLen

    let bx = -az2
    let by = 0
    let bz = ax
    let bLen = Math.hypot(bx, by, bz)
    if (bLen < 1e-4) {
      bx = 1
      by = 0
      bz = 0
      bLen = 1
    }
    bx /= bLen
    by /= bLen
    bz /= bLen

    const wx = by * az2 - bz * ay
    const wy = bz * ax - bx * az2
    const wz = bx * ay - by * ax

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (let i = 0; i < points.length; i += 3) {
      const vx = points[i] - px
      const vy = points[i + 1] - py
      const vz = points[i + 2] - pz
      const depth = vx * ax + vy * ay + vz * az2
      if (depth < 0.08) return false
      const xCam = vx * bx + vy * by + vz * bz
      const yCam = vx * wx + vy * wy + vz * wz
      const fx = 0.5 + xCam / (2 * depth * tanHalf * safeAspect)
      const fy = 0.5 - yCam / (2 * depth * tanHalf)
      if (fx < minX) minX = fx
      if (fx > maxX) maxX = fx
      if (fy < minY) minY = fy
      if (fy > maxY) maxY = fy
    }
    m.minX = minX
    m.maxX = maxX
    m.minY = minY
    m.maxY = maxY
    m.width = maxX - minX
    m.height = maxY - minY
    m.cx = (minX + maxX) / 2
    m.cy = (minY + maxY) / 2
    return true
  }

  /* Solve the lens, then the aim. Both are well-conditioned: apparent size is
     proportional to tanHalf, and aiming right moves the subject left. Damping
     keeps the two corrections from trading places, and a fixed number of passes
     keeps the result a pure function of the inputs. */
  let tanHalf = Math.tan((31 * DEG) / 2)
  let shiftX = 0
  let shiftY = 0
  for (let pass = 0; pass < 9; pass += 1) {
    if (!measure(tanHalf, shiftX, shiftY)) {
      tanHalf *= 1.35
      continue
    }
    const ratio = Math.max(m.width / targetW, m.height / targetH)
    if (Number.isFinite(ratio) && ratio > 0) tanHalf *= 1 + (ratio - 1) * 0.85
    /* Clamp to a sane lens: 20°…58° vertical. A stage that still does not fit is
       a composition problem the stills will show, not something to solve by
       distorting the lens into a fisheye. */
    const min = Math.tan((20 * DEG) / 2)
    /* A phone needs a wider lens: the same subject has to fit a narrow column of
       the viewport. 76° is still a lens, not a fisheye. */
    const max = Math.tan((variant === 'mobile' ? 76 : 58) * DEG / 2)
    tanHalf = Math.min(Math.max(tanHalf, min), max)

    const halfW = distance * tanHalf * safeAspect
    const halfH = distance * tanHalf
    shiftX += (m.cx - cx) * 2 * halfW * 0.7
    /* Screen y runs downwards, the camera's up axis upwards: opposite sign. */
    shiftY -= (m.cy - cy) * 2 * halfH * 0.7
  }

  pos[0] = c[0] + dX * distance
  pos[1] = c[1] + dY * distance
  pos[2] = c[2] + dZ * distance

  target[0] = c[0] + rX * shiftX + uX * shiftY
  target[1] = c[1] + rY * shiftX + uY * shiftY
  target[2] = c[2] + rZ * shiftX + uZ * shiftY

  out.fov = (2 * Math.atan(tanHalf)) / DEG
  return out
}

export default { frame, resolveCamera, stages }
