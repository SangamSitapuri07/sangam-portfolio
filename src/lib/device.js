/**
 * Device capability detection: picks a quality tier, a pixel-ratio ceiling and
 * the layout variant everything else reads.
 *
 * Deliberately dependency-free and safe to call before React mounts.
 */

import { tiers, initialTierRules, dprCeiling } from '@/config/quality'

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1280,
}

/** True when the pointer cannot hover (phones, tablets). */
export function isTouchDevice() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: none), (pointer: coarse)').matches
}

/** True when the user asked for reduced motion at the OS level. */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** True when the browser claims the data-saver setting is on. */
export function prefersReducedData() {
  if (typeof navigator === 'undefined') return false
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!connection) return false
  return Boolean(connection.saveData) || /2g|slow-2g|3g/.test(connection.effectiveType || '')
}

/**
 * WebGL availability probe. Returns `{ ok, renderer, reason }`; when `ok` is
 * false the app renders the static HTML portfolio instead of a blank canvas.
 */
export function probeWebGL() {
  if (typeof document === 'undefined') return { ok: false, renderer: null, reason: 'no-dom' }
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('experimental-webgl')
    if (!gl) return { ok: false, renderer: null, reason: 'no-context' }
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null
    const lose = gl.getExtension('WEBGL_lose_context')
    lose?.loseContext()
    return { ok: true, renderer, reason: null }
  } catch (error) {
    return { ok: false, renderer: null, reason: error?.message || 'threw' }
  }
}

function scoreTier({ width, cores, memory, touch, reducedData }) {
  let score = 3 // start at `high`

  if (width < initialTierRules.tabletWidth) score = Math.min(score, 2)
  if (width < initialTierRules.mobileWidth) score = Math.min(score, 1)
  if (touch && width < initialTierRules.tabletWidth) score = Math.min(score, 1)

  if (typeof cores === 'number' && cores <= initialTierRules.lowCoreCount) score -= 1
  if (typeof memory === 'number' && memory <= initialTierRules.lowMemoryGb) score -= 1
  if (reducedData) score -= 1

  return Math.max(1, Math.min(3, score))
}

const TIER_BY_SCORE = { 1: tiers.low, 2: tiers.medium, 3: tiers.high }

/**
 * Resolve the initial render settings for this device.
 * @returns {{tier: object, variant: 'mobile'|'tablet'|'desktop', reducedMotion: boolean, touch: boolean}}
 */
export function detectDevice() {
  if (typeof window === 'undefined') {
    return { tier: tiers.high, variant: 'desktop', reducedMotion: false, touch: false }
  }

  const width = window.innerWidth
  const touch = isTouchDevice()
  const reducedMotion = prefersReducedMotion()
  const cores = navigator.hardwareConcurrency
  const memory = navigator.deviceMemory

  const score = scoreTier({
    width,
    cores,
    memory,
    touch,
    reducedData: prefersReducedData(),
  })

  const variant = width < BREAKPOINTS.mobile ? 'mobile' : width < BREAKPOINTS.tablet ? 'tablet' : 'desktop'

  return { tier: TIER_BY_SCORE[score] || tiers.high, variant, reducedMotion, touch }
}

/** Cap the device pixel ratio per tier and the brief's ceiling. */
export function resolveDpr(tier, variant) {
  const ceiling = variant === 'mobile' ? dprCeiling.mobile : dprCeiling.desktop
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  const [min, max] = tier.dpr
  return Math.min(Math.max(Math.min(dpr, ceiling), min), max)
}

/** The next tier down, used by the frame-time auto-tuner. */
export function tierDown(tier) {
  if (tier.id === 'high') return tiers.medium
  if (tier.id === 'medium') return tiers.low
  return tiers.low
}

export default { detectDevice, probeWebGL, resolveDpr, tierDown, isTouchDevice, prefersReducedMotion }
