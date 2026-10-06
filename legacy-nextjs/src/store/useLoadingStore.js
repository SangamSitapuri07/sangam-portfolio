// Loading Store
// Tracks asset loading, progress, and ready state

import { create } from 'zustand'

export const useLoadingStore = create((set, get) => ({
  // Loading state
  isLoading: true,
  isReady: false,
  
  // Progress (0 to 100)
  progress: 0,
  
  // Loading stage text
  stage: 'Initializing consciousness...',
  
  // Asset tracking
  totalAssets: 0,
  loadedAssets: 0,
  
  // Loading stages with messages
  stages: [
    { progress: 0, text: 'Initializing consciousness...' },
    { progress: 20, text: 'Loading memories...' },
    { progress: 40, text: 'Compiling experiences...' },
    { progress: 60, text: 'Building reality...' },
    { progress: 80, text: 'Almost there...' },
    { progress: 100, text: 'Awakening...' },
  ],

  // Actions
  setProgress: (progress) => {
    const clampedProgress = Math.max(0, Math.min(100, progress))
    
    // Update stage text based on progress
    const stages = get().stages
    const currentStage = stages
      .slice()
      .reverse()
      .find(s => clampedProgress >= s.progress)
    
    set({
      progress: clampedProgress,
      stage: currentStage?.text || 'Loading...',
    })
  },

  setTotalAssets: (total) => {
    set({ totalAssets: total })
  },

  incrementLoadedAssets: () => {
    set((state) => {
      const loaded = state.loadedAssets + 1
      const progress = state.totalAssets > 0 
        ? (loaded / state.totalAssets) * 100 
        : 0
      
      return {
        loadedAssets: loaded,
        progress: Math.min(100, progress),
      }
    })
  },

  setReady: () => {
    set({
      isLoading: false,
      isReady: true,
      progress: 100,
      stage: 'Awakening...',
    })
  },

  setStage: (stage) => {
    set({ stage })
  },

  // Manual loading simulation (used until real assets are added)
  startSimulation: () => {
    const duration = 4000 // 4 seconds
    const interval = 50
    const steps = duration / interval
    const increment = 100 / steps
    
    let currentProgress = 0
    const timer = setInterval(() => {
      currentProgress += increment
      
      if (currentProgress >= 100) {
        currentProgress = 100
        clearInterval(timer)
        setTimeout(() => {
          get().setReady()
        }, 500)
      }
      
      get().setProgress(currentProgress)
    }, interval)
  },

  reset: () => {
    set({
      isLoading: true,
      isReady: false,
      progress: 0,
      stage: 'Initializing consciousness...',
      totalAssets: 0,
      loadedAssets: 0,
    })
  },
}))