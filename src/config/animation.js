/**
 * Animation constants — every duration, easing and damping value in one place.
 *
 * The whole experience is driven by ONE normalised scroll progress value
 * (0 → 1). These numbers describe how that value is smoothed, how fast the
 * camera catches up, and how the DOM overlays move.
 */

/** Damping lambdas for exponential smoothing (higher = tighter, less lag). */
export const damping = {
  camera: 4.2,
  cameraTarget: 4.6,
  laptop: 3.6,
  lid: 3.9,
  glow: 2.4,
  /** Pointer parallax must feel looser than scroll so it never fights it. */
  pointer: 3.4,
  /** Reduced-motion builds use a much stiffer follow so nothing visually drifts. */
  reducedMotion: 9,
}

/** ScrollTrigger scrub smoothing, in seconds. */
export const scrub = {
  default: 0.85,
  /** Mobile scroll events are chunkier, so a slightly longer scrub reads better. */
  mobile: 1.1,
}

/** GSAP easings used by DOM overlays and one-off entrance animations. */
export const easing = {
  outExpo: 'expo.out',
  outQuint: 'quint.out',
  outSoft: 'power3.out',
  inOutSoft: 'power2.inOut',
  none: 'none',
}

/** Overlay (DOM) animation timing, as a fraction of each scene's own range. */
export const overlay = {
  /** Fade/rise in over the first fraction of a scene. */
  enter: 0.3,
  /** Hold the scene fully visible for the middle. */
  hold: 0.45,
  /** Fade out over the last fraction. */
  exit: 0.25,
  /** Vertical travel in rem while entering/leaving. */
  travel: 1.5,
  /** The first and last scenes stay put instead of fading fully away. */
  pinFirst: true,
  pinLast: true,
}

/** Loader behaviour. */
export const loader = {
  /** Never sit on 100% for less than this, so the finish reads as deliberate. */
  minDisplayMs: 900,
  /** Extra beat after assets resolve, before the loader fades. */
  settleMs: 320,
  /** Loader fade duration. */
  fadeMs: 620,
  /** Progress counts up at most this fast (percent per second) so it looks real. */
  maxRatePerSecond: 55,
}

/** Lenis smooth-scroll feel. */
export const scroll = {
  /** Seconds of "glide" after a wheel gesture. */
  duration: 1.05,
  wheelMultiplier: 0.95,
  touchMultiplier: 1.7,
  /** Used by touch devices, where Lenis' smoothing can feel rubbery. */
  smoothTouch: false,
}

/** Reduced-motion equivalents. The content is identical; the motion is not. */
export const reducedMotion = {
  /** Camera still moves between scenes, but only ~18% of the distance. */
  cameraTravelScale: 0.18,
  /** Lid opens once and stays put. */
  lidTravelScale: 0.25,
  /** No pointer parallax, no postprocessing, no long scroll length. */
  parallax: false,
  postprocessing: false,
  /** Shorter page = less scrolling to reach the same content. */
  scrollLengthScale: 0.5,
}

export default { damping, scrub, easing, overlay, loader, scroll, reducedMotion }
