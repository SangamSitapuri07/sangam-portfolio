import { useMemo } from 'react'

import { cssBackground } from '@/config/scrim'

/**
 * CopyShield — the dark that the words sit on.
 *
 * The machine fills the viewport now, so the copy is always over it. Rather than
 * hoping the shot happens to be dark in the bottom-left corner, the film carries a
 * measured shield between the canvas and the text: two washes whose stops live in
 * `config/scrim.js`, the same stops `tools/preview-composition.mjs` samples to
 * prove the copy clears 4.5:1 against the brightest surface the scene can put
 * behind it.
 *
 * It is inert: no pointer events, nothing to focus, nothing for a screen reader.
 */
export default function CopyShield({ variant = 'desktop' }) {
  const background = useMemo(() => cssBackground(variant === 'mobile' ? 'mobile' : 'desktop'), [variant])

  return (
    <div
      aria-hidden="true"
      data-copy-shield
      className="pointer-events-none fixed inset-0 z-10"
      style={{ background }}
    />
  )
}
