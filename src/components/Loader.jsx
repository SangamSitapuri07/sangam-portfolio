import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'

import { profile } from '@/data/profile'
import { loader as loaderConfig } from '@/config/animation'

/**
 * Loader — the handshake before the film starts.
 *
 * Reads Drei's asset progress (the model is the only heavy download), counts the
 * percentage up at a believable rate, and only then fades away. The 3D scene is
 * already rendering behind it, so the transition is a dissolve rather than a jump.
 *
 * If assets never resolve — a 404, a parse failure, a dead network — a watchdog
 * releases the loader anyway. The site must never be held hostage by one file.
 */

const WATCHDOG_MS = 14000

export default function Loader({ onComplete }) {
  const { progress, active } = useProgress()
  const [displayed, setDisplayed] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [done, setDone] = useState(false)

  const startedAt = useRef(typeof performance === 'undefined' ? 0 : performance.now())
  const displayedRef = useRef(0)
  const frameRef = useRef(0)

  /* Count the number up. While assets are still in flight it is capped at 92%, so
   * the number never lies about being finished. */
  useEffect(() => {
    if (done) return undefined

    let raf = 0
    let previous = performance.now()
    let idleSince = active ? 0 : performance.now()

    const tick = (now) => {
      const dt = Math.min(now - previous, 100) / 1000
      previous = now

      if (!active && !idleSince) idleSince = now
      if (active) idleSince = 0

      const stalled = idleSince && now - idleSince > 450
      const elapsedEnough = now - startedAt.current > loaderConfig.minDisplayMs
      const timedOut = now - startedAt.current > WATCHDOG_MS

      const target = !active || stalled || timedOut ? 100 : Math.min(progress, 92)

      const maxStep = loaderConfig.maxRatePerSecond * dt
      const next = Math.min(displayedRef.current + maxStep, target)
      if (next !== displayedRef.current) {
        displayedRef.current = next
        setDisplayed(Math.round(next))
      }

      const canFinish =
        next >= 100 && (!active || stalled || timedOut) && elapsedEnough

      if (canFinish && !leaving) {
        setLeaving(true)
        window.setTimeout(() => {
          setDone(true)
          onComplete?.()
        }, loaderConfig.settleMs + loaderConfig.fadeMs)
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    frameRef.current = raf
    return () => cancelAnimationFrame(raf)
  }, [active, progress, leaving, done, onComplete])

  if (done) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-void/95 transition-opacity ease-[var(--ease-out-expo)]"
      style={{
        opacity: leaving ? 0 : 1,
        transitionDuration: `${loaderConfig.fadeMs}ms`,
        pointerEvents: leaving ? 'none' : 'auto',
      }}
      role="status"
      aria-live="polite"
    >
      {/* A quiet vignette so the 3D scene glows through the black */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 120%, rgba(75,140,255,0.16) 0%, rgba(124,92,255,0.08) 32%, rgba(5,6,10,0) 70%)',
        }}
      />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-8 px-8">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-accent/30 bg-surface-2/60 text-lg font-semibold tracking-wide text-ink backdrop-blur-sm">
          {profile.initials}
        </div>

        <div className="space-y-1.5 text-center">
          <p className="text-[0.8125rem] tracking-[0.28em] text-ink-soft uppercase">
            {profile.name}
          </p>
          <p className="text-[0.6875rem] tracking-[0.2em] text-ink-faint uppercase">
            {profile.role}
          </p>
        </div>

        <div className="w-full space-y-3">
          <div
            className="h-px w-full overflow-hidden bg-line"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={displayed}
            aria-label="Loading the 3D portfolio"
          >
            <div
              className="h-full origin-left bg-gradient-to-r from-accent-deep via-accent to-accent-bright transition-transform duration-200 ease-linear"
              style={{ transform: `scaleX(${displayed / 100})` }}
            />
          </div>

          <div className="flex items-baseline justify-between font-mono text-[0.6875rem] text-ink-faint">
            <span>{active ? 'Loading assets' : 'Preparing scene'}</span>
            <span className="tabular-nums text-ink-soft">{String(displayed).padStart(3, '0')}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
