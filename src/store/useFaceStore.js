// Face Store
// Controls the 3D face: expressions, position, animations, reactions

import { create } from 'zustand'

export const useFaceStore = create((set, get) => ({
  // Face visibility
  isVisible: false,
  opacity: 1,
  
  // Face state
  state: 'closed',  // 'closed' | 'opening' | 'open' | 'cracked' | 'shattered' | 'reformed' | 'transparent' | 'dissolving'
  
  // Current expression
  expression: 'neutral',
  // Options: 'neutral' | 'smile' | 'proud' | 'amazed' | 'thinking' | 
  //          'serious' | 'curious' | 'celebrating' | 'encouraging' | 
  //          'impressed' | 'satisfied' | 'welcoming' | 'focused' | 'amused'
  
  // Eye state
  leftEyeOpen: 0,    // 0 = closed, 1 = open
  rightEyeOpen: 0,
  
  // Mouth state
  mouthOpen: 0,      // 0 = closed, 1 = wide open
  
  // Mouse tracking
  trackingEnabled: true,
  lookAtTarget: [0, 0, 5],
  
  // Position and rotation
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: 1,
  
  // Crack progression (0 to 1)
  crackProgress: 0,
  
  // Shatter state
  isShattered: false,
  shatterProgress: 0,
  
  // Transparency (for Creator Core scene)
  transparency: 0,   // 0 = solid, 1 = fully transparent
  
  // Reaction system
  currentReaction: null,
  reactionEndTime: 0,

  // Actions
  setVisible: (isVisible) => {
    set({ isVisible })
  },

  setOpacity: (opacity) => {
    set({ opacity: Math.max(0, Math.min(1, opacity)) })
  },

  setState: (state) => {
    set({ state })
  },

  setExpression: (expression) => {
    set({ expression })
  },

  setLeftEye: (value) => {
    set({ leftEyeOpen: Math.max(0, Math.min(1, value)) })
  },

  setRightEye: (value) => {
    set({ rightEyeOpen: Math.max(0, Math.min(1, value)) })
  },

  setBothEyes: (value) => {
    const clamped = Math.max(0, Math.min(1, value))
    set({ leftEyeOpen: clamped, rightEyeOpen: clamped })
  },

  blink: () => {
    set({ leftEyeOpen: 0, rightEyeOpen: 0 })
    setTimeout(() => {
      set({ leftEyeOpen: 1, rightEyeOpen: 1 })
    }, 150)
  },

  wink: (eye = 'right') => {
    if (eye === 'right') {
      set({ rightEyeOpen: 0 })
      setTimeout(() => set({ rightEyeOpen: 1 }), 300)
    } else {
      set({ leftEyeOpen: 0 })
      setTimeout(() => set({ leftEyeOpen: 1 }), 300)
    }
  },

  setMouthOpen: (value) => {
    set({ mouthOpen: Math.max(0, Math.min(1, value)) })
  },

  setTracking: (enabled) => {
    set({ trackingEnabled: enabled })
  },

  setLookAtTarget: (target) => {
    set({ lookAtTarget: target })
  },

  setPosition: (position) => {
    set({ position })
  },

  setRotation: (rotation) => {
    set({ rotation })
  },

  setScale: (scale) => {
    set({ scale })
  },

  setCrackProgress: (progress) => {
    set({ crackProgress: Math.max(0, Math.min(1, progress)) })
  },

  setShatterProgress: (progress) => {
    const clamped = Math.max(0, Math.min(1, progress))
    set({ 
      shatterProgress: clamped,
      isShattered: clamped > 0.5,
    })
  },

  setTransparency: (value) => {
    set({ transparency: Math.max(0, Math.min(1, value)) })
  },

  // Trigger a temporary reaction
  triggerReaction: (reactionName, duration = 2000) => {
    set({
      currentReaction: reactionName,
      reactionEndTime: Date.now() + duration,
    })
    
    setTimeout(() => {
      if (get().currentReaction === reactionName) {
        set({
          currentReaction: null,
          expression: 'neutral',
        })
      }
    }, duration)
  },

  reset: () => {
    set({
      isVisible: false,
      opacity: 1,
      state: 'closed',
      expression: 'neutral',
      leftEyeOpen: 0,
      rightEyeOpen: 0,
      mouthOpen: 0,
      trackingEnabled: true,
      lookAtTarget: [0, 0, 5],
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
      crackProgress: 0,
      isShattered: false,
      shatterProgress: 0,
      transparency: 0,
      currentReaction: null,
      reactionEndTime: 0,
    })
  },
}))