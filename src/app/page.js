'use client'

// Home Page - The Entry Point

import Canvas from '@/components/core/Canvas'
import Experience from '@/components/core/Experience'
import ScrollManager from '@/components/core/ScrollManager'
import SceneDebugger from '@/components/ui/SceneDebugger'
import LoadingScreen from '@/components/scenes/00_Loading/LoadingScreen'
import AudioPrompt from '@/components/ui/AudioPrompt'

export default function Home() {
  return (
    <>
      {/* Loading Screen (shows first, fades out) */}
      <LoadingScreen />

      {/* Audio Prompt (shows after loading) */}
      <AudioPrompt />

      {/* 3D Canvas */}
      <Canvas>
        <Experience />
      </Canvas>

      {/* Scrollable area + UI overlays */}
      <ScrollManager>
        <SceneDebugger />
      </ScrollManager>
    </>
  )
}