import { useEffect, useMemo, useRef } from 'react'
import { Environment, Lightformer, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

import { ground } from '@/config/laptop'
import { studio } from '@/config/lighting'

/**
 * Studio — the room the machine sits in.
 *
 * A dark studio with a clear lighting story: one soft key from the front-left, a
 * cyan rim from behind-left, a violet rim from behind-right, a small fill from the
 * display itself, and a cyan underglow that rises when the machine is opened up.
 * The environment is built from procedural light panels, so the brushed metal has
 * something to reflect without an HDR download.
 *
 * Intensities are driven every frame by the director (`lib/director.js`) through
 * the refs this component registers — never through React state.
 */

function useGroundTexture() {
  return useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, studio.ground.warm)
    gradient.addColorStop(0.35, studio.ground.mid)
    gradient.addColorStop(0.7, studio.ground.far)
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
  const underglowRef = useRef(null)
  const groundTexture = useGroundTexture()

  useEffect(() => {
    registerLights?.({
      ambient: ambientRef.current,
      key: keyRef.current,
      rimA: rimARef.current,
      rimB: rimBRef.current,
      screenFill: screenFillRef.current,
      underglow: underglowRef.current,
    })
  }, [registerLights])

  useEffect(() => () => groundTexture.dispose(), [groundTexture])

  return (
    <group name="studio">
      {/* Base fill — kept low so the rims read as the light sources */}
      <ambientLight ref={ambientRef} intensity={0.2} color={studio.ambient.color} />

      {/* Key: soft, front-left, barely above the horizon */}
      <directionalLight
        ref={keyRef}
        position={studio.key.position}
        intensity={1.4}
        color={studio.key.color}
        castShadow={false}
      />

      {/* Cyan rim from behind-left */}
      <spotLight
        ref={rimARef}
        position={studio.rimA.position}
        angle={studio.rimA.angle}
        penumbra={1}
        intensity={2.6}
        color={studio.rimA.color}
        distance={16}
        decay={1.35}
      />

      {/* Violet rim from behind-right */}
      <spotLight
        ref={rimBRef}
        position={studio.rimB.position}
        angle={studio.rimB.angle}
        penumbra={1}
        intensity={2.1}
        color={studio.rimB.color}
        distance={16}
        decay={1.35}
      />

      {/* The display's own light spilling onto the keyboard */}
      <pointLight
        ref={screenFillRef}
        position={studio.screenFill.position}
        intensity={0.8}
        color={studio.screenFill.color}
        distance={5}
        decay={1.6}
      />

      {/* Cyan underglow: the machine lighting the desk it stands on */}
      <pointLight
        ref={underglowRef}
        position={studio.underglow.position}
        intensity={1.1}
        color={studio.underglow.color}
        distance={4.5}
        decay={1.8}
      />

      {/* Procedural environment: light panels, no external HDR download */}
      <Environment resolution={quality?.id === 'low' ? 64 : 128} frames={1} background={false}>
        <color attach="background" args={['#05060a']} />
        <Lightformer
          intensity={0.9}
          color="#3fd4ff"
          position={[-4, 2.2, -3]}
          rotation={[0, Math.PI / 3, 0]}
          scale={[6, 4, 1]}
        />
        <Lightformer
          intensity={0.7}
          color="#7c5cff"
          position={[4, 1.6, -2]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[6, 4, 1]}
        />
        <Lightformer
          intensity={0.3}
          color="#dfe9ff"
          position={[0, 4.2, 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[8, 8, 1]}
        />
      </Environment>

      {ground.enabled ? (
        <group name="ground">
          {/* Light pool */}
          <mesh rotation-x={-Math.PI / 2} position-y={ground.y - 0.001} receiveShadow={false}>
            <planeGeometry args={[16, 16]} />
            <meshBasicMaterial
              map={groundTexture}
              transparent
              opacity={0.9}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* A real contact shadow, so the machine sits on the floor and the
              opening lid reads as mass rather than a floating decal. */}
          {quality?.contactShadow ? (
            <ContactShadows
              position={[0, ground.y + 0.002, 0]}
              scale={6}
              resolution={quality.shadowMapSize >= 1024 ? 512 : 256}
              blur={2.4}
              opacity={0.72}
              far={2.4}
              color="#000000"
            />
          ) : null}
        </group>
      ) : null}
    </group>
  )
}
