/**
 * Projects — the three projects listed in SangamCV.pdf, and nothing else.
 *
 * Every claim below is a sentence from the CV's PROJECTS section. No repository
 * README, no GitHub metadata, no portfolio copy of my own: if a line is here, it
 * is because the CV says it. The only edits are mechanical — the PDF text
 * extractor drops spaces around links ("Gemini and GroqAI models"), and those are
 * repaired.
 *
 * Links are the CV's own: the GitHub link and the "Live Demo" link printed beside
 * each project. Two of the three demos are videos (both Nuno and News Pinch are
 * apps you cannot open in a browser — a Flutter client and a Kotlin Android app),
 * which is why the demo environment plays them rather than embedding them.
 *
 * Rendering contract (kept deliberately renderer-agnostic):
 *   screen.mode   → which generated laptop-screen UI the project uses
 *   screen.accent → per-project accent used for the screen UI and card
 *   cover         → data for the code-generated cover art (no binary assets needed)
 */

export const projects = [
  {
    id: 'nuno',
    index: '01',
    name: 'Nuno',
    subtitle: 'Real Time Multiplayer Card Game',
    year: 'Aug 2026',
    tagline: 'Eight players, one deck, and a server that will not let you cheat.',
    summary:
      'A real-time game server with rooms, matchmaking and a server-authoritative rules engine. Turn order, card legality and the 108-card deck are validated on the server, so forged moves never reach the table.',
    /** The CV's bullets for this project all describe the server, so that is the role. */
    role: 'Game server, rules engine & rankings',
    tech: ['Node.js', 'TypeScript', 'Express.js', 'PostgreSQL', 'Flutter', 'Render'],
    highlights: [
      'Real-time game server with rooms, matchmaking, and up to 8 players per table',
      'Server-side validation of turn order, card legality and 108-card deck integrity, to prevent forged moves',
      'Rules engine supporting the official rules plus six optional house-rule variants for private rooms',
      'Rating-based matchmaking queues, private rooms with share codes, and friend invites',
      'Player ranking system with level progression and rank comparison',
    ],
    stats: [
      { value: '8', label: 'players per table' },
      { value: '108', label: 'card deck validated' },
      { value: '6', label: 'house-rule variants' },
    ],
    links: {
      github: 'https://github.com/SangamSitapuri07/Nuno_Backend',
      /* The CV's "Live Demo" for Nuno is a demonstration video. */
      live: 'https://drive.google.com/file/d/18CvfcClqI6hI97C6cGeu4zrXlPbNsG-s/view?usp=sharing',
    },
    screen: { mode: 'terminal', accent: '#54E0A0' },
    cover: { from: '#0A1F1A', via: '#0E3B2E', to: '#05060A', mark: 'NUNO' },
  },

  {
    id: 'ai-debate-coach',
    index: '02',
    name: 'AI Debate Coach',
    subtitle: '3D AI debate platform',
    year: '2026',
    tagline: 'Practise a debate against an AI opponent inside a live 3D arena.',
    summary:
      'A 3D AI debate platform built on a live React Three Fiber arena, with argument generation and counter-argument building, and a feedback scorecard that measures clarity, logic, evidence and impact.',
    role: 'AI integration & backend, with two teammates',
    tech: ['React', 'Three.js', 'Node.js', 'Express.js', 'Gemini API', 'Groq API'],
    highlights: [
      'Engineered a 3D AI debate platform with a live React Three Fiber arena',
      'Implemented argument generation and counter-argument building for interactive debate sessions',
      'Established a feedback scorecard measuring clarity, logic, evidence and impact of arguments',
      'Integrated Gemini and Groq AI models with a Node.js/Express backend for AI responses',
      'Coordinated with two teammates while handling AI integration and backend development',
    ],
    stats: [
      { value: '4', label: 'scorecard dimensions' },
      { value: '2', label: 'AI models integrated' },
      { value: '3D', label: 'debate arena' },
    ],
    links: {
      github: 'https://github.com/SangamSitapuri07/AI-Debate_Coach',
      /* The CV's "Live Demo" for this one is a deployed web app. */
      live: 'https://debate-coach.netlify.app/',
    },
    screen: { mode: 'arena', accent: '#FF8A3D' },
    cover: { from: '#2A1005', via: '#4A1D08', to: '#05060A', mark: 'DEBATE' },
  },

  {
    id: 'news-pinch',
    index: '03',
    name: 'News Pinch',
    subtitle: 'Android news, polls & video posts',
    year: 'Mar 2026',
    tagline: 'A news app that publishes itself — articles, polls and video, without a news API.',
    summary:
      'An Android news application supporting articles, polls and video-based posts, where both users and administrators contribute content. Video works through YouTube links rather than an external news API, which keeps the publishing model simple.',
    role: 'Android development',
    tech: ['Kotlin', 'Android'],
    highlights: [
      'An Android news application supporting articles, polls and video-based posts',
      'A simple content model for efficient article, poll and video publishing',
      'User and administrator contributions for managing application content',
      'YouTube links for video content, without using an external news API',
      'A lightweight, user-friendly Android publishing interface',
    ],
    stats: [
      { value: '3', label: 'content types' },
      { value: '0', label: 'external news APIs' },
      { value: 'Kotlin', label: 'native Android' },
    ],
    links: {
      github: 'https://github.com/SangamSitapuri07/News-Pinch',
      /* The CV's "Live Demo" for the Android app is a demonstration video. */
      live: 'https://drive.google.com/file/d/1i5czKpk2k_Pkq38Buh9PpnFJIZ5UEWsr/view?usp=sharing',
    },
    screen: { mode: 'mobile', accent: '#4B8CFF' },
    cover: { from: '#0A1030', via: '#152056', to: '#05060A', mark: 'PINCH' },
  },
]

export default projects
