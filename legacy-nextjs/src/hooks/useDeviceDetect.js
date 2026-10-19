// Custom Hook: useDeviceDetect
// Detects device type, browser capabilities, and recommends quality tier

import { useEffect, useState } from 'react'
import { QUALITY_TIERS, detectQualityTier } from '@/config/performance.config'

export const useDeviceDetect = () => {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    hasWebGL: false,
    qualityTier: QUALITY_TIERS.MEDIUM,
    screenWidth: 1920,
    screenHeight: 1080,
    pixelRatio: 1,
    isReady: false,
  })

  useEffect(() => {
    const userAgent = navigator.userAgent || ''
    
    // Device type detection
    const isMobile = /iPhone|Android.*Mobile|webOS|BlackBerry/i.test(userAgent)
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent)
    const isDesktop = !isMobile && !isTablet
    
    // OS detection
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent)
    const isAndroid = /Android/i.test(userAgent)
    
    // Browser detection
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent)
    
    // Touch capability
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    
    // WebGL support
    let hasWebGL = false
    try {
      const canvas = document.createElement('canvas')
      hasWebGL = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      )
    } catch (e) {
      hasWebGL = false
    }
    
    // Quality tier
    const qualityTier = detectQualityTier()
    
    // Screen dimensions
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const pixelRatio = window.devicePixelRatio || 1

    setDevice({
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      isIOS,
      isAndroid,
      isSafari,
      hasWebGL,
      qualityTier,
      screenWidth,
      screenHeight,
      pixelRatio,
      isReady: true,
    })

    // Update on resize
    const handleResize = () => {
      setDevice(prev => ({
        ...prev,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
      }))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return device
}