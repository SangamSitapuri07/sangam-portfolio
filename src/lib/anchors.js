/**
 * Scene anchors.
 *
 * The camera never hard-codes a position in model space. It aims at named anchors
 * — "the display", "the keyboard deck", "the machine" — which are measured from
 * whatever laptop is on screen (the scanned model, or the procedural stand-in).
 * So swapping or re-exporting the .glb cannot break the framing, a camera value in
 * `config/scenes.js` reads like direction rather than geometry, and the fallback
 * composes exactly like the real thing.
 *
 * All values are in **machine-local space**: the machine is centred on X and Z and
 * stands on y = 0 (the rig applies that transform), and it faces +Z — the
 * visitor's side. The director transforms these by the machine's live matrix each
 * frame, which is what keeps the camera aimed while the storyboard rotates the
 * machine.
 *
 * The defaults below are the assembled `cyberpunk_laptop.glb`: a base 2.04 wide,
 * a display 1.25 × 1.26 standing at the back, its top at y ≈ 1.46.
 */

/* Relative, with extension: the content gate imports this module in plain Node. */
import { hinge as hingeConfig } from '../config/laptop.js'

export const defaultAnchors = {
  /** Middle of the machine, between the deck and the display. */
  machine: [0, 0.62, -0.22],
  /** Centre of the base (the chassis), just above the desk. */
  base: [0, 0.06, 0.02],
  /** Middle of the keyboard deck, a little toward the visitor. */
  deck: [0, 0.09, 0.07],
  /** The hinge line. */
  hinge: [hingeConfig.x, hingeConfig.y, hingeConfig.z],
  /** Centre of the main display, in its open position. */
  screen: [0.3, 0.83, -0.86],
  /** Top edge of the main display. */
  screenTop: [0.3, 1.46, -0.86],
  /** Centre of the secondary panel (left of the display). */
  status: [-0.64, 0.64, -0.82],
  /** The lid's outer cover, used when the machine is shut. */
  closed: [0, 0.16, -0.02],
  /** Top of the shut machine. */
  lidTop: [0, 0.2, -0.3],
}

/**
 * Measure the same landmarks from an assembled rig (machine at identity, lid at
 * its open rest pose).
 *
 * @param {{base: THREE.Object3D, lid: THREE.Object3D, screenMeshes?: object}} rig
 * @param {typeof import('three')} THREE
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
    deck: [centre.x, box.max.y - size.y * 0.18, centre.z + size.z * 0.12],
    closed: [centre.x, box.max.y + size.y * 0.4, centre.z],
  }

  const measured = { ...defaultAnchors, ...baseAnchors }

  if (lid) {
    lid.updateWorldMatrix(true, true)
    const lidBox = new THREE.Box3().setFromObject(lid)
    const lidCentre = lidBox.getCenter(new THREE.Vector3())
    const machineBox = new THREE.Box3().union(box).union(lidBox)
    const machineCentre = machineBox.getCenter(new THREE.Vector3())
    measured.machine = [machineCentre.x, machineCentre.y, machineCentre.z]
    measured.lidTop = [lidCentre.x, lidBox.max.y, lidCentre.z]
  }

  if (screenMeshes.main) {
    const screenBox = new THREE.Box3().setFromObject(screenMeshes.main)
    const screenCentre = screenBox.getCenter(new THREE.Vector3())
    measured.screen = [screenCentre.x, screenCentre.y, screenCentre.z]
    measured.screenTop = [screenCentre.x, screenBox.max.y, screenCentre.z]
  }

  if (screenMeshes.status) {
    const statusBox = new THREE.Box3().setFromObject(screenMeshes.status)
    const statusCentre = statusBox.getCenter(new THREE.Vector3())
    measured.status = [statusCentre.x, statusCentre.y, statusCentre.z]
  }

  return measured
}

export const applyAnchor = (anchors, name, offset = [0, 0, 0]) => {
  const anchor = anchors[name] || defaultAnchors[name] || defaultAnchors.machine
  return [anchor[0] + offset[0], anchor[1] + offset[1], anchor[2] + offset[2]]
}

export default defaultAnchors
