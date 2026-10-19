/**
 * The procedural stand-in.
 *
 * Used while the scanned model streams in, and permanently if it is missing or
 * fails to parse — so the stage is never empty and the film never depends on one
 * file arriving.
 *
 * It is built to the **same conventions** as the real rig (`lib/modelParts.js`):
 *
 *   • machine-local space, centred on X/Z and standing on y = 0,
 *   • facing +Z — the visitor's side,
 *   • the lid hinged on the base's back edge (`hinge` in `config/laptop.js`),
 *     authored standing at `openAngle` and folded forward to `closedAngle`,
 *   • the display the same size and aspect as the model's (1.25 × 1.26), so the
 *     canvas screen textures drop in unchanged,
 *   • the same rig interface, including the `rest` transforms the exploded view
 *     needs.
 *
 * Result: identical framing, identical hinge maths, zero special cases downstream.
 */

import * as THREE from 'three'

import { hinge, screens as screenConfig, laptopModel } from '@/config/laptop'
import { measureAnchors } from '@/lib/anchors'

const DEG = Math.PI / 180

/** A believable keyboard and trackpad drawn to a canvas — one draw call. */
function createDeckTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 700
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#0b0e14'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const rows = 5
  const cols = 14
  const padX = canvas.width * 0.075
  const padY = canvas.height * 0.1
  const gridW = canvas.width - padX * 2
  const gridH = canvas.height * 0.48
  const keyW = (gridW / cols) * 0.86
  const keyH = (gridH / rows) * 0.78
  const gapX = gridW / cols
  const gapY = gridH / rows

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = padX + col * gapX + (gapX - keyW) / 2
      const y = padY + row * gapY + (gapY - keyH) / 2
      ctx.fillStyle = '#161b26'
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(x, y, keyW, keyH, 6)
      else ctx.rect(x, y, keyW, keyH)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx.lineWidth = 1
      ctx.stroke()
      // A whisper of backlight under the keycaps.
      ctx.fillStyle = 'rgba(75,140,255,0.12)'
      ctx.fillRect(x + 3, y + keyH - 3, keyW - 6, 2)
    }
  }

  // Trackpad
  const tpW = canvas.width * 0.32
  const tpH = canvas.height * 0.16
  ctx.fillStyle = '#10141d'
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(canvas.width / 2 - tpW / 2, canvas.height * 0.68, tpW, tpH, 10)
  else ctx.rect(canvas.width / 2 - tpW / 2, canvas.height * 0.68, tpW, tpH)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'
  ctx.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/**
 * Build the stand-in rig. Returns the same shape as `assembleLaptop()`.
 */
export function buildProceduralLaptop({ quality } = {}) {
  const width = 2.04
  const depth = 1.48
  const baseHeight = 0.18
  const lidThickness = 0.07
  const lidHeight = 1.42
  const displayWidth = screenConfig.main.width
  const displayHeight = screenConfig.main.height

  const materials = {
    shell: new THREE.MeshStandardMaterial({
      color: '#0c0f15',
      metalness: 0.86,
      roughness: 0.34,
      envMapIntensity: 1.2,
    }),
    bezel: new THREE.MeshStandardMaterial({
      color: '#05070a',
      metalness: 0.2,
      roughness: 0.7,
    }),
    accent: new THREE.MeshStandardMaterial({
      color: '#2f6fe0',
      emissive: new THREE.Color('#1b4fa8'),
      emissiveIntensity: 0.6,
      metalness: 0.6,
      roughness: 0.3,
      envMapIntensity: 1.4,
    }),
  }

  const deckTexture = createDeckTexture()
  const deckMaterial = new THREE.MeshStandardMaterial({
    map: deckTexture,
    emissiveMap: deckTexture,
    emissive: new THREE.Color('#5f8fd8'),
    emissiveIntensity: 0.16,
    metalness: 0.4,
    roughness: 0.55,
    envMapIntensity: 0.9,
  })

  const machine = new THREE.Group()
  machine.name = 'procedural-machine'

  /* ---- Base: chassis standing on y = 0, hinge edge at −Z ---- */
  const base = new THREE.Group()
  base.name = 'laptop-base'

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(width, baseHeight, depth), materials.shell)
  chassis.position.set(0, baseHeight / 2, 0)
  base.add(chassis)

  const deck = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.94, depth * 0.9), deckMaterial)
  deck.rotation.x = -Math.PI / 2
  deck.position.set(0, baseHeight + 0.001, 0.02)
  deck.name = 'procedural-deck'
  base.add(deck)

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, width * 0.98, 20, 1, false, 0, Math.PI),
    materials.shell
  )
  barrel.rotation.z = Math.PI / 2
  barrel.position.set(hinge.x, hinge.y, hinge.z)
  base.add(barrel)

  const strip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, 0.012, 0.02), materials.accent)
  strip.position.set(0, baseHeight * 0.72, depth / 2 - 0.005)
  base.add(strip)

  const footGeometry = new THREE.CylinderGeometry(0.035, 0.04, 0.02, 10)
  const footMaterial = new THREE.MeshStandardMaterial({ color: '#05070b', roughness: 0.9 })
  ;[
    [-width / 2 + 0.16, -depth / 2 + 0.14],
    [width / 2 - 0.16, -depth / 2 + 0.14],
    [-width / 2 + 0.16, depth / 2 - 0.16],
    [width / 2 - 0.16, depth / 2 - 0.16],
  ].forEach(([x, z]) => {
    const foot = new THREE.Mesh(footGeometry, footMaterial)
    foot.position.set(x, 0.005, z)
    base.add(foot)
  })

  machine.add(base)

  /* ---- Lid: standing, hinge axis at its bottom edge, display facing +Z ---- */
  const pivot = new THREE.Group()
  pivot.name = 'laptop-hinge'
  pivot.position.set(hinge.x, hinge.y, hinge.z)
  machine.add(pivot)

  const lid = new THREE.Group()
  lid.name = 'laptop-lid'
  pivot.add(lid)

  const lift = 0.03
  const lidShell = new THREE.Mesh(
    new THREE.BoxGeometry(width, lidHeight, lidThickness),
    materials.shell
  )
  lidShell.position.set(0, lift + lidHeight / 2, 0)
  lid.add(lidShell)

  const bezel = new THREE.Mesh(
    new THREE.PlaneGeometry(displayWidth + 0.1, displayHeight + 0.1),
    materials.bezel
  )
  bezel.position.set(0, lift + lidHeight * 0.48, lidThickness / 2 + 0.0015)
  lid.add(bezel)

  const makeScreenMaterial = (intensity) =>
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: intensity,
      metalness: 0,
      roughness: 0.34,
      toneMapped: true,
      side: THREE.DoubleSide,
    })

  const mainScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(displayWidth, displayHeight),
    makeScreenMaterial(screenConfig.main.intensity)
  )
  mainScreen.position.set(0, lift + lidHeight * 0.48, lidThickness / 2 + 0.004)
  mainScreen.name = screenConfig.main.node
  mainScreen.userData.screen = 'main'
  lid.add(mainScreen)

  const statusScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(screenConfig.status.width, screenConfig.status.height),
    makeScreenMaterial(screenConfig.status.intensity)
  )
  statusScreen.position.set(
    -width * 0.3,
    lift + lidHeight * 0.52,
    lidThickness / 2 + 0.004
  )
  statusScreen.name = screenConfig.status.node
  statusScreen.userData.screen = 'status'
  statusScreen.visible = Boolean(quality?.statusPanel)
  lid.add(statusScreen)

  /* ---- Centre the footprint, drop onto the ground ---- */
  machine.updateMatrixWorld(true)
  const baseBox = new THREE.Box3().setFromObject(base)
  const centre = baseBox.getCenter(new THREE.Vector3())
  machine.position.set(-centre.x, -baseBox.min.y, -centre.z)
  machine.updateMatrixWorld(true)

  const applyLid = (open) => {
    const t = Math.max(0, Math.min(1, open))
    pivot.rotation.x = (hinge.closedAngle + (hinge.openAngle - hinge.closedAngle) * t) * DEG
    const settle = Math.min(1, t / Math.max(hinge.liftSettle, 1e-4))
    pivot.position.y = hinge.y + lift * (1 - settle)
  }

  pivot.rotation.x = hinge.openAngle * DEG
  machine.updateMatrixWorld(true)
  const anchors = measureAnchors({ base, lid, screenMeshes: { main: mainScreen, status: statusScreen } }, THREE)

  pivot.rotation.x = hinge.closedAngle * DEG
  applyLid(0)
  machine.updateMatrixWorld(true)

  const rest = new Map()
  machine.traverse((child) => {
    if (!child.isMesh) return
    rest.set(child, {
      position: child.position.clone(),
      quaternion: child.quaternion.clone(),
      scale: child.scale.clone(),
    })
  })

  const bindTexture = (mesh, texture) => {
    if (!mesh || !texture) return
    mesh.material.map = texture
    mesh.material.emissiveMap = texture
    mesh.material.needsUpdate = true
  }

  const dispose = () => {
    machine.traverse((child) => {
      if (!child.isMesh) return
      child.geometry?.dispose?.()
      const list = Array.isArray(child.material) ? child.material : [child.material]
      list.forEach((material) => {
        if (!material) return
        material.map?.dispose?.()
        material.dispose?.()
      })
    })
    deckTexture.dispose()
  }

  return {
    machine,
    base,
    lid,
    pivot,
    screens: { main: mainScreen, status: statusScreen },
    rest,
    anchors,
    lift,
    procedural: true,
    applyLid,
    setScreenTextures: ({ main, status } = {}) => {
      bindTexture(mainScreen, main)
      bindTexture(statusScreen, status)
    },
    screenMaterials: { main: mainScreen.material, status: statusScreen.material },
    dispose,
  }
}

export default buildProceduralLaptop
export { laptopModel }
