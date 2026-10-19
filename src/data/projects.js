// Current featured projects, dates, and descriptions come from SangamCV.pdf.
// Repository URLs are checked; Android demos open their original Drive pages.
// No APKs are bundled or prefetched, and missing screenshots stay optional.
export const PROJECTS = [
  {
    id: 'nuno',
    title: 'Nuno',
    category: 'Game · Real-time',
    date: 'Aug 2026',
    summary: 'A real-time multiplayer card game with validated moves, matchmaking, and configurable room rules for up to eight players.',
    technologies: ['Node.js', 'TypeScript', 'Express.js', 'PostgreSQL', 'Flutter'],
    highlights: ['Server-side turn and card validation', 'Rating-based matchmaking and private rooms', 'Official rules and six optional house-rule variants'],
    links: {
      github: 'https://github.com/SangamSitapuri07/Nuno_Backend',
      live: 'https://drive.google.com/file/d/18CvfcClqI6hI97C6cGeu4zrXlPbNsG-s/view?usp=sharing',
    },
    demoLabel: 'Android app · Drive',
    media: { poster: '/images/projects/nuno.svg', video: null, kind: 'schematic', alt: 'Editorial system sketch for Nuno: rooms, server-validated moves, and matchmaking' },
    featured: true,
  },
  {
    id: 'ai-debate-coach',
    title: 'AI Debate Coach',
    category: 'AI · Interactive web',
    date: 'Apr 2026',
    summary: 'A 3D debate-practice arena with AI argument generation, counterarguments, and feedback on clarity, logic, evidence, and impact.',
    technologies: ['React', 'Three.js', 'Node.js', 'Express.js', 'Gemini', 'Groq'],
    role: 'AI integration and backend development, collaborating with two teammates.',
    links: {
      github: 'https://github.com/SangamSitapuri07/AI-Debate_Coach',
      live: 'https://debate-coach.netlify.app/',
    },
    demoLabel: 'Live demo',
    media: { poster: '/images/projects/ai-debate-coach.png', video: null, kind: 'screenshot', alt: 'Actual AI Debate Coach learning interface, captured from its frontend source in the empty Argument Generator state'  },
    featured: true,
  },
  {
    id: 'news-pinch',
    title: 'News Pinch',
    category: 'Android · News',
    date: 'Mar 2026',
    summary: 'An Android news application for articles, polls, and video posts, with publishing tools for users and administrators.',
    technologies: ['Kotlin', 'Android'],
    highlights: ['Articles, polls, and video-based posts', 'User and administrator contributions', 'YouTube-linked video without an external news API'],
    links: {
      github: 'https://github.com/SangamSitapuri07/News-Pinch',
      live: 'https://drive.google.com/file/d/1i5czKpk2k_Pkq38Buh9PpnFJIZ5UEWsr/view?usp=sharing',
    },
    demoLabel: 'Android app · Drive',
    media: { poster: '/images/projects/news-pinch.svg', video: null, kind: 'schematic', alt: 'Editorial system sketch for News Pinch: articles, polls, and YouTube-linked video on Android' },
    featured: true,
  },
  {
    id: 'dot-connect',
    title: 'Dot and Connect',
    category: 'Game · Real-time',
    summary: 'A dots-and-boxes game connecting the web and Android through real-time peer-to-peer play.',
    technologies: ['JavaScript', 'Node.js', 'PeerJS', 'Capacitor'],
    links: { github: 'https://github.com/SangamSitapuri07/Dot-and-Connect', live: null },
    media: { poster: '/images/projects/dot-connect.svg', video: null, kind: 'schematic', alt: 'Editorial system sketch for Dot and Connect: a peer-to-peer dots-and-boxes game' },
    featured: false,
  },
  {
    id: 'cafe-billing',
    title: 'Café Billing',
    category: 'Android · Business',
    summary: 'An Android application for café billing and day-to-day operations.',
    technologies: ['Kotlin', 'Android'],
    links: { github: 'https://github.com/SangamSitapuri07/Cafe-Billing', live: null },
    media: { poster: null, video: null },
    featured: false,
  },
  {
    id: 'polity-notes',
    title: 'Polity Notes + Quiz',
    category: 'Android · Learning',
    summary: 'Structured polity notes and quizzes for learning on Android.',
    technologies: ['Java', 'Android', 'SQLite'],
    links: { github: null, live: null },
    media: { poster: null, video: null },
    featured: false,
  },
]

export const FEATURED_PROJECTS = PROJECTS.filter((project) => project.featured)

export function getProjectById(id) {
  return PROJECTS.find((project) => project.id === id)
}
