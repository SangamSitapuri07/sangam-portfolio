'use client'

// Audio Prompt
// Asks user if they want sound experience
// Shows after loading screen, dismisses on choice

import { useEffect, useState } from 'react'
import { useAudioStore } from '@/store/useAudioStore'
import { useLoadingStore } from '@/store/useLoadingStore'

export default function AudioPrompt() {
  const isReady = useLoadingStore(state => state.isReady)
  const hasUserChosenAudio = useAudioStore(state => state.hasUserChosenAudio)
  const enableAudio = useAudioStore(state => state.enableAudio)
  const disableAudio = useAudioStore(state => state.disableAudio)
  
  const [visible, setVisible] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  // Show prompt 1 second after loading completes
  useEffect(() => {
    if (isReady && !hasUserChosenAudio) {
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [isReady, hasUserChosenAudio])

  const handleChoice = (withSound) => {
    setFadeOut(true)
    setTimeout(() => {
      if (withSound) {
        enableAudio()
      } else {
        disableAudio()
      }
      setVisible(false)
    }, 500)
  }

  if (!visible || hasUserChosenAudio) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9998,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        borderRadius: '12px',
        padding: '20px 30px',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 500ms ease-out',
        boxShadow: '0 0 30px rgba(0, 212, 255, 0.2)',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          color: '#ffffff',
          fontSize: '14px',
          marginBottom: '15px',
          textAlign: 'center',
          letterSpacing: '1px',
        }}
      >
        🎧 Best experienced with sound
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={() => handleChoice(true)}
          style={{
            background: 'linear-gradient(90deg, #00d4ff, #8b5cf6)',
            color: '#000',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'transform 200ms',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          Enable Sound
        </button>

        <button
          onClick={() => handleChoice(false)}
          style={{
            background: 'transparent',
            color: '#666',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '8px 20px',
            borderRadius: '6px',
            fontSize: '12px',
            letterSpacing: '1px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'all 200ms',
          }}
          onMouseEnter={(e) => {
            e.target.style.color = '#fff'
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#666'
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
          }}
        >
          Continue Silent
        </button>
      </div>
    </div>
  )
}