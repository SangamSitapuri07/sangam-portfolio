'use client'

// Home Page - The Entry Point

import Canvas from '@/components/core/Canvas'
import Experience from '@/components/core/Experience'
import ScrollManager from '@/components/core/ScrollManager'
import SceneDebugger from '@/components/ui/SceneDebugger'
import LoadingScreen from '@/components/scenes/00_Loading/LoadingScreen'
import AudioPrompt from '@/components/ui/AudioPrompt'
import HeroText from '@/components/scenes/01_Awakening/HeroText'
import LightFlash from '@/components/effects/LightFlash'

export default function Home() {
  return (
    <>
      {/* Loading Screen */}
      <LoadingScreen />

      {/* Audio Prompt */}
      <AudioPrompt />

      {/* 3D Canvas with Face */}
      <Canvas>
        <Experience />
      </Canvas>

      {/* Light flash during shatter (DOM overlay) */}
      <LightFlash />

      {/* Scrollable area + UI overlays */}
      <ScrollManager>
        <SceneDebugger />
        <HeroText />
      </ScrollManager>
    </>
  )
}