'use client'

// Awakening Scene
// Controls the eye-opening sequence at the start
// Manages face visibility and dramatic reveal

import { useEffect } from 'react'
import { useSceneStore } from '@/store/useSceneStore'
import { useFaceStore } from '@/store/useFaceStore'
import { useLoadingStore } from '@/store/useLoadingStore'
import { SCENES } from '@/config/scene.config'

export default function Awakening() {
  const currentScene = useSceneStore(state => state.currentScene)
  const sceneProgress = useSceneStore(state => state.sceneProgress)
  const scrollProgress = useSceneStore(state => state.scrollProgress)
  const isReady = useLoadingStore(state => state.isReady)
  
  const setVisible = useFaceStore(state => state.setVisible)
  const setLeftEye = useFaceStore(state => state.setLeftEye)
  const setRightEye = useFaceStore(state => state.setRightEye)
  const setOpacity = useFaceStore(state => state.setOpacity)
  const setScale = useFaceStore(state => state.setScale)
  const setExpression = useFaceStore(state => state.setExpression)
  const setTracking = useFaceStore(state => state.setTracking)

  // AUTO PLAY SEQUENCE: After loading, eyes open automatically
  useEffect(() => {
    if (!isReady) return

    // Phase 1: Face becomes visible (still dark)
    const showFace = setTimeout(() => {
      setVisible(true)
      setOpacity(0.3)
      setScale(0.95)
      setTracking(false)
    }, 800)

    // Phase 2: Left eye opens slowly
    const openLeftEye = setTimeout(() => {
      setLeftEye(1)
    }, 2000)

    // Phase 3: Right eye opens
    const openRightEye = setTimeout(() => {
      setRightEye(1)
    }, 3200)

    // Phase 4: Full reveal (face becomes bright, fully visible)
    const fullReveal = setTimeout(() => {
      setOpacity(1)
      setScale(1)
      setExpression('neutral')
    }, 4200)

    // Phase 5: Enable mouse tracking (face becomes interactive)
    const enableTracking = setTimeout(() => {
      setTracking(true)
    }, 5200)

    return () => {
      clearTimeout(showFace)
      clearTimeout(openLeftEye)
      clearTimeout(openRightEye)
      clearTimeout(fullReveal)
      clearTimeout(enableTracking)
    }
  }, [isReady, setVisible, setLeftEye, setRightEye, setOpacity, setScale, setExpression, setTracking])

  // SCROLL CONTROLLED: After awakening, scroll controls everything
  useEffect(() => {
    // Only active during awakening scene
    if (currentScene !== 'awakening') return

    // After auto-sequence completes, scroll takes over
    // Face stays visible and tracks mouse
    // Nothing additional needed here yet
  }, [currentScene, sceneProgress])

  return null // This component only manages state, no visual output
}