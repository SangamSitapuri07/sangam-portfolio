'use client'

// Face Placeholder
// Cinematic geometric face built with Three.js
// Will be replaced with real 3D face scan later
// Has eyes, can track mouse, has expressions

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useFaceStore } from '@/store/useFaceStore'
import { useMouseTracker } from '@/hooks/useMouseTracker'
import * as THREE from 'three'

export default function FacePlaceholder() {
  const groupRef = useRef()
  const headRef = useRef()
  const leftEyeRef = useRef()
  const rightEyeRef = useRef()
  const leftPupilRef = useRef()
  const rightPupilRef = useRef()
  const wireframeRef = useRef()
  
  // Face store
  const isVisible = useFaceStore(state => state.isVisible)
  const opacity = useFaceStore(state => state.opacity)
  const leftEyeOpen = useFaceStore(state => state.leftEyeOpen)
  const rightEyeOpen = useFaceStore(state => state.rightEyeOpen)
  const trackingEnabled = useFaceStore(state => state.trackingEnabled)
  const scale = useFaceStore(state => state.scale)
  
  // Mouse tracking
  const mouse = useMouseTracker()

  // Smooth values
  const targetRotation = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0, y: 0 })
  const pupilOffset = useRef({ x: 0, y: 0 })

  // Breathing animation values
  const breathingPhase = useRef(0)

  useFrame((state, delta) => {
    if (!groupRef.current) return

    // Breathing animation (subtle up/down)
    breathingPhase.current += delta * 0.8
    const breath = Math.sin(breathingPhase.current) * 0.02
    groupRef.current.position.y = breath

    // Mouse tracking (face follows cursor)
    if (trackingEnabled) {
      targetRotation.current.y = mouse.normalizedX * 0.3
      targetRotation.current.x = -mouse.normalizedY * 0.2
      
      // Smooth lerp
      currentRotation.current.x = THREE.MathUtils.lerp(
        currentRotation.current.x,
        targetRotation.current.x,
        0.08
      )
      currentRotation.current.y = THREE.MathUtils.lerp(
        currentRotation.current.y,
        targetRotation.current.y,
        0.08
      )
      
      groupRef.current.rotation.x = currentRotation.current.x
      groupRef.current.rotation.y = currentRotation.current.y

      // Pupils track mouse independently for more life
      pupilOffset.current.x = THREE.MathUtils.lerp(
        pupilOffset.current.x,
        mouse.normalizedX * 0.05,
        0.1
      )
      pupilOffset.current.y = THREE.MathUtils.lerp(
        pupilOffset.current.y,
        mouse.normalizedY * 0.03,
        0.1
      )

      if (leftPupilRef.current) {
  leftPupilRef.current.position.x = pupilOffset.current.x
  leftPupilRef.current.position.y = pupilOffset.current.y
}
if (rightPupilRef.current) {
  rightPupilRef.current.position.x = pupilOffset.current.x
  rightPupilRef.current.position.y = pupilOffset.current.y
}
    }

    // Wireframe rotation (slow continuous spin for life)
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y += delta * 0.05
    }

    // Eye opening animation (scale Y based on store value)
    if (leftEyeRef.current) {
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(
        leftEyeRef.current.scale.y,
        Math.max(0.05, leftEyeOpen),
        0.15
      )
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(
        rightEyeRef.current.scale.y,
        Math.max(0.05, rightEyeOpen),
        0.15
      )
    }

    // Apply scale and opacity
    groupRef.current.scale.setScalar(scale)
    
    // Apply opacity to all materials
    groupRef.current.traverse((child) => {
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => {
            m.opacity = opacity
            m.transparent = true
          })
        } else {
          child.material.opacity = opacity
          child.material.transparent = true
        }
      }
    })
  })

  if (!isVisible) return null

  return (
    <group ref={groupRef} position={[-2.5, 0, 0]} scale={1.8}>
      {/* Main Head Sphere (semi-transparent) */}
      <mesh ref={headRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.7}
          roughness={0.3}
          transparent
          opacity={0.4}
          emissive="#4a90d9"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Wireframe Overlay (the cool digital look) */}
      <mesh ref={wireframeRef}>
        <sphereGeometry args={[2.02, 24, 24]} />
        <meshBasicMaterial
          color="#00d4ff"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Inner Glow Sphere */}
      <mesh scale={0.95}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color="#4a90d9"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>

      {/* LEFT EYE */}
      {/* LEFT EYE */}
      <group position={[-0.65, 0.3, 1.7]}>
        {/* Eye socket (white part) */}
        <mesh ref={leftEyeRef}>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.5}
          />
        </mesh>
        {/* Pupil (glowing) */}
        <mesh ref={leftPupilRef} position={[0, 0, 0.1]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#00d4ff" />
        </mesh>
      </group>

      {/* RIGHT EYE */}
      {/* RIGHT EYE */}
        <group position={[0.65, 0.3, 1.7]}>
        <mesh ref={rightEyeRef}>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.5}
          />
        </mesh>
        <mesh ref={rightPupilRef} position={[0, 0, 0.1]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#00d4ff" />
        </mesh>
      </group>

      {/* Digital lines on right side (half-digital aesthetic) */}
      <group position={[0.8, 0, 0.8]}>
  {[...Array(8)].map((_, i) => (
    <mesh key={i} position={[0, -0.7 + i * 0.2, 0]}>
      <boxGeometry args={[0.6, 0.015, 0.015]} />
            <meshBasicMaterial 
              color="#00d4ff" 
              transparent
              opacity={0.6}
            />
          </mesh>
        ))}
      </group>

      {/* Ambient particles around face */}
      <Particles />
    </group>
  )
}

// Floating ambient particles around face
function Particles() {
  const pointsRef = useRef()
  const count = 200

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const radius = 2 + Math.random() * 2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)
    }
    return pos
  }, [])

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05
      pointsRef.current.rotation.x += delta * 0.02
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#00d4ff"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}