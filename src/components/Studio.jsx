import { useEffect, useMemo, useRef } from 'react'
import { Environment, Lightformer, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

import { ground } from '@/config/laptop'

/**
 * Studio — the room the machine sits in.
 *
 * A dark studio: almost no ambient fill, two coloured rim lights (cool blue and
 * violet) raking the chassis edges, one soft key, and a procedural environment
 * built from light panels so the brushed metal has something to reflect without
 * downloading an HDR file.
 *
 * Light intensities are driven every frame by the director (see `lib/director.js`)
 * through the refs this component registers.
 */

/** Soft radial pool of light on the floor, so the machine is not floating. */
function useGroundTexture() {
  return useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(120,150,220,0.32)')
    gradient.addColorStop(0.35, 'rgba(70,90,150,0.12)')
    gradient.addColorStop(0.7, 'rgba(20,25,40,0.03)')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
}

export default function Studio({ quality, registerLights }) {
  const ambientRef = useRef(null)
  const keyRef = useRef(null)
  const rimARef = useRef(null)
  const rimBRef = useRef(null)
  const screenFillRef = useRef(null)
  const groundTexture = useGroundTexture()

  useEffect(() => {
    registerLights?.({
      ambient: ambientRef.current,
      key: keyRef.current,
      rimA: rimARef.current,
      rimB: rimBRef.current,
      screenFill: screenFillRef.current,
    })
  }, [registerLights])

  useEffect(() => () => groundTexture.dispose(), [groundTexture])

  return (
    <group name="studio">
      {/* Base fill — kept very low so the rims read as the light sources */}
      <ambientLight ref={ambientRef} intensity={0.2} color="#8ea6d8" />

      {/* Key light: soft, from the front-left, barely above the horizon */}
      <directionalLight
        ref={keyRef}
        position={[-3.2, 3.4, 3.6]}
        intensity={1.4}
        color="#cfe0ff"
        castShadow={false}
      />

      {/* Cool blue rim from behind-left */}
      <spotLight
        ref={rimARef}
        position={[-3.6, 2.2, -3.2]}
        angle={0.9}
        penumbra={1}
        intensity={2.6}
        color="#4b8cff"
        distance={14}
        decay={1.4}
      />

      {/* Violet rim from behind-right */}
      <spotLight
        ref={rimBRef}
        position={[3.8, 1.7, -2.8]}
        angle={0.95}
        penumbra={1}
        intensity={2.1}
        color="#7c5cff"
        distance={14}
        decay={1.4}
      />

      {/* The display's own light spilling onto the keyboard */}
      <pointLight
        ref={screenFillRef}
        position={[0, 0.95, -0.55]}
        intensity={0.8}
        color="#8fb8ff"
        distance={4}
        decay={1.6}
      />

      {/* Procedural environment: light panels, no external HDR download */}
      <Environment resolution={quality?.id === 'low' ? 64 : 128} frames={1} background={false}>
        <color attach="background" args={['#05060a']} />
        <Lightformer
          intensity={0.9}
          color="#7fa8ff"
          position={[-4, 2, -3]}
          rotation={[0, Math.PI / 3, 0]}
          scale={[6, 4, 1]}
        />
        <Lightformer
          intensity={0.7}
          color="#8b6bff"
          position={[4, 1.5, -2]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[6, 4, 1]}
        />
        <Lightformer
          intensity={0.35}
          color="#dfe9ff"
          position={[0, 4, 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[8, 8, 1]}
        />
      </Environment>

      {ground.enabled ? (
        <group name="ground">
          {/* Light pool */}
          <mesh rotation-x={-Math.PI / 2} position-y={ground.y} receiveShadow={false}>
            <planeGeometry args={[16, 16]} />
            <meshBasicMaterial
              map={groundTexture}
              transparent
              opacity={0.9}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Real contact shadow (frame-accurate, so it follows the opening lid) */}
          {quality?.contactShadow ? (
            <ContactShadows
              position={[0, ground.y + 0.002, 0]}
              scale={6}
              resolution={quality.shadowMapSize >= 1024 ? 512 : 256}
              blur={2.4}
              opacity={0.72}
              far={2.2}
              color="#000000"
            />
          ) : null}
        </group>
      ) : null}
    </group>
  )
}
