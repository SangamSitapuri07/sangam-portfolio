// Custom Hook: useScrollProgress
// Tracks scroll position and converts to 0-1 progress value
// Updates the scene store automatically

import { useEffect } from 'react'
import { useSceneStore } from '@/store/useSceneStore'
import { getSceneAtProgress, getSceneProgress } from '@/config/scene.config'

export const useScrollProgress = () => {
  const setScrollProgress = useSceneStore(state => state.setScrollProgress)
  const setCurrentScene = useSceneStore(state => state.setCurrentScene)
  const setSceneProgress = useSceneStore(state => state.setSceneProgress)

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress (0 to 1)
      const scrollTop = window.scrollY
      const documentHeight = document.documentElement.scrollHeight
      const windowHeight = window.innerHeight
      const maxScroll = documentHeight - windowHeight
      
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0
      const clampedProgress = Math.max(0, Math.min(1, progress))
      
      // Update global scroll progress
      setScrollProgress(clampedProgress)
      
      // Determine current scene
      const currentScene = getSceneAtProgress(clampedProgress)
      
      if (currentScene) {
        setCurrentScene(currentScene.id)
        
        // Calculate progress within this scene
        const localProgress = getSceneProgress(clampedProgress, currentScene)
        setSceneProgress(localProgress)
      }
    }

    // Initial call
    handleScroll()

    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [setScrollProgress, setCurrentScene, setSceneProgress])
}