/**
 * The machine's silhouette, as far as the camera is concerned.
 *
 * The camera is fitted to what the machine *occupies on screen*, so that every
 * shot fills its stage without cropping and without parking on the copy. Fitting
 * to one big axis-aligned box was the obvious first attempt and it is wrong: the
 * shut laptop is a thin slab inside a tall box, so the film framed it at two
 * thirds the size it could have been, and the lid's bounding volume alone left
 * 40% of the frame empty.
 *
 * What is actually needed is the outline of the geometry. This module keeps the
 * eight corners of every mesh's own bounds — ~320 points for this model — and
 * rewrites them into world space each frame with the meshes' live matrices. That
 * is tight enough to frame against and far cheaper than touching vertices, while
 * still following the hinge and the exploded view, whose parts move on their own.
 *
 * It also publishes the **core**: the envelope of the machine as *assembled*,
 * carried around by the machine's own transform. Full-bleed shots are framed to the
 * core, so the chassis fills the screen and a teardown's parts fly out past the
 * edges instead of shrinking the machine to keep everything in view. The core is
 * captured once, at assembly, and never re-read from the moving parts.
 */

import * as THREE from 'three'

/**
 * @param {THREE.Object3D} machine root of the laptop
 */
export function createSilhouette(machine, { assembled } = {}) {
  const meshes = []
  machine.updateMatrixWorld(true)
  machine.traverse((child) => {
    if (!child.isMesh) return
    /* The screen glass is a hairline pane that also *hides* the display from some
       angles; it must not be allowed to define the frame. */
    if (child.name === 'laptop-screen-glass') return
    if (!child.geometry.boundingBox) child.geometry.computeBoundingBox()
    meshes.push(child)
  })

  const values = new Float32Array(meshes.length * 8 * 3)
  const centre = [0, 0, 0]
  const point = new THREE.Vector3()
  const box = new THREE.Box3()

  /* The assembled envelope, in the machine's own space. Captured before anything
     has been exploded, then only ever transformed — never re-measured, or the
     "core" would inflate with the teardown it is supposed to ignore. */
  const coreLocal = {
    min: assembled ? assembled.min.toArray() : [0, 0, 0],
    max: assembled ? assembled.max.toArray() : [0, 0, 0],
  }
  if (!assembled) {
    const local = new THREE.Box3()
    const toLocal = new THREE.Matrix4().copy(machine.matrixWorld).invert()
    const relative = new THREE.Matrix4()
    const meshBox = new THREE.Box3()
    for (const mesh of meshes) {
      relative.multiplyMatrices(toLocal, mesh.matrixWorld)
      meshBox.copy(mesh.geometry.boundingBox).applyMatrix4(relative)
      local.union(meshBox)
    }
    coreLocal.min = local.min.toArray()
    coreLocal.max = local.max.toArray()
  }
  const core = { min: [0, 0, 0], max: [0, 0, 0], centre: [0, 0, 0] }

  const refresh = () => {
    box.makeEmpty()
    let cursor = 0
    for (let m = 0; m < meshes.length; m += 1) {
      const mesh = meshes[m]
      const local = mesh.geometry.boundingBox
      for (let i = 0; i < 8; i += 1) {
        point.set(
          i & 1 ? local.max.x : local.min.x,
          i & 2 ? local.max.y : local.min.y,
          i & 4 ? local.max.z : local.min.z
        )
        point.applyMatrix4(mesh.matrixWorld)
        values[cursor] = point.x
        values[cursor + 1] = point.y
        values[cursor + 2] = point.z
        cursor += 3
        box.expandByPoint(point)
      }
    }
    box.getCenter(point)
    centre[0] = point.x
    centre[1] = point.y
    centre[2] = point.z

    /* The core follows the machine's transform, so it turns with the storyboard
       and stays the right size while the parts are away. */
    let minX = Infinity
    let minY = Infinity
    let minZ = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    let maxZ = -Infinity
    for (let i = 0; i < 8; i += 1) {
      point.set(
        i & 1 ? coreLocal.max[0] : coreLocal.min[0],
        i & 2 ? coreLocal.max[1] : coreLocal.min[1],
        i & 4 ? coreLocal.max[2] : coreLocal.min[2]
      )
      point.applyMatrix4(machine.matrixWorld)
      if (point.x < minX) minX = point.x
      if (point.y < minY) minY = point.y
      if (point.z < minZ) minZ = point.z
      if (point.x > maxX) maxX = point.x
      if (point.y > maxY) maxY = point.y
      if (point.z > maxZ) maxZ = point.z
    }
    core.min[0] = minX
    core.min[1] = minY
    core.min[2] = minZ
    core.max[0] = maxX
    core.max[1] = maxY
    core.max[2] = maxZ
    core.centre[0] = (minX + maxX) / 2
    core.centre[1] = (minY + maxY) / 2
    core.centre[2] = (minZ + maxZ) / 2
    return subject
  }

  const subject = { centre, points: values, box }
  return { subject, core, refresh, meshes: meshes.length }
}

/**
 * A subject for an arbitrary set of posed objects — used to frame one exploded
 * part while it is the thing the copy is talking about.
 *
 * `pad` grows the box by that fraction of its largest side so a keyboard is framed
 * with a little air rather than cropped to its silhouette; `floor` keeps a small
 * component (an accent strip, a side port) from turning into an extreme macro shot.
 *
 * @param {THREE.Object3D[]} objects
 * @param {{pad?: number, floor?: number}} [options]
 * @param {object} [out] reused subject
 */
const kit = { box: new THREE.Box3(), temp: new THREE.Box3(), size: new THREE.Vector3(), centre: new THREE.Vector3() }
export function boxSubject(objects, { pad = 0.55, floor = 0 } = {}, out = { min: [0, 0, 0], max: [0, 0, 0], centre: [0, 0, 0] }) {
  const { box, temp, size, centre } = kit
  box.makeEmpty()
  for (const object of objects || []) {
    if (!object?.geometry) continue
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox()
    temp.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld)
    box.union(temp)
  }
  if (box.isEmpty()) return null

  box.getSize(size)
  const largest = Math.max(size.x, size.y, size.z)
  const grow = Math.max(largest * pad, floor * 0.5)
  box.expandByScalar(grow)
  box.getCenter(centre)

  out.min[0] = box.min.x
  out.min[1] = box.min.y
  out.min[2] = box.min.z
  out.max[0] = box.max.x
  out.max[1] = box.max.y
  out.max[2] = box.max.z
  out.centre[0] = centre.x
  out.centre[1] = centre.y
  out.centre[2] = centre.z
  return out
}

export default createSilhouette
