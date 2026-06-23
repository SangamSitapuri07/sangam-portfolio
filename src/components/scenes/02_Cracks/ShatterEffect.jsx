'use client'

// Shatter Effect
// Thousands of particles that explode outward when face shatters
// Particles drift afterwards before reforming

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSceneStore } from '@/store/useSceneStore'
import * as THREE from 'three'

const PARTICLE_COUNT = 3000

export default function ShatterEffect() {
  const pointsRef = useRef()
  const scrollProgress = useSceneStore(state => state.scrollProgress)

  // Generate particle data (positions, velocities, colors)
  const { positions, originalPositions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const originalPositions = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)

    // Color palette for particles
    const particleColors = [
      new THREE.Color('#00d4ff'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#4a90d9'),
    ]

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      // Distribute on sphere surface (face shape)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 1.5 + Math.random() * 0.2

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      originalPositions[i3] = x
      originalPositions[i3 + 1] = y
      originalPositions[i3 + 2] = z

      positions[i3] = x
      positions[i3 + 1] = y
      positions[i3 + 2] = z

      // Explosion velocity (outward from center)
      const speed = 0.5 + Math.random() * 1.5
      velocities[i3] = x * speed * 0.5
      velocities[i3 + 1] = y * speed * 0.5
      velocities[i3 + 2] = z * speed * 0.5

      // Random color from palette
      const color = particleColors[Math.floor(Math.random() * particleColors.length)]
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }

    return { positions, originalPositions, velocities, colors }
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return

    // Calculate shatter progress (0 to 1)
    // Shatter happens between 17% - 22% scroll
    let shatterProgress = 0
    
    if (scrollProgress >= 0.17 && scrollProgress < 0.22) {
      shatterProgress = (scrollProgress - 0.17) / 0.05
    } else if (scrollProgress >= 0.22) {
      shatterProgress = 1
    }

    // Visibility: only show during shatter
    if (scrollProgress < 0.16 || scrollProgress > 0.30) {
      pointsRef.current.visible = false
      return
    }
    pointsRef.current.visible = true

    // Update particle positions
    const posArray = pointsRef.current.geometry.attributes.position.array
    const time = state.clock.elapsedTime

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      
      // Ease out for dramatic effect
      const easedProgress = 1 - Math.pow(1 - shatterProgress, 3)
      
      // Distance from original position
      const explosionDistance = easedProgress * 4
      
      // Add some swirl/turbulence
      const turbulence = Math.sin(time * 2 + i * 0.1) * 0.1 * easedProgress
      
      posArray[i3] = originalPositions[i3] + velocities[i3] * explosionDistance + turbulence
      posArray[i3 + 1] = originalPositions[i3 + 1] + velocities[i3 + 1] * explosionDistance + turbulence
      posArray[i3 + 2] = originalPositions[i3 + 2] + velocities[i3 + 2] * explosionDistance
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true

    // Fade out as we move past the shatter scene
    if (scrollProgress > 0.22) {
      const fadeProgress = (scrollProgress - 0.22) / 0.08
      pointsRef.current.material.opacity = Math.max(0, 1 - fadeProgress)
    } else {
      pointsRef.current.material.opacity = 1
    }
  })

  return (
    <points 
      ref={pointsRef} 
      position={[-2.5, 0, 0]} 
      scale={1.8}
      visible={false}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}