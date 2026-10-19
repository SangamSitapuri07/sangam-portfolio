'use client'

// Screen Shake Effect
// Subtle camera shake during the shatter moment for dramatic impact

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useSceneStore } from '@/store/useSceneStore'

export default function ScreenShake() {
  const scrollProgress = useSceneStore(state => state.scrollProgress)
  const { camera } = useThree()
  
  const originalPosition = useRef({ x: camera.position.x, y: camera.position.y, z: camera.position.z })
  const shakeIntensityRef = useRef(0)

  useFrame((state) => {
    // Shake intensity peaks at shatter moment (17%)
    let intensity = 0
    
    if (scrollProgress >= 0.165 && scrollProgress < 0.19) {
      // Calculate intensity (peaks at 0.17, fades after)
      const distance = Math.abs(scrollProgress - 0.17)
      intensity = Math.max(0, 0.1 - distance * 2)
    }
    
    shakeIntensityRef.current = intensity

    if (intensity > 0) {
      // Apply random shake to camera
      const time = state.clock.elapsedTime
      camera.position.x = originalPosition.current.x + Math.sin(time * 50) * intensity
      camera.position.y = originalPosition.current.y + Math.cos(time * 47) * intensity
    } else {
      // Reset to original position smoothly
      camera.position.x += (originalPosition.current.x - camera.position.x) * 0.1
      camera.position.y += (originalPosition.current.y - camera.position.y) * 0.1
    }
  })

  return null
}