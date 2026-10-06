'use client'

// Experience Component
// Now uses REAL face model instead of placeholder

import { useSceneStore } from '@/store/useSceneStore'
import FaceModel from '@/components/face/FaceModel'
import Awakening from '@/components/scenes/01_Awakening/Awakening'
import Cracks from '@/components/scenes/02_Cracks/Cracks'
import CrackEffect from '@/components/scenes/02_Cracks/CrackEffect'
import ShatterEffect from '@/components/scenes/02_Cracks/ShatterEffect'
import ScreenShake from '@/components/effects/ScreenShake'

export default function Experience() {
  return (
    <>
      {/* Cinematic Lighting (better for skin tones) */}
      <ambientLight intensity={0.3} />
      
      {/* Key light */}
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1.5} 
        color="#ffffff"
        castShadow
      />
      
      {/* Rim light (blue) */}
      <pointLight 
        position={[-3, 2, 3]} 
        intensity={2} 
        color="#4a90d9"
        distance={15}
      />
      
      {/* Fill light (purple) */}
      <pointLight 
        position={[3, -1, 3]} 
        intensity={1.5} 
        color="#8b5cf6"
        distance={15}
      />

      {/* Top accent */}
      <pointLight 
        position={[0, 5, 2]} 
        intensity={0.8} 
        color="#00d4ff"
        distance={10}
      />

      {/* YOUR REAL FACE */}
      <FaceModel />

      {/* Crack lines */}
      <CrackEffect />

      {/* Shatter particles */}
      <ShatterEffect />

      {/* Camera shake */}
      <ScreenShake />

      {/* Scene Controllers */}
      <Awakening />
      <Cracks />
    </>
  )
}