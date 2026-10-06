// Master Scene Configuration
// Controls when each scene appears based on scroll position (0 to 1)

export const SCENES = {
  LOADING: {
    id: 'loading',
    label: 'Loading',
    scrollStart: null,
    scrollEnd: null,
    duration: 4000,
  },

  AWAKENING: {
    id: 'awakening',
    label: 'Awakening',
    scrollStart: 0,
    scrollEnd: 0.12,
    subScenes: {
      DARKNESS:    { start: 0,    end: 0.02 },
      FIRST_EYE:   { start: 0.02, end: 0.05 },
      SECOND_EYE:  { start: 0.05, end: 0.08 },
      FULL_REVEAL: { start: 0.08, end: 0.10 },
      INTERACTIVE: { start: 0.10, end: 0.12 },
    },
  },

  CRACKS: {
    id: 'cracks',
    label: 'Cracks',
    scrollStart: 0.12,
    scrollEnd: 0.18,
    subScenes: {
      FIRST_CRACK:  { start: 0.12, end: 0.13 },
      SPREADING:    { start: 0.13, end: 0.15 },
      FULL_CRACKED: { start: 0.15, end: 0.16 },
      SHATTERING:   { start: 0.16, end: 0.17 },
      DEBRIS:       { start: 0.17, end: 0.18 },
    },
  },

  ORIGIN: {
    id: 'origin',
    label: 'Origin',
    scrollStart: 0.18,
    scrollEnd: 0.30,
    subScenes: {
      REFORM:       { start: 0.18, end: 0.21 },
      MEMORIES_IN:  { start: 0.21, end: 0.24 },
      INTERACTIVE:  { start: 0.24, end: 0.27 },
      MEMORIES_OUT: { start: 0.27, end: 0.30 },
    },
  },

  CREATIONS: {
    id: 'creations',
    label: 'Creations',
    scrollStart: 0.30,
    scrollEnd: 0.58,
    projects: {
      NEWS_PINCH:    { start: 0.30, end: 0.36 },
      DOT_CONNECT:   { start: 0.36, end: 0.42 },
      AI_DEBATE:     { start: 0.42, end: 0.48 },
      CAFE_BILLING:  { start: 0.48, end: 0.53 },
      POLITY_NOTES:  { start: 0.53, end: 0.58 },
    },
  },

  INSIDE_MIND: {
    id: 'inside-mind',
    label: 'Inside The Mind',
    scrollStart: 0.58,
    scrollEnd: 0.72,
    subScenes: {
      MOUTH_ENTRY:  { start: 0.58, end: 0.62 },
      NEURAL_WORLD: { start: 0.62, end: 0.70 },
      EXIT_EYE:     { start: 0.70, end: 0.72 },
    },
  },

  TIMELINE: {
    id: 'timeline',
    label: 'Timeline',
    scrollStart: 0.72,
    scrollEnd: 0.82,
  },

  CREATOR_CORE: {
    id: 'creator-core',
    label: 'Creator Core',
    scrollStart: 0.82,
    scrollEnd: 0.90,
    pipeline: {
      DREAM:   { start: 0.82, end: 0.84 },
      IDEA:    { start: 0.84, end: 0.86 },
      CODE:    { start: 0.86, end: 0.88 },
      PRODUCT: { start: 0.88, end: 0.89 },
      IMPACT:  { start: 0.89, end: 0.90 },
    },
  },

  CONTACT: {
    id: 'contact',
    label: 'Contact',
    scrollStart: 0.90,
    scrollEnd: 1.00,
    subScenes: {
      TRANSITION_IN: { start: 0.90, end: 0.92 },
      DISSOLVE:      { start: 0.92, end: 0.95 },
      CODE_FORMS:    { start: 0.95, end: 0.97 },
      REFORM:        { start: 0.97, end: 0.99 },
      FAREWELL:      { start: 0.99, end: 1.00 },
    },
  },
}

// Helper: Get current scene based on scroll position
export const getSceneAtProgress = (progress) => {
  return Object.values(SCENES).find(scene => 
    scene.scrollStart !== null &&
    progress >= scene.scrollStart && 
    progress < scene.scrollEnd
  )
}

// Helper: Get progress within current scene (0 to 1)
export const getSceneProgress = (globalProgress, scene) => {
  if (!scene.scrollStart && scene.scrollStart !== 0) return 0
  const range = scene.scrollEnd - scene.scrollStart
  const local = globalProgress - scene.scrollStart
  return Math.max(0, Math.min(1, local / range))
}