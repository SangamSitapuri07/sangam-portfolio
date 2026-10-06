'use client'

// Cracks Scene Controller
// Manages face state during cracks and shatter sequence

import { useEffect } from 'react'
import { useSceneStore } from '@/store/useSceneStore'
import { useFaceStore } from '@/store/useFaceStore'

export default function Cracks() {
  const scrollProgress = useSceneStore(state => state.scrollProgress)
  const setOpacity = useFaceStore(state => state.setOpacity)
  const setShatterProgress = useFaceStore(state => state.setShatterProgress)
  const setExpression = useFaceStore(state => state.setExpression)

  useEffect(() => {
    // Phase 1: Cracks forming (12% - 17%)
    if (scrollProgress >= 0.12 && scrollProgress < 0.17) {
      // Face expression changes during cracking
      setExpression('serious')
      
      // Face stays visible but glows more
      setOpacity(1)
    }
    
    // Phase 2: Shattering (17% - 22%)
    else if (scrollProgress >= 0.17 && scrollProgress < 0.22) {
      // Face becomes transparent as it shatters
      const shatterAmount = (scrollProgress - 0.17) / 0.05
      setOpacity(1 - shatterAmount)
      setShatterProgress(shatterAmount)
    }
    
    // Phase 3: Aftermath (22% - 30%)
    else if (scrollProgress >= 0.22 && scrollProgress < 0.30) {
      setOpacity(0)
      setShatterProgress(1)
    }
    
    // Reverse scroll: face heals back
    else if (scrollProgress < 0.12) {
      setOpacity(1)
      setShatterProgress(0)
      setExpression('neutral')
    }
  }, [scrollProgress, setOpacity, setShatterProgress, setExpression])

  return null
}