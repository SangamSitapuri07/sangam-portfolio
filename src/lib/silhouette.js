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
 */

import * as THREE from 'three'

/**
 * @param {THREE.Object3D} machine root of the laptop
 */
export function createSilhouette(machine) {
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
    return subject
  }

  const subject = { centre, points: values, box }
  return { subject, refresh, meshes: meshes.length }
}

export default createSilhouette
