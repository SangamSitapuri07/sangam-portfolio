'use client'

// Home Page - The Entry Point
// Connects Canvas + Experience + ScrollManager + UI overlays

import Canvas from '@/components/core/Canvas'
import Experience from '@/components/core/Experience'
import ScrollManager from '@/components/core/ScrollManager'
import SceneDebugger from '@/components/ui/SceneDebugger'

export default function Home() {
  return (
    <>
      {/* 3D Canvas (fixed, full screen, background layer) */}
      <Canvas>
        <Experience />
      </Canvas>

      {/* Scrollable area (drives scene transitions) */}
      <ScrollManager>
        {/* UI overlays render here */}
        <SceneDebugger />
      </ScrollManager>
    </>
  )
}