// Performance Configuration
// Defines quality tiers for different devices

export const QUALITY_TIERS = {
  HIGH: {
    label: 'High',
    targetFPS: 60,
    particles: {
      face: 15000,
      ambient: 2000,
      transitions: 10000,
    },
    textures: {
      face: 2048,
      environment: 1024,
    },
    shadows: true,
    postProcessing: {
      bloom: true,
      chromaticAberration: true,
      depthOfField: true,
      filmGrain: true,
      vignette: true,
    },
    facePolygons: 50000,
    antialias: true,
    dpr: [1, 2],
  },

  MEDIUM: {
    label: 'Medium',
    targetFPS: 45,
    particles: {
      face: 8000,
      ambient: 1000,
      transitions: 5000,
    },
    textures: {
      face: 1024,
      environment: 512,
    },
    shadows: false,
    postProcessing: {
      bloom: true,
      chromaticAberration: false,
      depthOfField: false,
      filmGrain: false,
      vignette: true,
    },
    facePolygons: 25000,
    antialias: true,
    dpr: [1, 1.5],
  },

  LOW: {
    label: 'Low',
    targetFPS: 30,
    particles: {
      face: 4000,
      ambient: 500,
      transitions: 2000,
    },
    textures: {
      face: 512,
      environment: 256,
    },
    shadows: false,
    postProcessing: {
      bloom: false,
      chromaticAberration: false,
      depthOfField: false,
      filmGrain: false,
      vignette: false,
    },
    facePolygons: 10000,
    antialias: false,
    dpr: [1, 1],
  },

  FALLBACK: {
    label: 'Fallback',
    use2DFallback: true,
  },
}

// Auto-detect quality tier based on device
export const detectQualityTier = () => {
  if (typeof window === 'undefined') return QUALITY_TIERS.MEDIUM

  const memory = navigator.deviceMemory || 4
  const cores = navigator.hardwareConcurrency || 4
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)

  if (isMobile) {
    if (memory >= 6 && cores >= 8) return QUALITY_TIERS.MEDIUM
    if (memory >= 4) return QUALITY_TIERS.LOW
    return QUALITY_TIERS.FALLBACK
  }

  if (memory >= 8 && cores >= 8) return QUALITY_TIERS.HIGH
  if (memory >= 4) return QUALITY_TIERS.MEDIUM
  return QUALITY_TIERS.LOW
}

// Color palette for the entire portfolio
export const COLORS = {
  background: {
    void: '#000000',
    space: '#0a0a1a',
    deep: '#050510',
  },
  brand: {
    energy: '#00d4ff',
    power: '#8b5cf6',
    accent: '#ffd700',
  },
  face: {
    skin: '#d4a574',
    digital: '#4a90d9',
    veins: '#00d4ff',
  },
  cracks: {
    light: '#ffffff',
    energy: '#00d4ff',
    power: '#8b5cf6',
  },
  particles: {
    core: '#ffffff',
    trail: '#4a9eff',
    accent: '#ffd700',
    energy: '#00ffff',
  },
  text: {
    primary: '#ffffff',
    secondary: '#888888',
    accent: '#4a90ff',
  },
  projects: {
    newsPinch: '#1a73e8',
    dotConnect: '#34a853',
    aiDebate: '#8b5cf6',
    cafeBilling: '#f59e0b',
    polityNotes: '#dc2626',
  },
}