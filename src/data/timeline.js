// Timeline Data
// Your journey as a developer
// Update real dates and stories anytime

export const TIMELINE = [
  {
    id: 'first-code',
    order: 1,
    year: '2021',
    month: 'Jan',
    title: 'The First Line',
    subtitle: 'Where it all began',
    description: 'Wrote my first "Hello World". Did not know it would change everything.',
    emotion: 'excited',
    color: '#4a90d9',
    icon: '💻',
    sceneType: 'terminal',
    isFuture: false,
  },

  {
    id: 'android-journey',
    order: 2,
    year: '2022',
    month: 'Mar',
    title: 'Discovered Android',
    subtitle: 'Mobile became my canvas',
    description: 'Started learning Android development. Fell in love with building things people carry in their pockets.',
    emotion: 'curious',
    color: '#3ddc84',
    icon: '📱',
    sceneType: 'phone',
    isFuture: false,
  },

  {
    id: 'news-pinch',
    order: 3,
    year: '2023',
    month: 'Jun',
    title: 'News Pinch Launched',
    subtitle: 'My first complete app',
    description: 'Built and launched News Pinch. Real users. Real feedback. Real growth.',
    emotion: 'proud',
    color: '#1a73e8',
    icon: '📰',
    sceneType: 'news-phone',
    isFuture: false,
  },

  {
    id: 'dot-connect',
    order: 4,
    year: '2023',
    month: 'Sep',
    title: 'Dot and Connect',
    subtitle: 'Entered the multiplayer world',
    description: 'Built a real-time multiplayer game with AI opponent. Learned that real-time sync is a different beast.',
    emotion: 'determined',
    color: '#34a853',
    icon: '🎮',
    sceneType: 'game',
    isFuture: false,
  },

  {
    id: 'ai-debate',
    order: 5,
    year: '2024',
    month: 'Feb',
    title: 'AI Debate Coach',
    subtitle: 'First taste of AI magic',
    description: 'Combined AI with 3D animations. Fell completely in love with what AI can do.',
    emotion: 'amazed',
    color: '#8b5cf6',
    icon: '🤖',
    sceneType: 'ai',
    isFuture: false,
  },

  {
    id: 'cafe-billing',
    order: 6,
    year: '2024',
    month: 'Jul',
    title: 'Café Billing System',
    subtitle: 'Built for the real world',
    description: 'First app used in actual business. Proved I can build things that matter to people.',
    emotion: 'confident',
    color: '#f59e0b',
    icon: '☕',
    sceneType: 'cafe',
    isFuture: false,
  },

  {
    id: 'polity-notes',
    order: 7,
    year: '2024',
    month: 'Nov',
    title: 'Polity Notes + Quiz',
    subtitle: 'Built to help others learn',
    description: 'Created an educational app to help students master polity. Realized building for impact matters most.',
    emotion: 'fulfilled',
    color: '#dc2626',
    icon: '📚',
    sceneType: 'book',
    isFuture: false,
  },

  {
    id: 'portfolio',
    order: 8,
    year: '2025',
    month: 'Now',
    title: 'This Portfolio',
    subtitle: 'You are inside my world',
    description: 'Built this immersive 3D portfolio to show not just what I build, but how I think.',
    emotion: 'creative',
    color: '#00d4ff',
    icon: '🌌',
    sceneType: 'portfolio',
    isFuture: false,
  },

  {
    id: 'future',
    order: 9,
    year: '2025+',
    month: 'Soon',
    title: 'The Next Chapter',
    subtitle: 'Coming soon...',
    description: 'The best project is always the next one. Let us build something together.',
    emotion: 'visionary',
    color: '#ffd700',
    icon: '🚀',
    sceneType: 'future',
    isFuture: true,
  },
]

// Helper: Get milestone by ID
export const getMilestoneById = (id) => {
  return TIMELINE.find(m => m.id === id)
}

// Helper: Get milestones by year
export const getMilestonesByYear = (year) => {
  return TIMELINE.filter(m => m.year === year)
}

// Helper: Get all years
export const getAllYears = () => {
  return [...new Set(TIMELINE.map(m => m.year))]
}

// Helper: Get current milestone based on scroll progress
export const getMilestoneByProgress = (progress, totalProgress = 1) => {
  const index = Math.floor((progress / totalProgress) * TIMELINE.length)
  return TIMELINE[Math.min(index, TIMELINE.length - 1)]
}