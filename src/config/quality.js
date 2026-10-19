/**
 * Quality tiers.
 *
 * The renderer picks a tier from the device's own signals (see `lib/device.js`)
 * and every expensive feature reads its settings from here. Nothing else in the
 * codebase hard-codes a DPR, a shadow setting or a post-processing flag.
 */

export const tiers = {
  /**
   * Full cinematic treatment. Desktop-class GPUs, or a good integrated chip.
   */
  high: {
    id: 'high',
    dpr: [1, 2],
    shadows: true,
    shadowMapSize: 1024,
    /** Postprocessing: subtle bloom + vignette + film grain. */
    postprocessing: {
      enabled: true,
      bloom: { intensity: 0.62, threshold: 0.72, smoothing: 0.32, mipmapBlur: true },
      vignette: { darkness: 0.42, offset: 0.32 },
      noise: { opacity: 0.032, blendFunction: 'overlay' },
    },
    /** Extra 3D flourishes. */
    statusPanel: true,
    glassOverlay: true,
    contactShadow: true,
    /** Screen canvas textures render at full resolution. */
    screenQuality: 1,
    /** Animated detail on the laptop screen (caret blink, activity graph). */
    screenAnimation: true,
  },

  /**
   * Laptops and tablets. Same composition, cheaper pixels.
   */
  medium: {
    id: 'medium',
    dpr: [1, 1.6],
    shadows: true,
    shadowMapSize: 512,
    postprocessing: {
      enabled: true,
      bloom: { intensity: 0.52, threshold: 0.78, smoothing: 0.3, mipmapBlur: true },
      vignette: { darkness: 0.36, offset: 0.3 },
      noise: { opacity: 0.022, blendFunction: 'overlay' },
    },
    statusPanel: true,
    glassOverlay: true,
    contactShadow: true,
    screenQuality: 0.85,
    screenAnimation: true,
  },

  /**
   * Phones, and anything that failed a frame-time probe. No post-processing at
   * all — bloom on a small screen costs more than it gives.
   */
  low: {
    id: 'low',
    dpr: [1, 1.5],
    /** Bug fix + honest mapping: at 1.5 max DPR, mobile stays sharp without cooking the GPU. */
    shadows: false,
    shadowMapSize: 256,
    postprocessing: { enabled: false },
    statusPanel: false,
    glassOverlay: false,
    contactShadow: true,
    screenQuality: 0.7,
    screenAnimation: false,
  },
}

/** Which tier to start from, before any measurement. */
export const initialTierRules = {
  /** Viewports narrower than this start at `low`. */
  mobileWidth: 768,
  /** Viewports narrower than this start at `medium`. */
  tabletWidth: 1280,
  /** `navigator.hardwareConcurrency` at or below this starts one tier lower. */
  lowCoreCount: 4,
  /** `navigator.deviceMemory` (GB) at or below this starts one tier lower. */
  lowMemoryGb: 4,
}

/**
 * Runtime auto-tuning. If the first ~2 seconds of frames are consistently slow,
 * the renderer drops a tier once (and only once) — better a smooth simple scene
 * than a stuttering rich one.
 */
export const autoTune = {
  enabled: true,
  /** Frames sampled before judging. */
  sampleFrames: 90,
  /** Average frame time (ms) above which we drop a tier. */
  slowFrameMs: 26,
  /** Frame time below which we may consider going back up (currently unused). */
  fastFrameMs: 13,
}

/** Desktop vs mobile pixel-ratio ceilings, quoted in the brief. */
export const dprCeiling = {
  desktop: 2,
  mobile: 1.5,
}

export default { tiers, initialTierRules, autoTune, dprCeiling }
