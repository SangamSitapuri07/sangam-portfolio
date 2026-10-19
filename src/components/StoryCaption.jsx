import { useEffect, useMemo, useRef } from 'react'

import { scenes } from '@/config/scenes'
import { partByUnit } from '@/config/parts'
import { focusAt, sceneLocalAt } from '@/lib/timeline'
import { onProgress } from '@/lib/scrollEngine'

/**
 * StoryCaption — the words that belong to the part the camera is on.
 *
 * Scene 03 stops on the display, the keyboard, the deck and the bottom shell, and
 * each stop is a claim about the portfolio. The camera frames the part, the part
 * travels a little further out, and this block fades in the matching line. All
 * three read one value: `focusAt()` from the timeline, which is a pure function of
 * scroll progress. That is why the caption cannot drift out of sync with the
 * component it describes.
 *
 * The fades are written straight to the DOM from the scroll subscription, so a
 * cross-fade costs no React renders and scrubbing backwards is exact.
 */
export default function StoryCaption({ sceneId }) {
  const index = scenes.findIndex((scene) => scene.id === sceneId)
  const scene = scenes[index]
  const beats = useMemo(() => scene?.story ?? [], [scene])
  const refs = useRef([])

  useEffect(() => {
    if (!beats.length) return undefined
    const last = new Array(beats.length).fill(-1)

    return onProgress((progress) => {
      const active = focusAt(scene, sceneLocalAt(index, progress))
      beats.forEach((beat, slot) => {
        const element = refs.current[slot]
        if (!element) return
        const on = active.part === beat.part ? Math.min(1, active.weight * 1.4) : 0
        if (Math.abs(on - last[slot]) < 0.004) return
        last[slot] = on
        element.style.opacity = on.toFixed(3)
        element.style.transform = `translate3d(0, ${((1 - on) * 10).toFixed(1)}px, 0)`
        element.style.visibility = on <= 0.002 ? 'hidden' : 'visible'
      })
    })
  }, [beats, index, scene])

  if (!beats.length) return null

  return (
    <div className="relative">
      {/* Reserve the height of the tallest beat so the copy below never jumps as
          one caption cross-fades into the next. */}
      <div className="relative min-h-[7.5rem] sm:min-h-[7rem]">
        {beats.map((beat, slot) => {
          const entry = partByUnit[beat.part]
          if (!entry) return null
          return (
            <div
              key={beat.part}
              ref={(node) => {
                refs.current[slot] = node
              }}
              aria-hidden="true"
              className="absolute inset-0 will-change-[opacity,transform]"
              style={{ opacity: 0, visibility: 'hidden' }}
            >
              <p className="flex items-baseline gap-2 font-mono text-[0.6875rem] tracking-[0.18em] text-accent-bright uppercase">
                <span className="tabular-nums">{entry.index}</span>
                <span className="text-ink-faint">/</span>
                <span>{entry.pillar}</span>
              </p>
              <p className="mt-2 text-lg leading-snug font-medium text-ink sm:text-xl">{entry.title}</p>
              <p className="mt-1.5 max-w-[42ch] text-sm leading-relaxed text-ink-soft">{entry.line}</p>
            </div>
          )
        })}
      </div>
      {/* The beats are decorative repetition of the accessible copy below; the
          chapter's own prose carries the same claims for readers who never scroll. */}
      <ol className="sr-only">
        {beats.map((beat) => {
          const entry = partByUnit[beat.part]
          return entry ? (
            <li key={beat.part}>
              {entry.title} — {entry.line}
            </li>
          ) : null
        })}
      </ol>
    </div>
  )
}
