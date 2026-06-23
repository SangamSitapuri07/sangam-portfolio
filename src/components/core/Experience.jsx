'use client'

// Experience Component
// The master 3D scene controller

import { useSceneStore } from '@/store/useSceneStore'
import FacePlaceholder from '@/components/face/FacePlaceholder'
import Awakening from '@/components/scenes/01_Awakening/Awakening'
import Cracks from '@/components/scenes/02_Cracks/Cracks'
import CrackEffect from '@/components/scenes/02_Cracks/CrackEffect'
import ShatterEffect from '@/components/scenes/02_Cracks/ShatterEffect'
import ScreenShake from '@/components/effects/ScreenShake'

export default function Experience() {
  const currentScene = useSceneStore(state => state.currentScene)

  return (
    <>
      {/* Cinematic Lighting */}
      <ambientLight intensity={0.1} />
      
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1.2} 
        color="#ffffff"
      />
      
      <pointLight 
        position={[-5, 2, 3]} 
        intensity={2} 
        color="#4a90d9"
        distance={15}
      />
      
      <pointLight 
        position={[5, -1, 3]} 
        intensity={1.5} 
        color="#8b5cf6"
        distance={15}
      />

      <pointLight 
        position={[0, 5, 2]} 
        intensity={0.8} 
        color="#00d4ff"
        distance={10}
      />

      {/* THE FACE */}
      <FacePlaceholder />

      {/* Crack lines on face */}
      <CrackEffect />

      {/* Particles for shatter */}
      <ShatterEffect />

      {/* Camera shake during shatter */}
      <ScreenShake />

      {/* Scene Controllers (manage state) */}
      <Awakening />
      <Cracks />
    </>
  )
}