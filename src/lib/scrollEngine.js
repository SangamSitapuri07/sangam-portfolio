/**
 * The scroll engine.
 *
 * Responsibilities, in order of importance:
 *  1. Own the single source of progress: Lenis provides smooth scrolling,
 *     ScrollTrigger measures the page, and the two are kept in sync.
 *  2. Expose that progress as a mutable object (`sceneState`) that the WebGL
 *     scene reads inside `useFrame` — never through React state, so no component
 *     re-renders while the user scrolls.
 *  3. Damp progress and pointer once, here, so every consumer downstream gets the
 *     same smoothed values and no two systems can disagree.
 *  4. Let plain DOM nodes (the overlays, the progress bar) register tiny writer
 *     functions, which is far cheaper than re-rendering React 60 times a second.
 */

import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { damping as dampingConfig, scroll as scrollConfig, scrub } from '@/config/animation'
import { navProgressTargets, getActiveSceneIndex } from '@/lib/timeline'
import { prefersReducedMotion } from '@/lib/device'

gsap.registerPlugin(ScrollTrigger)

/** Frequently changing animation values. Never mirrored into React state. */
export const sceneState = {
  /** Raw scroll progress, 0 → 1. */
  progress: 0,
  /** Damped progress — what the scene actually reads. */
  smoothProgress: 0,
  /** Scroll velocity in px/s, useful for velocity-based flourishes. */
  velocity: 0,
  /** Pointer position, normalised to -1 → 1 (y is inverted so up is positive). */
  pointer: { x: 0, y: 0 },
  /** Damped pointer, read by the laptop's parallax. */
  pointerSmooth: { x: 0, y: 0 },
  /** 0 when the pointer is unavailable (touch), which disables parallax. */
  pointerStrength: 0,
  scrollY: 0,
  maxScroll: 1,
  activeScene: 0,
  running: false,
}

const listeners = {
  progress: new Set(),
  scene: new Set(),
  ready: new Set(),
}

let lenis = null
let trigger = null
let tickerFn = null
let initialized = false
let resizeTimer = null
let reducedMotion = false

const emit = (set, payload) => {
  for (const listener of set) listener(payload)
}

/* ------------------------------------------------------------------ *
 * Public subscriptions
 * ------------------------------------------------------------------ */

/** Called on every damped frame with the current progress. Use for DOM writers. */
export const onProgress = (listener) => {
  listeners.progress.add(listener)
  return () => listeners.progress.delete(listener)
}

/** Called only when the active scene index changes. Use for React state. */
export const onSceneChange = (listener) => {
  listeners.scene.add(listener)
  return () => listeners.scene.delete(listener)
}

export const onReady = (listener) => {
  listeners.ready.add(listener)
  return () => listeners.ready.delete(listener)
}

/* ------------------------------------------------------------------ *
 * Init / teardown
 * ------------------------------------------------------------------ */

const damp = (current, target, lambda, dt) => {
  // Frame-rate independent exponential smoothing.
  const t = 1 - Math.exp(-lambda * Math.max(dt, 0))
  return current + (target - current) * t
}

/**
 * @param {object} [options]
 * @param {HTMLElement|string} [options.scrollRoot] element whose height defines the film
 * @param {boolean} [options.reducedMotion]
 */
export function initScrollEngine({ scrollRoot = '#main-content', reducedMotion: rm } = {}) {
  if (initialized || typeof window === 'undefined') return api

  reducedMotion = rm ?? prefersReducedMotion()
  sceneState.running = true

  const root = typeof scrollRoot === 'string' ? document.querySelector(scrollRoot) : scrollRoot

  if (!reducedMotion) {
    lenis = new Lenis({
      duration: scrollConfig.duration,
      wheelMultiplier: scrollConfig.wheelMultiplier,
      touchMultiplier: scrollConfig.touchMultiplier,
      smoothWheel: true,
      smoothTouch: scrollConfig.smoothTouch,
      autoRaf: false,
      // Respect users who ask the OS to reduce transparency/motion at rest.
      anchors: false,
    })
    lenis.on('scroll', ScrollTrigger.update)
  }

  const measure = () => {
    sceneState.maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    )
  }

  /* The scene boundaries live in the DOM: one <section> per scene, each as tall
     as its share of the film. ScrollTrigger just measures that element. */
  trigger = ScrollTrigger.create({
    trigger: root || document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      sceneState.progress = self.progress
      sceneState.velocity = self.getVelocity()
      sceneState.scrollY = self.scroll()
    },
    onRefresh: (self) => {
      sceneState.progress = self.progress
      sceneState.scrollY = self.scroll()
      measure()
    },
  })

  measure()
  ScrollTrigger.refresh()

  /* Single rAF loop, driven by GSAP's ticker so it shares timing with any
     GSAP animations and stops when the tab is hidden. */
  tickerFn = (_time, deltaMs) => {
    const dt = Math.min(deltaMs, 50) / 1000

    const progressLambda = reducedMotion ? dampingConfig.reducedMotion * 3 : 8
    sceneState.smoothProgress = damp(sceneState.smoothProgress, sceneState.progress, progressLambda, dt)

    const pointerLambda = reducedMotion ? dampingConfig.reducedMotion : dampingConfig.pointer
    sceneState.pointerSmooth.x = damp(sceneState.pointerSmooth.x, sceneState.pointer.x, pointerLambda, dt)
    sceneState.pointerSmooth.y = damp(sceneState.pointerSmooth.y, sceneState.pointer.y, pointerLambda, dt)

    const active = getActiveSceneIndex(sceneState.smoothProgress)
    if (active !== sceneState.activeScene) {
      sceneState.activeScene = active
      emit(listeners.scene, active)
    }

    emit(listeners.progress, sceneState.smoothProgress)
  }

  gsap.ticker.add(tickerFn)
  gsap.ticker.lagSmoothing(0)

  window.addEventListener('resize', handleResize, { passive: true })
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerMove, { passive: true })
  document.addEventListener('focusin', handleFocusIn)
  document.addEventListener('visibilitychange', handleVisibility)

  initialized = true
  emit(listeners.ready, true)
  return api
}

function handleResize() {
  window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    ScrollTrigger.refresh()
    sceneState.maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    )
  }, 180)
}

function handlePointerMove(event) {
  if (reducedMotion) return
  sceneState.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  // Inverted: a pointer near the top of the screen should tilt the laptop back.
  sceneState.pointer.y = -((event.clientY / window.innerHeight) * 2 - 1)
}

function handleVisibility() {
  if (document.hidden) {
    gsap.ticker.remove(tickerFn)
  } else {
    gsap.ticker.add(tickerFn)
  }
}

/**
 * Keyboard users tabbing through the page should not fight smooth scrolling:
 * bring the focused element into view through the same path as a nav click.
 */
function handleFocusIn(event) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (target.dataset?.scrollIgnore !== undefined) return

  const rect = target.getBoundingClientRect()
  const offscreen = rect.top < 0 || rect.bottom > window.innerHeight
  if (!offscreen) return

  if (lenis) {
    lenis.scrollTo(target, { offset: -96, duration: 0.7, lock: false })
  } else {
    target.scrollIntoView({ block: 'center' })
  }
}

export function destroyScrollEngine() {
  if (!initialized || typeof window === 'undefined') return
  if (tickerFn) gsap.ticker.remove(tickerFn)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerdown', handlePointerMove)
  document.removeEventListener('focusin', handleFocusIn)
  document.removeEventListener('visibilitychange', handleVisibility)
  trigger?.kill()
  lenis?.destroy()
  trigger = null
  lenis = null
  initialized = false
  listeners.progress.clear()
  listeners.scene.clear()
}

/* ------------------------------------------------------------------ *
 * Commands
 * ------------------------------------------------------------------ */

/** Scroll to a nav target ('home' | 'about' | …) by scene id. */
export function scrollToSection(id, { duration = 1.15 } = {}) {
  const progress = navProgressTargets[id]
  if (progress === undefined) return
  scrollToProgress(progress, { duration })
}

/** Scroll to a normalised progress position. */
export function scrollToProgress(progress, { duration = 1.15 } = {}) {
  const y = Math.max(0, Math.min(sceneState.maxScroll, progress * sceneState.maxScroll))
  if (lenis) {
    lenis.scrollTo(y, {
      duration: reducedMotion ? 0.2 : duration,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      lock: false,
    })
    return
  }
  window.scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' })
}

/** Scroll to an element (used by "scroll to explore" and section anchors). */
export function scrollToElement(element, options = {}) {
  if (!element) return
  if (lenis) {
    lenis.scrollTo(element, { offset: options.offset ?? -80, duration: options.duration ?? 1.0 })
    return
  }
  element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
}

export function stopScroll() {
  lenis?.stop()
}

export function startScroll() {
  lenis?.start()
}

export const getLenis = () => lenis

export const isReducedMotion = () => reducedMotion

export const scrubValue = () => scrub.default

const api = {
  initScrollEngine,
  destroyScrollEngine,
  scrollToSection,
  scrollToProgress,
  scrollToElement,
  stopScroll,
  startScroll,
  getLenis,
  isReducedMotion,
  onProgress,
  onSceneChange,
  onReady,
  sceneState,
}

export default api
