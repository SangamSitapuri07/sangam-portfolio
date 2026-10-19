'use client'

// Face Model - Loads your real 3D face from Meshy AI
// Replaces the placeholder geometric face

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useFaceStore } from '@/store/useFaceStore'
import { useMouseTracker } from '@/hooks/useMouseTracker'
import * as THREE from 'three'

export default function FaceModel() {
  const groupRef = useRef()
  const modelRef = useRef()
  
  // Load YOUR face model
  const { scene } = useGLTF('/models/face.glb')
  
  // Face store state
  const isVisible = useFaceStore(state => state.isVisible)
  const opacity = useFaceStore(state => state.opacity)
  const trackingEnabled = useFaceStore(state => state.trackingEnabled)
  const scale = useFaceStore(state => state.scale)
  
  // Mouse tracking
  const mouse = useMouseTracker()

  // Smooth rotation values
  const targetRotation = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0, y: 0 })
  const breathingPhase = useRef(0)

  // Apply materials and settings when model loads
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          // Better material settings for skin
          if (child.material) {
            child.material.transparent = true
            child.material.opacity = 1
            
            // Improve skin appearance
            if (child.material.roughness !== undefined) {
              child.material.roughness = 0.7
              child.material.metalness = 0.1
            }
          }
          
          // Cast shadows
          child.castShadow = true
          child.receiveShadow = true
        }
      })
    }
  }, [scene])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    // Breathing animation
    breathingPhase.current += delta * 0.8
    const breath = Math.sin(breathingPhase.current) * 0.015
    groupRef.current.position.y = 0 + breath  // Adjust Y to show face

    // Mouse tracking
    if (trackingEnabled) {
      targetRotation.current.y = mouse.normalizedX * 0.3
      targetRotation.current.x = -mouse.normalizedY * 0.15
      
      currentRotation.current.x = THREE.MathUtils.lerp(
        currentRotation.current.x,
        targetRotation.current.x,
        0.06
      )
      currentRotation.current.y = THREE.MathUtils.lerp(
        currentRotation.current.y,
        targetRotation.current.y,
        0.06
      )
      
      groupRef.current.rotation.x = currentRotation.current.x
      groupRef.current.rotation.y = currentRotation.current.y
    }

    // Apply opacity
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

    // Apply scale
    groupRef.current.scale.setScalar(scale * 2.5)
  })

  if (!isVisible) return null

  return (
    <group ref={groupRef} position={[-2.5, 0, 0]}>
      <primitive ref={modelRef} object={scene} />
    </group>
  )
}

// Preload the model for better performance
useGLTF.preload('/models/face.glb')