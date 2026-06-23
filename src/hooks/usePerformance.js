// Custom Hook: usePerformance
// Monitors FPS and automatically adjusts quality if performance drops

import { useEffect, useRef, useState } from 'react'

export const usePerformance = (options = {}) => {
  const { sampleSize = 60, targetFPS = 60 } = options

  const [fps, setFps] = useState(60)
  const [averageFps, setAverageFps] = useState(60)
  const [isLowPerformance, setIsLowPerformance] = useState(false)
  
  const frameTimesRef = useRef([])
  const lastFrameTimeRef = useRef(performance.now())
  const animationFrameRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const measureFPS = () => {
      const now = performance.now()
      const delta = now - lastFrameTimeRef.current
      lastFrameTimeRef.current = now

      if (delta > 0) {
        const currentFPS = 1000 / delta
        frameTimesRef.current.push(currentFPS)

        // Keep only last N samples
        if (frameTimesRef.current.length > sampleSize) {
          frameTimesRef.current.shift()
        }

        // Calculate average
        const avg = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length

        setFps(Math.round(currentFPS))
        setAverageFps(Math.round(avg))

        // Detect low performance
        if (frameTimesRef.current.length >= sampleSize) {
          const lowPerf = avg < targetFPS * 0.7  // 70% of target
          setIsLowPerformance(lowPerf)
        }
      }

      animationFrameRef.current = requestAnimationFrame(measureFPS)
    }

    animationFrameRef.current = requestAnimationFrame(measureFPS)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [sampleSize, targetFPS])

  return {
    fps,
    averageFps,
    isLowPerformance,
  }
}