// Portal Store
// Manages demo portals: open/close, current demo, animation state

import { create } from 'zustand'

export const usePortalStore = create((set, get) => ({
  // Portal state
  isOpen: false,
  isOpening: false,
  isClosing: false,
  
  // Current demo
  currentDemo: null,        // Project ID being demoed
  currentDemoType: null,    // 'embedded-live' | 'ui-simulation' | etc
  
  // Portal animation progress (0 to 1)
  openProgress: 0,
  
  // Portal position in 3D space (where it opens from)
  portalPosition: [0, 0, 0],
  
  // Should face show ghost mode during demo
  showFaceGhost: false,
  
  // Track user interactions inside demo (for face reactions)
  lastInteraction: null,
  interactionCount: 0,
  
  // Post-demo CTA visibility
  showCTA: false,
  
  // Actions
  openPortal: (projectId, demoType, position = [0, 0, 0]) => {
    set({
      isOpen: true,
      isOpening: true,
      isClosing: false,
      currentDemo: projectId,
      currentDemoType: demoType,
      portalPosition: position,
      showFaceGhost: true,
      openProgress: 0,
      showCTA: false,
      interactionCount: 0,
    })
    
    // Animate open
    const duration = 800
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      set({ openProgress: progress })
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        set({ isOpening: false })
      }
    }
    
    requestAnimationFrame(animate)
  },

  closePortal: () => {
    set({
      isClosing: true,
      isOpening: false,
    })
    
    // Animate close
    const duration = 500
    const startTime = Date.now()
    const startProgress = get().openProgress
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      set({ openProgress: startProgress * (1 - progress) })
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        set({
          isOpen: false,
          isClosing: false,
          currentDemo: null,
          currentDemoType: null,
          showFaceGhost: false,
          openProgress: 0,
          showCTA: true,
        })
        
        // Hide CTA after 5 seconds
        setTimeout(() => {
          set({ showCTA: false })
        }, 5000)
      }
    }
    
    requestAnimationFrame(animate)
  },

  // Track user actions inside demo
  recordInteraction: (action) => {
    set((state) => ({
      lastInteraction: action,
      interactionCount: state.interactionCount + 1,
    }))
  },

  hideCTA: () => {
    set({ showCTA: false })
  },

  reset: () => {
    set({
      isOpen: false,
      isOpening: false,
      isClosing: false,
      currentDemo: null,
      currentDemoType: null,
      openProgress: 0,
      portalPosition: [0, 0, 0],
      showFaceGhost: false,
      lastInteraction: null,
      interactionCount: 0,
      showCTA: false,
    })
  },
}))