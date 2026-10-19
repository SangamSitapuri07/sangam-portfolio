'use client'

// Hero Text - RIGHT SIDE LAYOUT
// Name, tagline, and scroll indicator on right half of screen

import { useEffect, useState } from 'react'
import { useLoadingStore } from '@/store/useLoadingStore'
import { useSceneStore } from '@/store/useSceneStore'
import { PERSONAL } from '@/data/personal'

export default function HeroText() {
  const isReady = useLoadingStore(state => state.isReady)
  const scrollProgress = useSceneStore(state => state.scrollProgress)
  
  const [nameVisible, setNameVisible] = useState(false)
  const [titleVisible, setTitleVisible] = useState(false)
  const [taglineText, setTaglineText] = useState('')
  const [showScrollHint, setShowScrollHint] = useState(false)

  useEffect(() => {
    if (!isReady) return
    
    const showName = setTimeout(() => setNameVisible(true), 4500)
    const showTitle = setTimeout(() => setTitleVisible(true), 5200)
    const showTagline = setTimeout(() => typeTagline(), 5800)
    const showHint = setTimeout(() => setShowScrollHint(true), 8000)

    return () => {
      clearTimeout(showName)
      clearTimeout(showTitle)
      clearTimeout(showTagline)
      clearTimeout(showHint)
    }
  }, [isReady])

  const typeTagline = () => {
    const text = PERSONAL.tagline
    let currentIndex = 0
    
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setTaglineText(text.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, 50)
  }

  const opacity = Math.max(0, 1 - scrollProgress * 8)
  
  if (opacity <= 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        height: '100vh',
        zIndex: 100,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '0 60px',
        opacity,
        transition: 'opacity 200ms ease-out',
      }}
    >
      {/* Small accent line above name */}
      <div
        style={{
          width: '60px',
          height: '2px',
          background: 'linear-gradient(90deg, #00d4ff, transparent)',
          marginBottom: '20px',
          opacity: nameVisible ? 1 : 0,
          transition: 'opacity 1s ease-out',
        }}
      />

      {/* Name */}
      <div
        style={{
          fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
          fontWeight: '700',
          color: '#ffffff',
          letterSpacing: '0.05em',
          lineHeight: '1',
          marginBottom: '15px',
          opacity: nameVisible ? 1 : 0,
          transform: nameVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 1.5s ease-out, transform 1.5s ease-out',
          textShadow: '0 0 30px rgba(0, 212, 255, 0.3)',
          fontFamily: 'sans-serif',
        }}
      >
        SANGAM
        <br />
        <span style={{ color: '#00d4ff' }}>YADAV</span>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 'clamp(0.85rem, 1vw, 1rem)',
          color: 'rgba(255, 255, 255, 0.5)',
          letterSpacing: '0.3em',
          marginBottom: '30px',
          textTransform: 'uppercase',
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0)' : 'translateY(15px)',
          transition: 'opacity 1s ease-out, transform 1s ease-out',
          fontFamily: 'monospace',
        }}
      >
        {PERSONAL.title}
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 'clamp(1rem, 1.4vw, 1.3rem)',
          color: 'rgba(255, 255, 255, 0.85)',
          letterSpacing: '0.02em',
          lineHeight: '1.5',
          maxWidth: '500px',
          minHeight: '32px',
          fontFamily: 'sans-serif',
          marginBottom: '50px',
          fontWeight: '300',
        }}
      >
        {taglineText}
        {taglineText.length < PERSONAL.tagline.length && (
          <span
            style={{
              marginLeft: '4px',
              color: '#00d4ff',
              animation: 'blink 1s infinite',
            }}
          >
            |
          </span>
        )}
      </div>

      {/* Scroll Indicator */}
      {showScrollHint && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            opacity: 0,
            animation: 'fadeIn 1s ease-out forwards',
          }}
        >
          {/* Scroll mouse icon */}
          <div
            style={{
              width: '24px',
              height: '36px',
              border: '1.5px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '12px',
              position: 'relative',
              animation: 'scrollPulse 2s infinite',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '3px',
                height: '8px',
                background: '#00d4ff',
                borderRadius: '2px',
                animation: 'scrollDot 2s infinite',
              }}
            />
          </div>

          <div
            style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              letterSpacing: '3px',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
            }}
          >
            Scroll to explore
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scrollPulse {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(5px); opacity: 0.7; }
        }
        @keyframes scrollDot {
          0% { top: 8px; opacity: 1; }
          50% { top: 18px; opacity: 0.5; }
          100% { top: 8px; opacity: 1; }
        }
      `}</style>
    </div>
  )
}