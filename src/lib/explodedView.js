/**
 * The exploded view — Scene 03, reversed exactly in Scene 07.
 *
 * The model is a sculpt of a laptop, not a teardown: it has no motherboard, fan or
 * battery mesh. What it *does* have is real, separable geometry — the lid
 * assembly, the display panes, the keyboard, the deck plate, the chassis frame,
 * the bottom plate, the accent strip and the side hardware — so the signature
 * cinematic moment is built from those, honestly, rather than from invented parts.
 *
 * Two properties matter more than the choreography:
 *
 *   1. **Determinism.** Every transform is a pure function of one `amount` value
 *      (0 = assembled, 1 = fully broken down), so scene 07 is not a second
 *      animation that has to be kept in sync — it is scene 03 played backwards,
 *      and scrolling up mid-sequence lands exactly where scrolling down did.
 *   2. **Reversibility that actually returns home.** Each unit's motion is
 *      measured from the transform it had when the rig was assembled, so at
 *      amount 0 the machine is bit-identical to the model. Nothing accumulates.
 *
 * The trajectories are arranged rather than exploded at random: the display lifts
 * out of the lid first, the keyboard rises off the deck, the deck plate and the
 * bottom shell part vertically, and the small hardware fans out last. Each unit
 * starts at its own moment (`delay`) and travels its own distance, which is what
 * makes the sequence read as a disassembly instead of a bang.
 */

import * as THREE from 'three'

const DEG = Math.PI / 180
const identity = new THREE.Quaternion()

/**
 * A unit is one rigid group of meshes that travels together.
 *
 * - `names`     mesh names from the model (verified against the real asset)
 * - `offset`    how far the unit travels at amount 1, in machine-local units
 * - `rotation`  degrees of extra rotation at amount 1, about the unit's own centre
 * - `delay` / `span`  where in the 0…1 sweep this unit moves
 */
export const units = [
  {
    id: 'lid',
    /** The lid is a group, not a mesh: its trajectory is applied to the group. */
    kind: 'lid',
    offset: [0, 0.5, -0.34],
    rotation: [-12, 0, 0],
    delay: 0.02,
    span: 0.5,
  },
  {
    id: 'display',
    names: ['Object_24', 'Object_25'],
    /** In the lid's own space: out of the bezel, toward the viewer. */
    offset: [0, 0.02, 0.26],
    rotation: [0, 0, 0],
    delay: 0.1,
    span: 0.42,
  },
  {
    id: 'keyboard',
    names: ['Object_5'],
    offset: [0, 0.9, 0.38],
    rotation: [-8, 0, 0],
    delay: 0.12,
    span: 0.5,
  },
  {
    id: 'deck',
    names: ['Object_6', 'Object_13', 'Object_12'],
    offset: [0, 0.42, -0.02],
    rotation: [0, 0, 0],
    delay: 0.24,
    span: 0.48,
  },
  {
    id: 'bottom',
    names: ['Object_4'],
    offset: [0, -0.5, 0.04],
    rotation: [0, 0, 0],
    delay: 0.3,
    span: 0.48,
  },
  {
    id: 'accent',
    names: ['Object_15', 'Object_17'],
    offset: [1.0, 0.16, 0.1],
    rotation: [0, 20, 0],
    delay: 0.4,
    span: 0.44,
  },
  {
    id: 'hardware',
    names: ['Object_10', 'Object_11', 'Object_14', 'Object_16'],
    offset: [-0.58, 0.1, 0.12],
    rotation: [0, -16, 0],
    delay: 0.44,
    span: 0.44,
  },
  {
    id: 'details',
    names: [
      'Object_27', 'Object_28', 'Object_29', 'Object_30', 'Object_32', 'Object_33',
      'Object_34', 'Object_35', 'Object_36', 'Object_37', 'Object_38', 'Object_39',
      'Object_40',
    ],
    offset: [0.14, 0.28, 0.2],
    rotation: [0, 0, 5],
    delay: 0.5,
    span: 0.4,
  },
]

/** Smootherstep, with a whisper of mechanical snap at the end. */
export const easeUnit = (t) => {
  const x = Math.max(0, Math.min(1, t))
  const s = x * x * x * (x * (x * 6 - 15) + 10)
  /* ~3% overshoot in the last fifth: parts arrive, then seat. */
  const snap = x > 0.8 ? Math.sin(((x - 0.8) / 0.2) * Math.PI) * 0.03 : 0
  return s + snap
}

/** Progress of one unit at a global amount. */
export const unitProgress = (unit, amount) => {
  if (amount <= 0) return 0
  if (amount >= 1) return 1
  return easeUnit((amount - unit.delay) / Math.max(unit.span, 1e-6))
}

/**
 * Build the applier for one rig.
 *
 * Resolves every unit to its meshes once, at assembly time, then writes transforms
 * from scratch each call — no allocation in the frame loop, no accumulated state.
 *
 * All arithmetic happens in the object's **own parent space** (the base group for
 * base hardware, the lid group for lid hardware), which is the space its rest
 * transform is expressed in — so the hinge can keep moving the lid underneath
 * this without either system fighting the other.
 *
 * @param {object} rig assembled rig from `assembleLaptop`
 * @returns {{ apply: (amount: number) => void, units: Array<{id: string, meshes: number}> }}
 */
export function createExplodedView(rig) {
  const entries = []

  const byName = new Map()
  rig.machine.traverse((child) => {
    if (child.isMesh) byName.set(child.name, child)
  })

  /* Rest transforms come from the rig when it recorded them. If it did not (a
     stand-in, a preview harness), they are snapshotted once, at creation — never
     read live at apply time, which would fold each previous explode into the next
     and make the machine creep apart every time the view was rebuilt. */
  const snapshot = new Map()
  const restOf = (object) => {
    const rest = rig.rest?.get(object)
    if (rest) return rest
    const existing = snapshot.get(object)
    if (existing) return existing
    const captured = {
      position: object.position.clone(),
      quaternion: object.quaternion.clone(),
    }
    snapshot.set(object, captured)
    /* Remember it on the rig, so a second view built from the same rig (a React
       re-mount, a preview harness, a quality step) starts from the same baseline
       instead of treating the exploded pose it happens to find as "rest". */
    rig.rest?.set(object, captured)
    return captured
  }

  for (const unit of units) {
    const rotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(unit.rotation[0] * DEG, unit.rotation[1] * DEG, unit.rotation[2] * DEG)
    )
    const offset = new THREE.Vector3(...unit.offset)

    /* The whole lid: it rotates about the hinge, which is its own origin. */
    if (unit.kind === 'lid') {
      entries.push({
        unit,
        objects: [{ object: rig.lid, rest: restOf(rig.lid), centre: new THREE.Vector3() }],
        offset,
        rotation,
      })
      continue
    }

    const meshes = unit.names.map((name) => byName.get(name)).filter(Boolean)
    if (!meshes.length) continue

    /* Every mesh in a unit shares a parent in this model (the rig attaches them
       directly), so one centroid in that parent's space serves the whole unit.
       The centroid is taken from the *rest* positions: reading it live would
       fold the machine's current pose into the pivot every time a view is built,
       and the parts would creep further apart on each rebuild. */
    const centre = new THREE.Vector3()
    for (const mesh of meshes) centre.add(restOf(mesh).position)
    centre.multiplyScalar(1 / meshes.length)

    entries.push({
      unit,
      objects: meshes.map((mesh) => ({ object: mesh, rest: restOf(mesh), centre })),
      offset,
      rotation,
    })
  }

  const scratchQuat = new THREE.Quaternion()
  const scratchVec = new THREE.Vector3()

  let lastAmount = 0

  /**
   * Pose every part.
   *
   * @param {number} amount 0 = assembled, 1 = fully broken down
   * @param {{part?: string, weight?: number}} [emphasis] the part the copy is
   *        talking about: it travels a little further out of the machine, so the
   *        camera has something clearly separated to push in on. A pure function
   *        of (amount, emphasis), like everything else here.
   */
  const apply = (amount, emphasis = null) => {
    const a = amount <= 0 ? 0 : amount >= 1 ? 1 : amount
    lastAmount = a
    const focusId = emphasis?.part || null
    const focusWeight = emphasis?.weight > 0 ? Math.min(emphasis.weight, 1) : 0

    for (const entry of entries) {
      const t = unitProgress(entry.unit, a)
      /* Rotation slerped from identity, so t = 0 is exactly no rotation. */
      scratchQuat.copy(identity).slerp(entry.rotation, t)

      /* The part that is speaking travels 45% further than its neighbours at the
         peak of its beat. It is the same offset it already has, so it reads as the
         same assembly being opened a little wider — not a second animation. */
      const emphasisNow =
        entry.unit.id === focusId ? t * (1 + focusWeight * 0.45) : t

      for (const item of entry.objects) {
        /* p = rest + offset·t + (R(t) − I)·(rest − centre) */
        scratchVec.copy(item.rest.position).sub(item.centre).applyQuaternion(scratchQuat)
        item.object.position
          .copy(item.rest.position)
          .add(scratchVec.sub(item.rest.position).add(item.centre))
          .addScaledVector(entry.offset, emphasisNow)
        item.object.quaternion.copy(item.rest.quaternion).multiply(scratchQuat)
      }
    }
  }

  return {
    apply,
    units: entries.map((entry) => ({ id: entry.unit.id, meshes: entry.objects.length })),
    /** The live objects of one unit — the camera needs them to frame a story beat. */
    unitObjects: (id) => entries.find((entry) => entry.unit.id === id)?.objects.map((item) => item.object) || [],
    /** How far the whole teardown has travelled, 0…1, for the checks. */
    amount: () => lastAmount,
  }
}

export default createExplodedView
