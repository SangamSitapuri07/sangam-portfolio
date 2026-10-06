// Custom Hook: useEasterEggs
// Listens for secret keyboard combinations and triggers fun reactions

import { useEffect, useRef } from 'react'
import { useFaceStore } from '@/store/useFaceStore'

export const useEasterEggs = () => {
  const typedRef = useRef('')
  const konamiRef = useRef([])
  const triggerReaction = useFaceStore(state => state.triggerReaction)
  const setExpression = useFaceStore(state => state.setExpression)
  const wink = useFaceStore(state => state.wink)
  const setMouthOpen = useFaceStore(state => state.setMouthOpen)

  useEffect(() => {
    // Words that trigger reactions
    const secretWords = {
      'hello': () => {
        setExpression('welcoming')
        setMouthOpen(0.5)
        setTimeout(() => setMouthOpen(0), 300)
        triggerReaction('saying-hi', 2000)
        console.log('👋 Hello back!')
      },
      
      'sangam': () => {
        setExpression('proud')
        triggerReaction('hearing-name', 3000)
        console.log('✨ You said my name!')
      },
      
      'wink': () => {
        wink('right')
        console.log('😉')
      },
      
      'play': () => {
        triggerReaction('excited', 2000)
        console.log('🎮 Want to play Dot and Connect?')
        // Will scroll to game section when built
      },
      
      'awesome': () => {
        setExpression('celebrating')
        triggerReaction('celebrating', 3000)
        console.log('🎉 You are awesome too!')
      },
    }

    // Konami code sequence
    const konamiCode = [
      'ArrowUp', 'ArrowUp',
      'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight',
      'ArrowLeft', 'ArrowRight',
      'b', 'a'
    ]

    const handleKeyDown = (event) => {
      // Track Konami code
      konamiRef.current = [...konamiRef.current, event.key].slice(-10)
      
      if (konamiRef.current.join(',') === konamiCode.join(',')) {
        setExpression('amazed')
        triggerReaction('konami-unlocked', 5000)
        console.log('🎮 KONAMI CODE ACTIVATED! 🎮')
        konamiRef.current = []
      }

      // Track typed words (only letters)
      if (/^[a-zA-Z]$/.test(event.key)) {
        typedRef.current = (typedRef.current + event.key.toLowerCase()).slice(-20)
        
        // Check if any secret word was typed
        for (const word in secretWords) {
          if (typedRef.current.endsWith(word)) {
            secretWords[word]()
            typedRef.current = ''
            break
          }
        }
      }

      // Clear typed buffer on certain keys
      if (event.key === 'Escape' || event.key === 'Enter') {
        typedRef.current = ''
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [setExpression, triggerReaction, wink, setMouthOpen])
}