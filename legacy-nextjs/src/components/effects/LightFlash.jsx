'use client'

// Light Flash Effect
// Bright flash overlay during the shatter moment
// Creates dramatic impact when face explodes

import { useEffect, useState } from 'react'
import { useSceneStore } from '@/store/useSceneStore'

export default function LightFlash() {
  const scrollProgress = useSceneStore(state => state.scrollProgress)
  const [flashOpacity, setFlashOpacity] = useState(0)

  useEffect(() => {
    // Flash peaks at the shatter moment (17%)
    if (scrollProgress >= 0.165 && scrollProgress < 0.185) {
      // Bell curve around 0.17
      const distance = Math.abs(scrollProgress - 0.17)
      const intensity = Math.max(0, 0.8 - distance * 40)
      setFlashOpacity(intensity)
    } else {
      setFlashOpacity(0)
    }
  }, [scrollProgress])

  if (flashOpacity <= 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(circle at 25% 50%, rgba(255, 255, 255, 1) 0%, rgba(0, 212, 255, 0.5) 30%, transparent 60%)',
        opacity: flashOpacity,
        pointerEvents: 'none',
        zIndex: 50,
        mixBlendMode: 'screen',
        transition: 'opacity 50ms linear',
      }}
    />
  )
}