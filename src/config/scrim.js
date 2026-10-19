/**
 * The readability shield.
 *
 * The machine is now the background: it fills the viewport, it is lit, and at some
 * points its brightest surface — the emissive display — passes directly behind the
 * copy. Glowing cyan behind body text at 12px is unreadable, so the film carries a
 * shield between the canvas and the words.
 *
 * It is defined here rather than in a class name for one reason: the shield is a
 * *measured* property, not a colour choice. `alphaAt()` answers "how much is the
 * canvas dimmed at this point of the screen", the DOM builds its gradients from the
 * same stops, and `tools/preview-composition.mjs` samples the copy rectangle to
 * prove the words always sit on at least `minAlpha`. If a future scene moves the
 * copy, the check fails before anyone has to squint at a screenshot.
 *
 * Two gradients, because one is not enough on a wide screen: a bottom-up wash that
 * keeps the lower third dark, and a left wash that keeps the text column dark even
 * where the display is at its brightest.
 */

export const scrim = {
  color: '#05060a',
  /* [y from the top, alpha] — stops for the vertical wash. */
  vertical: {
    desktop: [
      [1.0, 0.97],
      [0.66, 0.94],
      [0.46, 0.78],
      [0.3, 0.0],
    ],
    mobile: [
      [1.0, 0.98],
      [0.72, 0.96],
      [0.52, 0.86],
      [0.4, 0.0],
    ],
  },
  /* [x from the left, alpha] — stops for the horizontal wash. */
  horizontal: {
    desktop: [
      [0.0, 0.92],
      [0.3, 0.8],
      [0.44, 0.55],
      [0.58, 0.1],
      [0.7, 0.0],
    ],
    /* A phone has no spare column: the wash is a whisper, and the vertical one
       does the work. */
    mobile: [
      [0.0, 0.5],
      [0.5, 0.15],
      [0.8, 0.0],
    ],
  },
  /** No point in the copy rectangle may be shielded less than this. */
  minAlpha: 0.62,
}

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value)

/* Stops are authored in reading order (bottom-up for the vertical wash), which is
   descending position. Sample them in ascending order, cached per list. */
const ordered = new WeakMap()
function sortedStops(stops) {
  let list = ordered.get(stops)
  if (!list) {
    list = [...stops].sort((a, b) => a[0] - b[0])
    ordered.set(stops, list)
  }
  return list
}

/** Alpha of a stop list at `position`, linearly interpolated, 0 outside. */
export function stopsAt(stops, position) {
  if (!stops?.length) return 0
  const list = sortedStops(stops)
  if (position <= list[0][0]) return list[0][1]
  for (let i = 1; i < list.length; i += 1) {
    const [p1, a1] = list[i]
    const [p0, a0] = list[i - 1]
    if (position <= p1) {
      const span = Math.max(p1 - p0, 1e-6)
      return a0 + (a1 - a0) * clamp01((position - p0) / span)
    }
  }
  return list[list.length - 1][1]
}

/**
 * How opaque the shield is at a screen point (0…1 fractions, y down).
 *
 * The two washes are composited the way the browser will composite them, so the
 * number the check sees is the number the visitor gets.
 */
export function alphaAt(x, y, variant = 'desktop') {
  const vertical = stopsAt(scrim.vertical[variant] || scrim.vertical.desktop, y)
  const horizontal = stopsAt(scrim.horizontal[variant] || scrim.horizontal.desktop, x)
  return 1 - (1 - vertical) * (1 - horizontal)
}

/** The same washes as CSS, built from the same stops. */
export function cssBackground(variant = 'desktop') {
  const px = (value) => `${(value * 100).toFixed(1)}%`
  const rgba = (alpha) => {
    const r = parseInt(scrim.color.slice(1, 3), 16)
    const g = parseInt(scrim.color.slice(3, 5), 16)
    const b = parseInt(scrim.color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const vertical = scrim.vertical[variant] || scrim.vertical.desktop
  const horizontal = scrim.horizontal[variant] || scrim.horizontal.desktop

  /* Stops are authored top-down (`y` from the top); a `to top` gradient counts
     from the bottom. Flip the position, and emit in ascending order — CSS clamps a
     stop that moves backwards to the previous one, which would flatten the wash
     into a hard edge at the copy line. */
  const toTop = [...vertical]
    .map(([y, a]) => `${rgba(a)} ${px(1 - y)}`)
    .sort((a, b) => parseFloat(a.split(' ').pop()) - parseFloat(b.split(' ').pop()))
    .join(', ')
  const toRight = horizontal.map(([x, a]) => `${rgba(a)} ${px(x)}`).join(', ')

  return `linear-gradient(to top, ${toTop}), linear-gradient(to right, ${toRight})`
}

/** Lowest shield value across a rectangle (its four corners and its centre). */
export function minAlphaOver(rect, variant = 'desktop') {
  const xs = [rect.left, (rect.left + rect.right) / 2, rect.right]
  const ys = [rect.top, (rect.top + rect.bottom) / 2, rect.bottom]
  let min = 1
  for (const x of xs) for (const y of ys) min = Math.min(min, alphaAt(x, y, variant))
  return min
}

export default scrim
