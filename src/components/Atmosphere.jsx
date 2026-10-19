import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import { atmosphere as cfg } from '@/config/effects'
import { sceneState } from '@/lib/scrollEngine'

/**
 * Atmosphere — the air around the machine.
 *
 * Three restrained layers, each with its own intensity published by the director
 * (`film.fx`), so a scene can dial the room up or down without any React render:
 *
 *   • sparse dust motes drifting in the volume (Scene 01, 10),
 *   • a faint perspective grid on the floor that fades in around the breakdown,
 *   • circuit filaments that run between the parts while the machine is open.
 *
 * Everything here is deliberately cheap: one `Points` draw call, one textured
 * plane, one line-segment draw call. No per-particle CPU work — the motion is a
 * group rotation and a texture scroll.
 */

function useGridTexture() {
  return useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, size, size)

    /* Two scales of grid: fine cells, and a brighter line every fourth cell. */
    const cell = size / 8
    for (let i = 0; i <= 8; i += 1) {
      const p = i * cell
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(53,231,255,0.30)' : 'rgba(53,231,255,0.10)'
      ctx.lineWidth = i % 4 === 0 ? 2 : 1
      ctx.beginPath()
      ctx.moveTo(p, 0)
      ctx.lineTo(p, size)
      ctx.moveTo(0, p)
      ctx.lineTo(size, p)
      ctx.stroke()
    }

    /* A soft radial falloff so the grid never has a hard edge. */
    const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.5)
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, 4)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
}

/** Dust: a few hundred points in a shallow box around the machine. */
function Dust({ quality, reducedMotion }) {
  const ref = useRef(null)
  const count = quality?.id === 'low' ? cfg.dust.low : quality?.id === 'medium' ? cfg.dust.medium : cfg.dust.high

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    /* A seeded generator, not Math.random: the dust field is part of the
       composition, so it must be identical on every load (and it keeps the render
       pass pure). */
    const random = mulberry32(0x5eed)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (random() - 0.5) * cfg.dust.spread
      positions[i * 3 + 1] = random() * cfg.dust.height
      positions[i * 3 + 2] = (random() - 0.5) * cfg.dust.spread
      sizes[i] = 0.4 + random() * 0.9
    }
    const buffer = new THREE.BufferGeometry()
    buffer.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    buffer.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    return buffer
  }, [count])

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#8fd8ff',
        size: cfg.dust.size,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    const film = sceneState.film
    const target = (film?.fx.particles ?? 0) * cfg.dust.opacity
    material.opacity += (target - material.opacity) * Math.min(1, delta * 3)
    material.visible = material.opacity > 0.004
    if (!ref.current || reducedMotion) return
    ref.current.rotation.y += delta * cfg.dust.drift
  })

  return (
    <points ref={ref} geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />
  )
}

/** The floor grid, revealed as the machine comes apart. */
function Grid({ quality, reducedMotion }) {
  const texture = useGridTexture()
  const meshRef = useRef(null)
  const materialRef = useRef(null)

  useEffect(() => () => texture.dispose(), [texture])

  useFrame((_, delta) => {
    const film = sceneState.film
    const material = materialRef.current
    if (!material) return
    const target = (film?.fx.grid ?? 0) * cfg.grid.opacity
    material.opacity += (target - material.opacity) * Math.min(1, delta * 3)
    material.visible = material.opacity > 0.004
    if (!reducedMotion && quality?.id !== 'low') {
      texture.offset.y -= delta * cfg.grid.scroll
    }
  })

  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2} position-y={cfg.grid.y}>
      <planeGeometry args={[cfg.grid.size, cfg.grid.size]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}

/**
 * Circuit filaments: drawn between the real parts while the machine is open.
 * Anchors are percent positions of the machine's footprint, so the lines always
 * refer to where the parts actually are rather than to a guessed diagram.
 */
function Circuits() {
  const materialRef = useRef(null)
  const groupRef = useRef(null)

  const geometry = useMemo(() => {
    const points = []
    for (const [from, to] of cfg.circuits.links) {
      /* A gentle elbow rather than a straight line — reads as a trace. */
      const mid = [
        (from[0] + to[0]) / 2,
        Math.max(from[1], to[1]) + cfg.circuits.bend,
        (from[2] + to[2]) / 2,
      ]
      points.push(new THREE.Vector3(...from), new THREE.Vector3(...mid))
      points.push(new THREE.Vector3(...mid), new THREE.Vector3(...to))
    }
    const buffer = new THREE.BufferGeometry().setFromPoints(points)
    return buffer
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    const film = sceneState.film
    const material = materialRef.current
    if (!material) return
    const target = (film?.fx.circuits ?? 0) * cfg.circuits.opacity
    material.opacity += (target - material.opacity) * Math.min(1, delta * 3)
    material.visible = material.opacity > 0.004
  })

  return (
    <lineSegments ref={groupRef} geometry={geometry} renderOrder={1}>
      <lineBasicMaterial
        ref={materialRef}
        color={cfg.circuits.color}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  )
}

/** Deterministic pseudo-random numbers, for geometry that must not change. */
const mulberry32 = (seed) => {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function Atmosphere({ quality, reducedMotion }) {
  const gl = useThree((state) => state.gl)

  /* Keep the renderer's clear colour in step with the CSS background, so a resize
     never flashes a different black. */
  useEffect(() => {
    gl.setClearColor('#05060a', 1)
  }, [gl])

  return (
    <group name="atmosphere">
      <Dust quality={quality} reducedMotion={reducedMotion} />
      <Grid quality={quality} reducedMotion={reducedMotion} />
      <Circuits />
    </group>
  )
}
