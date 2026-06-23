'use client'

// Loading Screen
// The dramatic intro that plays before the experience begins
// Shows wireframe + loading text + progress bar

import { useEffect, useState } from 'react'
import { useLoadingStore } from '@/store/useLoadingStore'
import WireframeReveal from './WireframeReveal'

export default function LoadingScreen() {
  const isLoading = useLoadingStore(state => state.isLoading)
  const progress = useLoadingStore(state => state.progress)
  const stage = useLoadingStore(state => state.stage)
  const startSimulation = useLoadingStore(state => state.startSimulation)
  
  const [displayedText, setDisplayedText] = useState('')
  const [fadeOut, setFadeOut] = useState(false)

  // Start the loading simulation when component mounts
  useEffect(() => {
    startSimulation()
  }, [startSimulation])

  // Typing animation for stage text
  useEffect(() => {
    let currentIndex = 0
    setDisplayedText('')
    
    const interval = setInterval(() => {
      if (currentIndex <= stage.length) {
        setDisplayedText(stage.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, 40)

    return () => clearInterval(interval)
  }, [stage])

  // Fade out when loading completes
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => setFadeOut(true), 100)
    }
  }, [isLoading])

  // Don't render if fully faded out
  if (fadeOut && !isLoading) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#000000',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 1s ease-out',
        pointerEvents: fadeOut ? 'none' : 'auto',
        fontFamily: 'monospace',
      }}
    >
      {/* Wireframe Animation (placeholder for face) */}
      <div style={{ width: '300px', height: '300px', marginBottom: '60px' }}>
        <WireframeReveal progress={progress} />
      </div>

      {/* Loading Text */}
      <div
        style={{
          color: '#ffffff',
          fontSize: '14px',
          letterSpacing: '2px',
          marginBottom: '30px',
          minHeight: '20px',
          textTransform: 'uppercase',
        }}
      >
        {displayedText}
        <span 
          style={{ 
            animation: 'blink 1s infinite',
            marginLeft: '2px',
          }}
        >
          _
        </span>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '300px',
          height: '2px',
          background: 'rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          marginBottom: '15px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #00d4ff, #8b5cf6)',
            transition: 'width 100ms ease-out',
            boxShadow: '0 0 10px #00d4ff',
          }}
        />
      </div>

      {/* Percentage */}
      <div
        style={{
          color: '#666',
          fontSize: '12px',
          letterSpacing: '3px',
        }}
      >
        {Math.round(progress)}%
      </div>

      {/* Inline keyframes for blink animation */}
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}