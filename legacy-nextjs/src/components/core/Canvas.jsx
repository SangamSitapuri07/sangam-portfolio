'use client'

// Canvas Component - Fixed full screen 3D canvas

import { Canvas as R3FCanvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useDeviceDetect } from '@/hooks/useDeviceDetect'

export default function Canvas({ children }) {
  const device = useDeviceDetect()

  if (!device.isReady) {
    return null
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'auto',
      }}
    >
      <R3FCanvas
        camera={{
          position: [0, 0, 8],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: device.qualityTier.antialias,
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
        }}
        dpr={device.qualityTier.dpr || [1, 2]}
        shadows={device.qualityTier.shadows}
        performance={{
          min: 0.5,
          max: 1,
          debounce: 200,
        }}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 10, 30]} />

        <Suspense fallback={null}>
          {children}
        </Suspense>
      </R3FCanvas>
    </div>
  )
}