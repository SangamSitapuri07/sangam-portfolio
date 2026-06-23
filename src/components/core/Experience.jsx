'use client'

// Experience Component
// The master controller of the entire 3D scene

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useSceneStore } from '@/store/useSceneStore'

export default function Experience() {
  const cubeRef = useRef()
  const scrollProgress = useSceneStore(state => state.scrollProgress)

  useFrame((state, delta) => {
    if (cubeRef.current) {
      // Continuous rotation
      cubeRef.current.rotation.x += delta * 0.5
      cubeRef.current.rotation.y += delta * 0.3
      
      // Scale based on scroll (1x to 2x)
      const targetScale = 1 + scrollProgress * 1.5
      cubeRef.current.scale.x = targetScale
      cubeRef.current.scale.y = targetScale
      cubeRef.current.scale.z = targetScale
      
      // Keep position fixed (no movement)
      cubeRef.current.position.x = 0
      cubeRef.current.position.y = 0
      cubeRef.current.position.z = 0
    }
  })

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1} 
      />
      <pointLight 
        position={[-5, 2, 3]} 
        intensity={1.5} 
        color="#4a90d9"
      />
      <pointLight 
        position={[5, -2, 3]} 
        intensity={1} 
        color="#8b5cf6"
      />

      {/* TEMPORARY: Placeholder cube */}
      <mesh ref={cubeRef}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial 
          color="#4a90d9" 
          metalness={0.8} 
          roughness={0.2}
          emissive="#4a90d9"
          emissiveIntensity={0.3}
        />
      </mesh>
    </>
  )
}