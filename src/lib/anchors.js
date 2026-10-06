/**
 * Scene anchors.
 *
 * The camera never hard-codes a position in model space. Instead it aims at
 * named anchors — "the display", "the keyboard deck", "the machine" — which are
 * measured from whatever laptop is actually on screen (the scanned model, or the
 * procedural stand-in). That means:
 *
 *   • swapping or re-exporting the .glb cannot break the framing,
 *   • the procedural fallback composes identically to the real model,
 *   • a camera tweak in `config/scenes.js` reads like direction, not geometry.
 *
 * All values are in world space, with the ground plane at y = 0 and the machine's
 * footprint centred on the x/z origin (the rig applies that transform).
 *
 * The defaults below are the assembled `cyberpunk_laptop.glb`: base 2.04 × 1.48,
 * hinge at z = 0.82, display opening to y ≈ 1.45. `measureAnchors()` replaces
 * them with values read from the loaded model's bounding boxes.
 */

export const defaultAnchors = {
  /** Centre of the machine's footprint, at half its closed height. */
  machine: [0, 0.42, 0],
  /** Centre of the base (the chassis), a little above the desk. */
  base: [0, 0.09, 0.02],
  /** Middle of the keyboard deck. */
  deck: [0, 0.18, 0.02],
  /** The hinge line. */
  hinge: [0, 0.112, -0.785],
  /** Centre of the main display, in its open position. */
  screen: [-0.3, 0.83, -0.97],
  /** Top edge of the main display. */
  screenTop: [-0.3, 1.45, -1.17],
  /** Centre of the secondary panel. */
  status: [-0.36, 0.8, -0.55],
  /** Top of the machine when the lid is shut. */
  closed: [0, 0.36, 0],
}

/**
 * Measure the same landmarks from an assembled rig.
 *
 * @param {THREE.Object3D} base  the chassis group
 * @param {THREE.Object3D} lid   the lid group, already at rest (open) position
 * @param {{main?: THREE.Mesh, status?: THREE.Mesh}} screenMeshes
 * @returns {typeof defaultAnchors}
 */
export function measureAnchors({ base, lid, screenMeshes = {} }, THREE) {
  if (!base || !THREE) return defaultAnchors

  const box = new THREE.Box3()
  const size = new THREE.Vector3()
  const centre = new THREE.Vector3()

  base.updateWorldMatrix(true, true)
  box.setFromObject(base)
  box.getSize(size)
  box.getCenter(centre)

  const baseAnchors = {
    base: [centre.x, centre.y, centre.z],
    deck: [centre.x, box.max.y - size.y * 0.22, centre.z + size.z * 0.05],
    machine: [centre.x, centre.y + size.y * 1.6, centre.z],
    closed: [centre.x, box.max.y + size.y * 1.5, centre.z],
  }

  let hingeAnchor = defaultAnchors.hinge
  let screenAnchor = defaultAnchors.screen
  let screenTopAnchor = defaultAnchors.screenTop
  let statusAnchor = defaultAnchors.status

  if (lid) {
    lid.updateWorldMatrix(true, true)
    const lidBox = new THREE.Box3().setFromObject(lid)
    const lidCentre = lidBox.getCenter(new THREE.Vector3())
    hingeAnchor = [lidCentre.x, box.max.y, lidBox.min.z]
  }

  if (screenMeshes.main) {
    const screenBox = new THREE.Box3().setFromObject(screenMeshes.main)
    const screenCentre = screenBox.getCenter(new THREE.Vector3())
    screenAnchor = [screenCentre.x, screenCentre.y, screenCentre.z]
    screenTopAnchor = [screenCentre.x, screenBox.max.y, screenCentre.z]
  }

  if (screenMeshes.status) {
    const statusBox = new THREE.Box3().setFromObject(screenMeshes.status)
    const statusCentre = statusBox.getCenter(new THREE.Vector3())
    statusAnchor = [statusCentre.x, statusCentre.y, statusCentre.z]
  }

  return {
    ...defaultAnchors,
    ...baseAnchors,
    hinge: hingeAnchor,
    screen: screenAnchor,
    screenTop: screenTopAnchor,
    status: statusAnchor,
  }
}

export const applyAnchor = (anchors, name, offset = [0, 0, 0]) => {
  const anchor = anchors[name] || defaultAnchors[name] || defaultAnchors.machine
  return [anchor[0] + offset[0], anchor[1] + offset[1], anchor[2] + offset[2]]
}

export default defaultAnchors
