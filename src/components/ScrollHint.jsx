import { useEffect, useRef } from 'react'

import { onProgress, scrollToSection } from '@/lib/scrollEngine'

/**
 * ScrollHint — the quiet "scroll to explore" cue.
 *
 * Fades out as soon as the visitor starts moving (driven by the scroll loop, not
 * React), and doubles as a button: clicking it advances to the hero, which is a
 * kindness for anyone who does not think to scroll.
 */
export default function ScrollHint({ ready }) {
  const hintRef = useRef(null)

  useEffect(() => {
    const element = hintRef.current
    if (!element) return undefined

    let lastOpacity = -1
    const unsubscribe = onProgress((progress) => {
      // Gone by the time the hero is fully composed.
      const opacity = Math.max(0, 1 - progress / 0.075)
      if (Math.abs(opacity - lastOpacity) < 0.01) return
      lastOpacity = opacity
      element.style.opacity = String(opacity)
      element.style.transform = `translateY(${(1 - opacity) * 12}px)`
    })

    return unsubscribe
  }, [])

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 flex justify-center pb-8 transition-opacity duration-1000 sm:pb-10 ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div ref={hintRef} style={{ opacity: 1 }}>
        <button
          type="button"
          onClick={() => scrollToSection('home')}
          className="group flex flex-col items-center gap-2.5 rounded-2xl px-4 py-2 text-[0.6875rem] tracking-[0.24em] text-ink-faint uppercase transition-colors hover:text-ink-soft"
        >
          <span>Scroll to explore · drag to turn</span>
          <span aria-hidden="true" className="relative block h-8 w-px overflow-hidden bg-line">
            <span className="absolute inset-x-0 top-0 h-3 animate-[scrollcueline_2.2s_var(--ease-in-out-soft)_infinite] bg-accent" />
          </span>
        </button>
      </div>
    </div>
  )
}
