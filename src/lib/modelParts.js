/**
 * Turning the scanned laptop into a rig.
 *
 * The asset is a sculpt, not a rig. It ships as two sibling groups — the base
 * (`Cube_0`) and the lid (`Cube001_3`) — with no hinge, no pivot and no separate
 * internal components. This module does the surgery so no component has to know
 * about node names, UV windows or material quirks:
 *
 *   1. splits the imported scene into `base` and `lid` by group (with mesh-name
 *      and geometric fallbacks), preserving every mesh's world transform,
 *   2. re-parents the lid onto a pivot placed on the real hinge axis (the base's
 *      back edge), so the lid opens and closes like a lid,
 *   3. finds the two emissive display panels and normalises their atlas UV
 *      sub-windows to 0…1 so a full-bleed canvas texture fits exactly,
 *   4. tunes materials for the studio lighting,
 *   5. adds a hairline glass sheet in front of the display,
 *   6. centres and grounds the machine, and
 *   7. hands back the rest transforms of every mesh, which is what lets the
 *      exploded view in Scene 03 be reversed exactly in Scene 07.
 */

import * as THREE from 'three'

import { parts, autoSplit, hinge, screens as screenConfig, glass } from '@/config/laptop'
import { measureAnchors } from '@/lib/anchors'

const DEG = Math.PI / 180

const lidNames = new Set(parts.lid)
const baseNames = new Set(parts.base)
const lidGroups = new Set(parts.groups.lid)
const baseGroups = new Set(parts.groups.base)

/**
 * Rewrite a geometry's UVs so their previous bounding window becomes 0…1.
 * The display panels share an artist atlas; this stretches our interface across
 * the physical pane without touching vertex positions.
 */
export function normaliseScreenUv(mesh, padding = 0) {
  const geometry = mesh.geometry
  const uv = geometry?.attributes?.uv
  if (!uv) return false

  let minU = Infinity
  let maxU = -Infinity
  let minV = Infinity
  let maxV = -Infinity

  for (let i = 0; i < uv.count; i += 1) {
    const u = uv.getX(i)
    const v = uv.getY(i)
    if (u < minU) minU = u
    if (u > maxU) maxU = u
    if (v < minV) minV = v
    if (v > maxV) maxV = v
  }

  const spanU = Math.max(maxU - minU, 1e-6)
  const spanV = Math.max(maxV - minV, 1e-6)
  const clone = uv.clone()
  for (let i = 0; i < clone.count; i += 1) {
    const u = (uv.getX(i) - minU) / spanU
    const v = (uv.getY(i) - minV) / spanV
    clone.setXY(i, padding + u * (1 - padding * 2), padding + v * (1 - padding * 2))
  }
  clone.needsUpdate = true
  geometry.setAttribute('uv', clone)
  return true
}

/** Tune one material for the dark studio environment. */
function prepareMaterial(material, { quality } = {}) {
  if (!material) return
  material.envMapIntensity = 1.1

  if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
    // Brushed metal reads flat under rim light without a little roughness shape.
    if (material.metalness > 0.7) material.roughness = Math.max(material.roughness, 0.24)
    if (material.map) material.map.anisotropy = quality?.id === 'low' ? 2 : 8
  }
  material.needsUpdate = true
}

/**
 * Convert a screen panel material into a live display. The rig supplies the
 * texture later (`setScreenTextures`), because the interface is painted per scene.
 */
function prepareScreenMaterial(material, { intensity }) {
  if (!material) return null

  material.map = null
  material.emissiveMap = null
  material.color = new THREE.Color('#ffffff')
  if (material.emissive) material.emissive = new THREE.Color('#ffffff')
  material.emissiveIntensity = intensity
  material.metalness = 0
  material.roughness = 0.32
  material.toneMapped = true
  /* The scan's panel winding is inverted relative to its outward face (verified
     by raycasting the real asset from +Z), so the display is double-sided. */
  material.side = THREE.DoubleSide
  material.needsUpdate = true
  return material
}

/** Half of the model a mesh belongs to, or null if it cannot be decided. */
function halfOf(mesh) {
  let node = mesh
  while (node) {
    if (lidGroups.has(node.name)) return 'lid'
    if (baseGroups.has(node.name)) return 'base'
    node = node.parent
  }

  const name = mesh.name
  if (lidNames.has(name)) return 'lid'
  if (baseNames.has(name)) return 'base'

  if (autoSplit.enabled) {
    const box = new THREE.Box3().setFromObject(mesh)
    return box.min.z < autoSplit.baseLimitZ ? 'lid' : 'base'
  }
  return null
}

/**
 * Assemble a rig from an imported glTF scene.
 *
 * All returned geometry is in **machine-local space**: the machine is centred on
 * X and Z, stands on y = 0, and faces +Z (the visitor's side). The storyboard
 * rotates and positions `machine` from there.
 */
export function assembleLaptop(source, { quality } = {}) {
  /* Clone first: the loader caches one parse, and re-parenting meshes out of the
   * cached scene would corrupt any later mount (HMR, remount, strict mode).
   * Geometry and textures stay shared; only the screen materials and the screen
   * geometry are cloned, because this rig rewrites them. */
  const scene = source.clone(true)
  scene.updateMatrixWorld(true)

  const machine = new THREE.Group()
  machine.name = 'laptop-machine'

  const base = new THREE.Group()
  base.name = 'laptop-base'
  machine.add(base)

  const pivot = new THREE.Group()
  pivot.name = 'laptop-hinge'
  pivot.position.set(hinge.x, hinge.y, hinge.z)
  machine.add(pivot)

  const lid = new THREE.Group()
  lid.name = 'laptop-lid'
  pivot.add(lid)

  /* ---- 1. Split, preserving every world transform ---- */
  const collected = []
  scene.traverse((child) => {
    if (!child.isMesh) return
    child.castShadow = false
    child.receiveShadow = true
    collected.push(child)
  })

  const split = { base: [], lid: [] }
  for (const mesh of collected) {
    const half = halfOf(mesh) || 'base'
    if (half === 'lid') {
      lid.attach(mesh)
      split.lid.push(mesh.name)
    } else {
      base.attach(mesh)
      split.base.push(mesh.name)
    }
    if (import.meta.env?.DEV && !lidNames.has(mesh.name) && !baseNames.has(mesh.name)) {
      console.warn(`[laptop] "${mesh.name}" was not in the part lists — placed by geometry in ${half}.`)
    }
  }

  /* ---- 2. Screens: find, normalise UVs, swap in live materials ---- */
  const findByName = (group, name) => {
    let found = null
    group.traverse((child) => {
      if (found) return
      if (child.isMesh && (child.name === name || child.parent?.name === name)) found = child
    })
    return found
  }

  const emissiveScore = (mesh) => {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    return Math.max(
      0,
      ...materials.map((material) =>
        material?.emissiveMap || (material?.emissive && material.emissive.getHex() !== 0)
          ? material.emissiveIntensity ?? 1
          : 0
      )
    )
  }

  const emissivePanels = []
  lid.traverse((child) => {
    if (!child.isMesh) return
    const score = emissiveScore(child)
    if (score > 0) emissivePanels.push({ mesh: child, score })
  })
  emissivePanels.sort((a, b) => b.score - a.score)

  const screenMeshes = {
    main: findByName(lid, screenConfig.main.node) || emissivePanels[0]?.mesh || null,
    status: findByName(lid, screenConfig.status.node) || emissivePanels[1]?.mesh || null,
  }

  for (const [key, mesh] of Object.entries(screenMeshes)) {
    if (!mesh) continue
    // The panes are a handful of quads: give the rig its own geometry and
    // material so the loader's cache is never mutated.
    mesh.geometry = mesh.geometry.clone()
    normaliseScreenUv(mesh, key === 'main' ? 0.003 : 0.006)
    const original = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    mesh.material = original?.clone?.() || original
    prepareScreenMaterial(mesh.material, { intensity: screenConfig[key].intensity })
  }

  /* ---- 3. Everything else: lighting-friendly materials ---- */
  machine.traverse((child) => {
    if (!child.isMesh) return
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material) => prepareMaterial(material, { quality }))
  })

  /* ---- 4. Glass sheet over the display ----
   * Built in the LID's local space from the display's own vertices, not from an
   * axis-aligned box: the display is a tilted set of quads, and a flat box-aligned
   * plane in front of it would hang out of the bezel and — worse — swallow the
   * screen when seen head-on. Fit the plane the display actually lies in, put the
   * sheet a few millimetres in front of it, and parent it to the lid. */
  let glassMesh = null
  if (glass.enabled && quality?.glassOverlay && screenMeshes.main) {
    const sheet = buildScreenGlass({
      display: screenMeshes.main,
      lid,
      deckCentre: new THREE.Box3().setFromObject(base).getCenter(new THREE.Vector3()),
    })
    if (sheet) {
      glassMesh = sheet
      lid.add(glassMesh)
    }
  }

  /* ---- 5. Pose the lid shut to measure how far it must lift ---- */
  machine.updateMatrixWorld(true)
  const baseBox = new THREE.Box3().setFromObject(base)

  pivot.rotation.x = hinge.closedAngle * DEG
  machine.updateMatrixWorld(true)
  const shutLidBox = new THREE.Box3().setFromObject(lid)
  const deckTop = baseBox.max.y
  const lift = hinge.closedLift ?? Math.max(0, deckTop - shutLidBox.min.y)

  /* ---- 6. Anchors, measured at the open pose in machine-local space ---- */
  pivot.rotation.x = hinge.openAngle * DEG
  machine.updateMatrixWorld(true)
  const anchors = measureAnchors({ base, lid, screenMeshes }, THREE)

  const machineBox = new THREE.Box3().setFromObject(machine)

  /* ---- 7. Centre on X/Z, stand on the floor ---- */
  const centre = baseBox.getCenter(new THREE.Vector3())
  machine.position.set(-centre.x, -baseBox.min.y, -centre.z)
  machine.updateMatrixWorld(true)

  /* ---- 8. Remember every mesh's rest transform (the exploded view's baseline) ---- */
  const rest = new Map()
  machine.traverse((child) => {
    /* Groups matter as much as meshes here: the lid is a group whose transform
       the exploded view also drives, and it has to be restorable. */
    if (!child.isObject3D) return
    rest.set(child, {
      position: child.position.clone(),
      quaternion: child.quaternion.clone(),
      scale: child.scale.clone(),
    })
  })

  /* ---- 9. Screen textures (bound later, once the painter exists) ---- */
  const bindTexture = (mesh, texture) => {
    if (!mesh || !texture) return
    const material = mesh.material
    material.map = texture
    material.emissiveMap = texture
    material.color = new THREE.Color('#ffffff')
    material.emissive = new THREE.Color('#ffffff')
    material.needsUpdate = true
  }

  const setScreenTextures = ({ main, status } = {}) => {
    bindTexture(screenMeshes.main, main)
    bindTexture(screenMeshes.status, status)
  }

  const dispose = () => {
    for (const mesh of Object.values(screenMeshes)) {
      if (!mesh) continue
      mesh.geometry?.dispose?.()
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((material) => material?.dispose?.())
    }
    if (glassMesh) {
      glassMesh.geometry.dispose()
      glassMesh.material.dispose()
    }
  }

  const rig = {
    machine,
    base,
    lid,
    pivot,
    screens: screenMeshes,
    /** Every mesh, with its rest transform — used by the exploded view. */
    rest,
    anchors,
    lift,
    bounds: { base: baseBox, machine: machineBox },
    split,
    glass: glassMesh,
    setScreenTextures,
    /** Pose the hinge for an opening fraction (0 = shut, 1 = open). */
    applyLid: (open) => applyLidPose({ pivot, lift, liftSettle: hinge.liftSettle }, open),
    /** Live screen materials, for anything that wants to tweak brightness. */
    screenMaterials: {
      main: screenMeshes.main?.material || null,
      status: screenMeshes.status?.material || null,
    },
    dispose,
  }

  return rig
}


/**
 * Build a hairline glass sheet that lies in the display's own plane.
 *
 * All measurements are taken in the lid's local space, so the sheet inherits every
 * hinge rotation without any extra maths. The plane's normal is chosen as the
 * signed axis that points from the display toward the keyboard deck — i.e. toward
 * the person sitting in front of the machine — which is what "in front of the
 * screen" means for any lid angle under 45° of lean.
 */
function buildScreenGlass({ display, lid, deckCentre }) {
  if (!display || !lid) return null

  lid.updateWorldMatrix(true, true)
  display.updateWorldMatrix(true, true)

  /* Display vertices, expressed in the lid's own space. */
  const toLid = new THREE.Matrix4().copy(lid.matrixWorld).invert().multiply(display.matrixWorld)
  const position = display.geometry.attributes.position
  const index = display.geometry.index
  const points = []
  const point = new THREE.Vector3()
  for (let i = 0; i < position.count; i += 1) {
    point.fromBufferAttribute(position, i).applyMatrix4(toLid)
    points.push(point.clone())
  }
  if (points.length < 3) return null

  /* Best-fit normal from the first face. The panes are coplanar quads, so any
     face gives the plane; the model's lean (~9.5°) rules out an axis-aligned box. */
  const i0 = index ? index.getX(0) : 0
  const i1 = index ? index.getX(1) : 1
  const i2 = index ? index.getX(2) : 2
  const normal = new THREE.Vector3()
    .subVectors(points[i1], points[i0])
    .cross(new THREE.Vector3().subVectors(points[i2], points[i0]))
    .normalize()
  if (normal.lengthSq() < 0.5) return null

  const centre = new THREE.Vector3()
  for (const p of points) centre.add(p)
  centre.multiplyScalar(1 / points.length)

  /* Outward = the side the keyboard is on: the visitor sits in front of the
     screen, and the deck is between the screen and the visitor. */
  const deckInLid = deckCentre ? lid.worldToLocal(deckCentre.clone()) : new THREE.Vector3(0, 0, -1)
  if (normal.dot(deckInLid.clone().sub(centre)) < 0) normal.negate()

  /* In-plane basis, with the sheet's long side along the panel's height. */
  const up = new THREE.Vector3(0, 1, 0)
  const right = new THREE.Vector3().crossVectors(up, normal)
  if (right.lengthSq() < 1e-6) right.set(1, 0, 0)
  right.normalize()
  const panelUp = new THREE.Vector3().crossVectors(normal, right).normalize()

  let width = 0
  let height = 0
  const local = new THREE.Vector3()
  for (const p of points) {
    local.subVectors(p, centre)
    width = Math.max(width, Math.abs(local.dot(right)) * 2)
    height = Math.max(height, Math.abs(local.dot(panelUp)) * 2)
  }

  const geometry = new THREE.PlaneGeometry(width * 0.997, height * 0.997)
  const material = new THREE.MeshPhysicalMaterial({
    color: '#9dbdff',
    roughness: glass.roughness,
    metalness: 0,
    transparent: true,
    opacity: glass.opacity,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.8,
    side: THREE.DoubleSide,
    depthWrite: false,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = 'laptop-screen-glass'
  mesh.renderOrder = 2
  mesh.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(right, panelUp, normal)
  )
  mesh.position.copy(centre).addScaledVector(normal, glass.offset)
  return mesh
}

/** Apply the hinge pose for a given opening fraction (0 = shut, 1 = open). */
export function applyLidPose({ pivot, lift = 0, liftSettle = 0.5 }, open, out = {}) {
  const t = Math.max(0, Math.min(1, open))
  pivot.rotation.x = (hinge.closedAngle + (hinge.openAngle - hinge.closedAngle) * t) * DEG

  /* A barrel hinge lifts the cover clear of the keys as it shuts. The lift settles
     early in the opening arc, so the machine seats itself as it opens. */
  const settle = Math.min(1, t / Math.max(liftSettle, 1e-4))
  const liftNow = lift * (1 - settle)
  pivot.position.y = hinge.y + liftNow
  out.lift = liftNow
  return out
}

export default assembleLaptop
