/**
 * Turning the scanned laptop into a rig.
 *
 * The asset is a sculpt, not a rig: base and lid are not separate parents, so the
 * machine is disassembled mesh-by-mesh and re-parented onto a real hinge pivot.
 * This module owns that surgery so no component has to know about node names,
 * UV windows or material quirks.
 *
 * What it does:
 *   1. splits the imported scene into `base` and `lid` groups (explicit node
 *      names from `config/laptop.js`, with a geometric fallback),
 *   2. re-parents the lid onto a pivot placed on the hinge axis,
 *   3. finds the two emissive display panels and normalises their atlas UV
 *      sub-windows to 0…1 so a full-bleed canvas texture fits exactly,
 *   4. tunes materials for the studio lighting (env intensity, emissive strength),
 *   5. adds a hairline glass sheet in front of the display, and
 *   6. centres/grounds the whole machine so anchors read cleanly.
 */

import * as THREE from 'three'

import { parts, autoSplit, hinge, screens as screenConfig, glass } from '@/config/laptop'
import { measureAnchors } from '@/lib/anchors'

const DEG = Math.PI / 180

const lidNames = new Set(parts.lid)
const baseNames = new Set(parts.base)

/** Meshes whose bounding box extends past the base cannot be part of the base. */
function looksLikeLid(mesh, baseLimit) {
  if (!autoSplit.enabled) return false
  const box = new THREE.Box3().setFromObject(mesh)
  return box.max.z > baseLimit
}

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
    clone.setXY(
      i,
      padding + u * (1 - padding * 2),
      padding + v * (1 - padding * 2)
    )
  }
  clone.needsUpdate = true
  geometry.setAttribute('uv', clone)
  return true
}

/** Tune one material for the dark studio environment. */
function prepareMaterial(material, { quality }) {
  if (!material) return
  material.envMapIntensity = 1.15

  // Drei's Environment supplies the reflections; a little roughness shaping keeps
  // the sculpt's brushed metal from looking flat under the rim lights.
  if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
    if (material.metalness > 0.7) material.roughness = Math.max(material.roughness, 0.22)
    if (material.map) material.map.anisotropy = quality?.id === 'low' ? 2 : 8
  }
  material.needsUpdate = true
}

/**
 * Convert the screen panel material into a live display driven by a texture we
 * supply later (`Laptop.jsx` swaps textures per scene).
 */
function prepareScreenMaterial(material, { intensity }) {
  if (!material) return null
  const original = {
    map: material.map || null,
    emissiveMap: material.emissiveMap || null,
    emissiveIntensity: material.emissiveIntensity ?? 1,
    color: material.color?.clone(),
    emissive: material.emissive?.clone(),
  }

  material.map = null
  material.emissiveMap = null
  material.color = new THREE.Color('#ffffff')
  if (material.emissive) material.emissive = new THREE.Color('#ffffff')
  material.emissiveIntensity = intensity
  material.metalness = 0
  material.roughness = 0.34
  material.toneMapped = true
  // The scan's panel winding is not uniform across its screens: double-siding
  // makes the display readable no matter which way a re-export faces it.
  material.side = THREE.DoubleSide
  material.needsUpdate = true

  return original
}

/**
 * Assemble a rig from an imported glTF scene.
 *
 * @returns {{
 *   machine: THREE.Group, base: THREE.Group, lid: THREE.Group, pivot: THREE.Group,
 *   screens: { main: THREE.Mesh|null, status: THREE.Mesh|null },
 *   originalScreenMaterials: object,
 *   anchors: object,
 *   bounds: { base: THREE.Box3, machine: THREE.Box3 },
 *   lift: number,
 *   dispose: () => void
 * }}
 */
export function assembleLaptop(source, { quality } = {}) {
  /* Clone first: the loader caches one parse, and re-parenting meshes out of the
   * cached scene would corrupt any later mount (HMR, route remount, strict mode).
   * Geometry and textures stay shared; only the two screen materials are cloned
   * because this rig rewrites them. */
  const scene = source.clone(true)

  const base = new THREE.Group()
  base.name = 'laptop-base'
  const lid = new THREE.Group()
  lid.name = 'laptop-lid'
  const pivot = new THREE.Group()
  pivot.name = 'laptop-hinge'
  pivot.position.set(hinge.x, hinge.y, hinge.z)
  pivot.add(lid)

  /* ---- 1. Collect and split meshes ---- */
  const collected = []
  scene.updateMatrixWorld(true)

  // The base's own z extent is the limit above which a mesh must belong to the lid.
  const sceneBox = new THREE.Box3().setFromObject(scene)
  const baseLimit = hinge.z + 0.06

  scene.traverse((child) => {
    if (!child.isMesh) return
    child.castShadow = false
    child.receiveShadow = false
    collected.push(child)
  })

  for (const mesh of collected) {
    const name = mesh.name || mesh.parent?.name || ''
    let target
    if (lidNames.has(name)) target = lid
    else if (baseNames.has(name)) target = base
    else target = looksLikeLid(mesh, baseLimit) ? lid : base

    if (import.meta.env?.DEV && !lidNames.has(name) && !baseNames.has(name)) {
      console.warn(
        `[laptop] "${name}" was not in the part map — assigned to ${target === lid ? 'lid' : 'base'} by geometry. ` +
          'Add it to config/laptop.js parts to remove the guess.'
      )
    }
    mesh.matrixAutoUpdate = true
    target.add(mesh)
  }

  /* ---- 2. Screens: normalise UVs and swap in placeholder-free materials ---- */
  const screenMeshes = { main: null, status: null }
  const originalScreenMaterials = {}

  const findByName = (group, name) => {
    let found = null
    group.traverse((child) => {
      if (found) return
      if (child.isMesh && (child.name === name || child.parent?.name === name)) found = child
    })
    return found
  }

  /* Screens are located by NODE name, because GLTFLoader names the Object3D after
     the glTF node — in this asset the display panels are nodes "Object_24" and
     "Object_25" while their meshes are named "Object_19" / "Object_20", and other
     nodes carry those same numbers. So the mesh names are deliberately NOT used as
     a fallback; if a re-export renames the nodes, the emissive signature decides:
     the display panes are the only light-emitting surfaces on the lid. */
  const findEmissive = (group) => {
    const found = []
    group.traverse((child) => {
      if (!child.isMesh) return
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      const strength = Math.max(
        0,
        ...materials.map((material) => (material?.emissiveMap || material?.emissive ? material.emissiveIntensity ?? 0 : 0))
      )
      if (strength > 0) found.push({ mesh: child, strength })
    })
    return found.sort((a, b) => b.strength - a.strength).map((entry) => entry.mesh)
  }

  const emissiveScreens = findEmissive(lid)
  const mainMesh = findByName(lid, screenConfig.main.node) || emissiveScreens[0] || null
  const statusMesh = findByName(lid, screenConfig.status.node) || emissiveScreens[1] || null

  for (const [key, mesh] of [
    ['main', mainMesh],
    ['status', statusMesh],
  ]) {
    if (!mesh) continue
    // The display panes are tiny (a handful of quads), so give the rig its own
    // copy before rewriting UVs — the cached glTF geometry is never mutated.
    mesh.geometry = mesh.geometry.clone()
    normaliseScreenUv(mesh, key === 'main' ? 0.002 : 0.004)
    // Likewise the material, which this rig rewrites into a live display.
    const original = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    const material = original?.clone?.() || original
    mesh.material = material
    screenMeshes[key] = mesh
    originalScreenMaterials[key] = prepareScreenMaterial(material, {
      intensity: screenConfig[key].intensity,
    })
  }

  /* ---- 3. Everything else: lighting-friendly materials ---- */
  scene.traverse((child) => {
    if (!child.isMesh) return
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material) => prepareMaterial(material, { quality }))
  })

  // Only the chassis interacts with the contact shadow.
  for (const mesh of [...base.children, ...lid.children]) {
    if (!mesh.isMesh) continue
    mesh.castShadow = false
    mesh.receiveShadow = true
  }

  /* ---- 4. Glass sheet over the display ---- */
  let glassMesh = null
  if (glass.enabled && quality?.glassOverlay && screenMeshes.main) {
    const box = new THREE.Box3().setFromObject(screenMeshes.main)
    const size = box.getSize(new THREE.Vector3())
    const centre = box.getCenter(new THREE.Vector3())
    const geometry = new THREE.PlaneGeometry(size.x * 0.998, size.z * 0.998)
    const material = new THREE.MeshPhysicalMaterial({
      color: '#8fb6ff',
      roughness: glass.roughness,
      metalness: 0,
      transparent: true,
      opacity: glass.opacity,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    glassMesh = new THREE.Mesh(geometry, material)
    glassMesh.name = 'laptop-screen-glass'
    glassMesh.rotation.x = -Math.PI / 2
    glassMesh.position.set(centre.x, box.max.y + glass.offset * size.z, centre.z)
    glassMesh.renderOrder = 2
    lid.add(glassMesh)
  }

  /* ---- 5. Assembled machine: flip to face +Z, centre the footprint, ground it ---- */
  const machine = new THREE.Group()
  machine.name = 'laptop-machine'
  const flip = new THREE.Group()
  flip.rotation.y = Math.PI
  flip.add(base)
  flip.add(pivot)
  machine.add(flip)

  const baseBox = new THREE.Box3().setFromObject(base)
  const baseCentre = baseBox.getCenter(new THREE.Vector3())
  machine.position.set(-baseCentre.x, -baseBox.min.y, -baseCentre.z)

  machine.updateMatrixWorld(true)

  /* ---- 6. How far the shut lid must lift to rest on the deck ----
     Rather than deriving the lift from boxes measured in two different spaces,
     fold the lid shut with no lift, measure how far it ends up below the deck,
     and raise it by exactly that much. Self-correcting and sign-proof: the shut
     laptop always sits ON the deck, never through it and never floating. */
  pivot.position.y = hinge.y
  pivot.rotation.x = hinge.closedAngle * DEG
  machine.updateMatrixWorld(true)

  const shutLidBox = new THREE.Box3().setFromObject(lid)
  const deckTop = new THREE.Box3().setFromObject(base).max.y
  const lift = hinge.closedLift ?? Math.max(0, deckTop - shutLidBox.min.y)

  /* ---- 7. Measure anchors with the lid at its open rest pose ---- */
  pivot.rotation.x = hinge.openAngle * DEG
  machine.updateMatrixWorld(true)
  const anchors = measureAnchors({ base, lid, screenMeshes }, THREE)

  // Restore the rig to a predictable closed pose; the animation system owns it.
  pivot.rotation.x = hinge.closedAngle * DEG
  machine.updateMatrixWorld(true)

  const bounds = {
    base: baseBox,
    machine: new THREE.Box3().setFromObject(machine),
  }

  /**
   * Release only what this rig owns (the screen panes and the glass sheet).
   * Geometries and textures still shared with the loader's cache are left alone.
   */
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

  return {
    machine,
    base,
    lid,
    pivot,
    screens: screenMeshes,
    originalScreenMaterials,
    anchors,
    bounds,
    lift,
    size: sceneBox.getSize(new THREE.Vector3()),
    /** Pose the hinge for an opening fraction (0 = shut, 1 = fully open). */
    applyLid: (open) => applyLidPose({ pivot, lift, liftSettle: hinge.liftSettle }, open),
    dispose,
  }
}

/** Apply the hinge pose for a given opening fraction (0 = shut, 1 = open). */
export function applyLidPose({ pivot, lift = 0, liftSettle = 0.55 }, open, out = {}) {
  const t = Math.max(0, Math.min(1, open))
  pivot.rotation.x = (hinge.closedAngle + (hinge.openAngle - hinge.closedAngle) * t) * DEG

  // A real barrel hinge lifts the cover clear of the keys while it shuts. The lift
  // settles early in the arc so the machine "seats" as it opens.
  const settle = Math.min(1, t / Math.max(liftSettle, 1e-4))
  const liftNow = lift * (1 - settle)
  pivot.position.y = hinge.y + liftNow
  out.lift = liftNow
  return out
}

export default assembleLaptop
