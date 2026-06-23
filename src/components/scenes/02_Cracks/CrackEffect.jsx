'use client'

// Crack Effect
// Renders glowing crack lines on the face based on scroll progress
// Cracks appear, spread, then face shatters

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSceneStore } from '@/store/useSceneStore'
import { useFaceStore } from '@/store/useFaceStore'
import * as THREE from 'three'

export default function CrackEffect() {
  const groupRef = useRef()
  const linesRef = useRef([])
  
  const scrollProgress = useSceneStore(state => state.scrollProgress)
  const currentScene = useSceneStore(state => state.currentScene)
  const setCrackProgress = useFaceStore(state => state.setCrackProgress)

  // Generate random crack paths emerging from face
  const crackData = useMemo(() => {
    const cracks = []
    const numCracks = 12
    
    for (let i = 0; i < numCracks; i++) {
      // Each crack starts from a random point on the face
      const angle = (i / numCracks) * Math.PI * 2 + Math.random() * 0.5
      const startRadius = 1.5 + Math.random() * 0.3
      
      const start = new THREE.Vector3(
        Math.cos(angle) * startRadius,
        Math.sin(angle) * startRadius,
        Math.random() * 0.5 - 0.25
      )
      
      // Crack extends outward
      const endRadius = 2 + Math.random() * 0.5
      const end = new THREE.Vector3(
        Math.cos(angle) * endRadius,
        Math.sin(angle) * endRadius,
        Math.random() * 0.5 - 0.25
      )
      
      // Add some middle points for organic feel
      const points = []
      const segments = 5
      for (let j = 0; j <= segments; j++) {
        const t = j / segments
        const point = new THREE.Vector3().lerpVectors(start, end, t)
        // Add random offset for organic shape
        point.x += (Math.random() - 0.5) * 0.15
        point.y += (Math.random() - 0.5) * 0.15
        points.push(point)
      }
      
      cracks.push({
        points,
        delay: Math.random() * 0.3,
        thickness: 0.02 + Math.random() * 0.02,
        color: i % 3 === 0 ? '#00d4ff' : i % 3 === 1 ? '#8b5cf6' : '#ffffff',
      })
    }
    
    return cracks
  }, [])

  useFrame(() => {
    if (!groupRef.current) return

    // Calculate crack progress based on scroll
    // Cracks appear between 12% - 17% scroll
    let crackProgress = 0
    
    if (scrollProgress >= 0.12 && scrollProgress < 0.17) {
      crackProgress = (scrollProgress - 0.12) / 0.05  // 0 to 1
    } else if (scrollProgress >= 0.17) {
      crackProgress = 1
    }
    
    setCrackProgress(crackProgress)

    // Apply progress to each crack
    crackData.forEach((crack, index) => {
      const line = linesRef.current[index]
      if (!line) return

      // Each crack has slight delay for staggered appearance
      const localProgress = Math.max(0, Math.min(1, (crackProgress - crack.delay) / (1 - crack.delay)))
      
      // Visibility
      line.visible = localProgress > 0
      
      // Scale up the crack as it appears (grows outward)
      line.scale.setScalar(localProgress)
      
      // Pulsing glow effect
      if (line.material) {
        line.material.opacity = localProgress * (0.6 + Math.sin(Date.now() * 0.005) * 0.4)
      }
    })

    // Hide entire crack group when face has shattered (after 17%)
    if (groupRef.current) {
      if (scrollProgress >= 0.17) {
        groupRef.current.visible = scrollProgress < 0.18
      } else {
        groupRef.current.visible = scrollProgress >= 0.12
      }
    }
  })

  return (
    <group ref={groupRef} position={[-2.5, 0, 0]} scale={1.8}>
      {crackData.map((crack, index) => {
        // Create geometry from points
        const geometry = new THREE.BufferGeometry().setFromPoints(crack.points)
        
        return (
          <line 
            key={index}
            ref={(el) => (linesRef.current[index] = el)}
          >
            <primitive object={geometry} attach="geometry" />
            <lineBasicMaterial 
              color={crack.color}
              transparent
              opacity={0.8}
              linewidth={2}
            />
          </line>
        )
      })}
      
      {/* Glowing inner light (gets brighter as cracks spread) */}
      <CrackInnerLight crackProgress={scrollProgress} />
    </group>
  )
}

// Inner glow that appears through the cracks
function CrackInnerLight({ crackProgress }) {
  const lightRef = useRef()
  
  useFrame(() => {
    if (!lightRef.current) return
    
    let intensity = 0
    if (crackProgress >= 0.12 && crackProgress < 0.17) {
      intensity = ((crackProgress - 0.12) / 0.05) * 3
    } else if (crackProgress >= 0.17) {
      intensity = 3
    }
    
    lightRef.current.intensity = intensity + Math.sin(Date.now() * 0.005) * 0.5
  })

  return (
    <pointLight
      ref={lightRef}
      position={[0, 0, 0]}
      color="#00d4ff"
      intensity={0}
      distance={5}
    />
  )
}