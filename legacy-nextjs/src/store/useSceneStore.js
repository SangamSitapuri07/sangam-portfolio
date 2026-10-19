// Scene Store
// Tracks current scene, scroll progress, and scene transitions

import { create } from 'zustand'

export const useSceneStore = create((set, get) => ({
  // Current state
  currentScene: 'loading',
  previousScene: null,
  scrollProgress: 0,
  
  // Scene-specific progress (0 to 1 within current scene)
  sceneProgress: 0,
  
  // Active sub-scene
  subScene: null,
  
  // Active project (during creations section)
  activeProject: null,
  
  // Transition state
  isTransitioning: false,
  
  // Scene history
  visitedScenes: ['loading'],

  // Actions
  setCurrentScene: (scene) => {
    const previous = get().currentScene
    if (previous === scene) return
    
    set((state) => ({
      previousScene: previous,
      currentScene: scene,
      visitedScenes: [...new Set([...state.visitedScenes, scene])],
    }))
  },

  setScrollProgress: (progress) => {
    set({ scrollProgress: Math.max(0, Math.min(1, progress)) })
  },

  setSceneProgress: (progress) => {
    set({ sceneProgress: Math.max(0, Math.min(1, progress)) })
  },

  setSubScene: (subScene) => {
    set({ subScene })
  },

  setActiveProject: (projectId) => {
    set({ activeProject: projectId })
  },

  setIsTransitioning: (isTransitioning) => {
    set({ isTransitioning })
  },

  // Check if a scene has been visited
  hasVisited: (scene) => {
    return get().visitedScenes.includes(scene)
  },

  // Reset everything
  reset: () => {
    set({
      currentScene: 'loading',
      previousScene: null,
      scrollProgress: 0,
      sceneProgress: 0,
      subScene: null,
      activeProject: null,
      isTransitioning: false,
      visitedScenes: ['loading'],
    })
  },
}))