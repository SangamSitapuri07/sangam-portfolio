// Custom Hook: useMouseTracker
// Tracks mouse position and provides normalized coordinates
// Used for face tracking and parallax effects

import { useEffect, useState, useRef } from 'react'

export const useMouseTracker = () => {
  const [mouse, setMouse] = useState({ 
    x: 0,           // Raw X position
    y: 0,           // Raw Y position
    normalizedX: 0, // -1 to 1 (left to right)
    normalizedY: 0, // -1 to 1 (top to bottom, inverted for 3D)
    velocityX: 0,
    velocityY: 0,
    isMoving: false,
  })

  const lastPositionRef = useRef({ x: 0, y: 0, time: Date.now() })
  const moveTimeoutRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (event) => {
      const x = event.clientX
      const y = event.clientY
      
      // Normalize to -1 to 1 range
      const normalizedX = (x / window.innerWidth) * 2 - 1
      const normalizedY = -((y / window.innerHeight) * 2 - 1)
      
      // Calculate velocity
      const now = Date.now()
      const deltaTime = now - lastPositionRef.current.time
      const deltaX = x - lastPositionRef.current.x
      const deltaY = y - lastPositionRef.current.y
      
      const velocityX = deltaTime > 0 ? deltaX / deltaTime : 0
      const velocityY = deltaTime > 0 ? deltaY / deltaTime : 0
      
      lastPositionRef.current = { x, y, time: now }
      
      setMouse({
        x,
        y,
        normalizedX,
        normalizedY,
        velocityX,
        velocityY,
        isMoving: true,
      })
      
      // Reset isMoving after no movement
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current)
      }
      
      moveTimeoutRef.current = setTimeout(() => {
        setMouse(prev => ({ ...prev, isMoving: false, velocityX: 0, velocityY: 0 }))
      }, 100)
    }

    const handleTouchMove = (event) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0]
        handleMouseMove({ 
          clientX: touch.clientX, 
          clientY: touch.clientY 
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current)
      }
    }
  }, [])

  return mouse
}