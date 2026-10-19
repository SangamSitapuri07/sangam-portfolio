// Custom Hook: useAudio
// Plays sound effects and ambient music using Howler.js
// Respects user audio preferences from useAudioStore

import { useEffect, useRef } from 'react'
import { useAudioStore } from '@/store/useAudioStore'

let HowlClass = null

// Lazy load Howler only in browser
if (typeof window !== 'undefined') {
  import('howler').then((module) => {
    HowlClass = module.Howl
  })
}

export const useAudio = () => {
  const soundsRef = useRef({})
  const isEnabled = useAudioStore(state => state.isEnabled)
  const getEffectiveVolume = useAudioStore(state => state.getEffectiveVolume)

  // Load a sound
  const loadSound = (id, src, options = {}) => {
    if (!HowlClass || soundsRef.current[id]) return

    soundsRef.current[id] = new HowlClass({
      src: [src],
      volume: getEffectiveVolume(options.type || 'effects'),
      loop: options.loop || false,
      preload: true,
      ...options,
    })
  }

  // Play a sound
  const play = (id, type = 'effects') => {
    if (!isEnabled) return
    
    const sound = soundsRef.current[id]
    if (!sound) {
      console.warn(`Sound "${id}" not loaded`)
      return
    }

    sound.volume(getEffectiveVolume(type))
    sound.play()
  }

  // Stop a sound
  const stop = (id) => {
    const sound = soundsRef.current[id]
    if (sound) sound.stop()
  }

  // Stop all sounds
  const stopAll = () => {
    Object.values(soundsRef.current).forEach(sound => {
      if (sound) sound.stop()
    })
  }

  // Update volumes when audio settings change
  useEffect(() => {
    Object.entries(soundsRef.current).forEach(([id, sound]) => {
      if (sound) {
        sound.volume(getEffectiveVolume('effects'))
      }
    })
  }, [isEnabled, getEffectiveVolume])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(soundsRef.current).forEach(sound => {
        if (sound) sound.unload()
      })
      soundsRef.current = {}
    }
  }, [])

  return { loadSound, play, stop, stopAll }
}