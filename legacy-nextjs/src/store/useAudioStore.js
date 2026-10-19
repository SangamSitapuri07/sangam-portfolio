// Audio Store
// Manages all sound state: enabled, volume, current track

import { create } from 'zustand'

export const useAudioStore = create((set, get) => ({
  // Master controls
  isEnabled: false,        // Sound off by default (best practice)
  hasUserChosenAudio: false, // Has user made a choice yet?
  
  // Volume controls (0 to 1)
  masterVolume: 0.5,
  ambientVolume: 0.3,
  effectsVolume: 0.6,
  voiceVolume: 0.8,
  
  // Current playing
  currentAmbient: null,
  isPlayingAmbient: false,
  
  // Loaded sounds tracker
  loadedSounds: new Set(),
  
  // Actions
  toggleAudio: () => {
    set((state) => ({
      isEnabled: !state.isEnabled,
      hasUserChosenAudio: true,
    }))
  },

  enableAudio: () => {
    set({
      isEnabled: true,
      hasUserChosenAudio: true,
    })
  },

  disableAudio: () => {
    set({
      isEnabled: false,
      hasUserChosenAudio: true,
    })
  },

  setMasterVolume: (volume) => {
    set({ masterVolume: Math.max(0, Math.min(1, volume)) })
  },

  setAmbientVolume: (volume) => {
    set({ ambientVolume: Math.max(0, Math.min(1, volume)) })
  },

  setEffectsVolume: (volume) => {
    set({ effectsVolume: Math.max(0, Math.min(1, volume)) })
  },

  setCurrentAmbient: (trackName) => {
    set({
      currentAmbient: trackName,
      isPlayingAmbient: trackName !== null,
    })
  },

  markSoundLoaded: (soundId) => {
    set((state) => ({
      loadedSounds: new Set([...state.loadedSounds, soundId]),
    }))
  },

  isSoundLoaded: (soundId) => {
    return get().loadedSounds.has(soundId)
  },

  // Calculate actual volume for a sound type
  getEffectiveVolume: (type = 'effects') => {
    const state = get()
    if (!state.isEnabled) return 0
    
    const typeVolume = {
      ambient: state.ambientVolume,
      effects: state.effectsVolume,
      voice: state.voiceVolume,
    }[type] || state.effectsVolume
    
    return state.masterVolume * typeVolume
  },

  reset: () => {
    set({
      isEnabled: false,
      hasUserChosenAudio: false,
      masterVolume: 0.5,
      ambientVolume: 0.3,
      effectsVolume: 0.6,
      voiceVolume: 0.8,
      currentAmbient: null,
      isPlayingAmbient: false,
      loadedSounds: new Set(),
    })
  },
}))