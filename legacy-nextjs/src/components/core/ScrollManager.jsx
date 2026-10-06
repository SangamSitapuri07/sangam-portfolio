'use client'

// ScrollManager Component
// Creates the scrollable area that drives the entire experience
// Activates the useScrollProgress hook globally

import { useEffect } from 'react'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import { useEasterEggs } from '@/hooks/useEasterEggs'

export default function ScrollManager({ children }) {
  // Activate scroll tracking
  useScrollProgress()
  
  // Activate easter eggs
  useEasterEggs()

  useEffect(() => {
    // Make sure document has enough height for scrolling
    // We use 10x viewport height (10 scenes worth of scrolling)
    document.body.style.height = '1000vh'
    
    return () => {
      document.body.style.height = ''
    }
  }, [])

  return (
    <>
      {/* Invisible scrollable spacer */}
      <div 
        className="relative w-full"
        style={{ height: '1000vh', pointerEvents: 'none' }}
      />
      
      {/* Children render on top */}
      {children}
    </>
  )
}