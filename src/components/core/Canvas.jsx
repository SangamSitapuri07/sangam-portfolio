'use client'

// Canvas Component
// The main R3F (React Three Fiber) wrapper
// Sets up the 3D scene with proper performance settings

import { Canvas as R3FCanvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useDeviceDetect } from '@/hooks/useDeviceDetect'

export default function Canvas({ children }) {
  const device = useDeviceDetect()

  // Wait for device detection
  if (!device.isReady) {
    return null
  }

  return (
    <div className="fixed inset-0 w-full h-full z-0">
      <R3FCanvas
        camera={{
          position: [0, 0, 5],
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
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 5, 25]} />

        <Suspense fallback={null}>
          {children}
        </Suspense>
      </R3FCanvas>
    </div>
  )
}