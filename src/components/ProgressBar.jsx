import { useEffect, useRef } from 'react'

import { onProgress } from '@/lib/scrollEngine'

/**
 * ProgressBar — a 2px accent line across the top of the viewport.
 *
 * Written straight to the DOM by the scroll engine's own loop: no React state, no
 * re-render, and it uses `scaleX` so the browser can composite it on the GPU.
 */
export default function ProgressBar({ ready }) {
  const barRef = useRef(null)

  useEffect(() => {
    const element = barRef.current
    if (!element) return undefined

    let last = -1
    const unsubscribe = onProgress((progress) => {
      // Only touch the DOM when the bar would visibly move.
      if (Math.abs(progress - last) < 0.001) return
      last = progress
      element.style.transform = `scaleX(${progress})`
      element.parentElement?.setAttribute('aria-valuenow', String(Math.round(progress * 100)))
    })

    return unsubscribe
  }, [])

  return (
    <div
      className={`fixed inset-x-0 top-0 z-[60] h-px transition-opacity duration-700 ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-accent-deep via-accent to-accent-bright"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}
