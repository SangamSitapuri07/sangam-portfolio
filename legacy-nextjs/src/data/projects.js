// Projects Data
// All 5 projects with placeholder details
// Update real info anytime

import { COLORS } from '@/config/performance.config'

export const PROJECTS = [
  {
    id: 'news-pinch',
    order: 1,
    
    // Basic Info
    title: 'News Pinch',
    tagline: 'Your daily dose of news, beautifully delivered',
    shortDescription: 'Android news app with notifications and video shorts',
    longDescription: 'A complete news application built for Android with categorized news feeds, push notifications, video shorts, and a clean modern interface.',
    
    // Platform
    platform: 'android',
    platformLabel: 'Android',
    
    // Tech Stack (UPDATE LATER)
    techStack: ['Java', 'Android Studio', 'XML', 'Firebase'],
    
    // Features (UPDATE LATER)
    features: [
      'Categorized news feeds',
      'Push notifications',
      'Video shorts',
      'Clean modern UI',
      'Offline reading',
    ],
    
    // Links (UPDATE LATER)
    links: {
      github: 'https://github.com/SangamSitapuri07/news-pinch',
      apk: '',
      playstore: '',
      live: '',
    },
    
    // Stats (UPDATE LATER)
    stats: {
      buildTime: '6 weeks',
      linesOfCode: '5000+',
      users: '100+',
    },
    
    // Demo Configuration
    demo: {
      type: 'ui-simulation',
      component: 'NewsPinchDemo',
      sampleData: 'hardcoded',
    },
    
    // 3D Scene Configuration
    scene: {
      object: 'android-phone',
      primaryColor: COLORS.projects.newsPinch,
      secondaryColor: '#4fc3f7',
      mood: 'dynamic',
      lighting: 'news-blue',
    },
    
    // Face Reactions
    faceReactions: {
      onOpen: 'proud',
      onInteract: 'nodding',
      onClose: 'satisfied',
    },
  },

  {
    id: 'dot-connect',
    order: 2,
    
    title: 'Dot and Connect',
    tagline: 'Classic strategy with multiplayer and AI',
    shortDescription: 'Online multiplayer dots and boxes game with AI mode',
    longDescription: 'A modern take on the classic dots and boxes game. Play against AI offline or challenge friends online with real-time chat.',
    
    platform: 'web-android',
    platformLabel: 'Web + Android',
    
    techStack: ['HTML', 'CSS', 'JavaScript', 'Socket.io', 'Node.js'],
    
    features: [
      'Online multiplayer mode',
      'Offline AI opponent',
      'Real-time chat with friends',
      'Room creation and joining',
      'Smooth animations',
    ],
    
    links: {
      github: 'https://github.com/SangamSitapuri07/dot-and-connect',
      live: 'https://your-dot-connect.onrender.com',
      apk: '',
    },
    
    stats: {
      buildTime: '4 weeks',
      linesOfCode: '3000+',
      gamesPlayed: '500+',
    },
    
    demo: {
      type: 'embedded-live',
      component: 'DotConnectDemo',
      liveUrl: 'https://your-dot-connect.onrender.com',
    },
    
    scene: {
      object: 'gameboard',
      primaryColor: COLORS.projects.dotConnect,
      secondaryColor: '#81c995',
      mood: 'playful',
      lighting: 'game-green',
    },
    
    faceReactions: {
      onOpen: 'excited',
      onWin: 'celebrating',
      onLose: 'encouraging',
      onChat: 'amused',
    },
  },

  {
    id: 'ai-debate-coach',
    order: 3,
    
    title: 'AI Debate Coach',
    tagline: 'Sharpen your arguments with AI',
    shortDescription: 'Web-based AI debate platform with 3D animations',
    longDescription: 'An interactive debate coaching platform powered by AI. Practice your arguments, get real-time feedback, and improve your debating skills with stunning 3D animations.',
    
    platform: 'web',
    platformLabel: 'Web Browser',
    
    techStack: ['React', 'Three.js', 'AI API', 'Node.js'],
    
    features: [
      'AI-powered debate coaching',
      'Beautiful 3D animations',
      'Real-time argument analysis',
      'Multiple debate topics',
      'Interactive feedback system',
    ],
    
    links: {
      github: 'https://github.com/SangamSitapuri07/ai-debate-coach',
      live: 'https://your-ai-debate.onrender.com',
    },
    
    stats: {
      buildTime: '5 weeks',
      linesOfCode: '4500+',
    },
    
    demo: {
      type: 'embedded-live',
      component: 'AIDebateDemo',
      liveUrl: 'https://your-ai-debate.onrender.com',
    },
    
    scene: {
      object: 'ai-figure',
      primaryColor: COLORS.projects.aiDebate,
      secondaryColor: '#c4b5fd',
      mood: 'dramatic',
      lighting: 'dramatic-purple',
    },
    
    faceReactions: {
      onOpen: 'serious',
      onArgument: 'thinking',
      onGoodPoint: 'impressed',
      onClose: 'proud',
    },
  },

  {
    id: 'cafe-billing',
    order: 4,
    
    title: 'Café Billing',
    tagline: 'Modern billing with loyalty rewards',
    shortDescription: 'Android café management app with loyalty points',
    longDescription: 'Complete café billing system with menu management, real-time billing, customer loyalty points, and analytics. Built for real-world café operations.',
    
    platform: 'android',
    platformLabel: 'Android',
    
    techStack: ['Java', 'Android Studio', 'SQLite', 'XML'],
    
    features: [
      'Real-time billing',
      'Customer loyalty points',
      'Menu management',
      'Table management',
      'Sales analytics',
      'Receipt generation',
    ],
    
    links: {
      github: 'https://github.com/SangamSitapuri07/cafe-billing',
      apk: '',
    },
    
    stats: {
      buildTime: '5 weeks',
      linesOfCode: '4000+',
      cafesUsing: '1+',
    },
    
    demo: {
      type: 'interactive-simulation',
      component: 'CafeBillingDemo',
      sampleData: 'hardcoded',
    },
    
    scene: {
      object: 'cafe-scene',
      primaryColor: COLORS.projects.cafeBilling,
      secondaryColor: '#fcd34d',
      mood: 'warm',
      lighting: 'warm-cafe',
    },
    
    faceReactions: {
      onOpen: 'welcoming',
      onAddItem: 'approving',
      onPayment: 'satisfied',
      onPoints: 'excited',
    },
  },

  {
    id: 'polity-notes',
    order: 5,
    
    title: 'Polity Notes + Quiz',
    tagline: 'Master polity with notes and quizzes',
    shortDescription: 'Android educational app for polity learning',
    longDescription: 'Educational Android app combining structured polity notes with interactive quizzes. Designed for students preparing for competitive exams or anyone curious about Indian polity.',
    
    platform: 'android',
    platformLabel: 'Android',
    
    techStack: ['Java', 'Android Studio', 'SQLite', 'XML'],
    
    features: [
      'Comprehensive polity notes',
      'Interactive quizzes',
      'Score tracking',
      'Topic-wise organization',
      'Offline access',
      'Bookmark important notes',
    ],
    
    links: {
      github: 'https://github.com/SangamSitapuri07/polity-notes',
      apk: '',
    },
    
    stats: {
      buildTime: '4 weeks',
      linesOfCode: '3500+',
      notesCount: '200+',
      questionsCount: '500+',
    },
    
    demo: {
      type: 'interactive-simulation',
      component: 'PolityNotesDemo',
      sampleData: 'hardcoded',
    },
    
    scene: {
      object: 'book-notes',
      primaryColor: COLORS.projects.polityNotes,
      secondaryColor: '#fca5a5',
      mood: 'educational',
      lighting: 'warm-study',
    },
    
    faceReactions: {
      onOpen: 'focused',
      onCorrectAnswer: 'proud',
      onWrongAnswer: 'encouraging',
      onComplete: 'celebrating',
    },
  },
]

// Helper: Get project by ID
export const getProjectById = (id) => {
  return PROJECTS.find(p => p.id === id)
}

// Helper: Get project by scroll progress
export const getProjectByProgress = (progress, projectScrollRanges) => {
  return PROJECTS.find(p => {
    const range = projectScrollRanges[p.id.toUpperCase().replace('-', '_')]
    if (!range) return false
    return progress >= range.start && progress < range.end
  })
}