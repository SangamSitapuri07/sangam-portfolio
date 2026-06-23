'use client'

// Experience Component
// The master 3D scene controller
// Renders face + lighting + scene-specific elements

import { useSceneStore } from '@/store/useSceneStore'
import FacePlaceholder from '@/components/face/FacePlaceholder'
import Awakening from '@/components/scenes/01_Awakening/Awakening'

export default function Experience() {
  const currentScene = useSceneStore(state => state.currentScene)

  return (
    <>
      {/* Cinematic Lighting Setup */}
      <ambientLight intensity={0.1} />
      
      {/* Key light (main dramatic light) */}
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1.2} 
        color="#ffffff"
      />
      
      {/* Rim light (blue accent from left) */}
      <pointLight 
        position={[-5, 2, 3]} 
        intensity={2} 
        color="#4a90d9"
        distance={15}
      />
      
      {/* Fill light (purple accent from right) */}
      <pointLight 
        position={[5, -1, 3]} 
        intensity={1.5} 
        color="#8b5cf6"
        distance={15}
      />

      {/* Top light (subtle highlight) */}
      <pointLight 
        position={[0, 5, 2]} 
        intensity={0.8} 
        color="#00d4ff"
        distance={10}
      />

      {/* THE FACE - Always present, transforms based on scene */}
      <FacePlaceholder />

      {/* Scene Controllers - These manage state, no visual output */}
      <Awakening />

      {/* More scenes will be added here as we build them */}
    </>
  )
}