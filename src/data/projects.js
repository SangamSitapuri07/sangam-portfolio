/**
 * Projects — five real, shipped projects.
 *
 * Every link in this file was verified against the public GitHub API
 * (github.com/SangamSitapuri07) and every claim comes from the repository
 * README or SangamCV.pdf. Descriptions are rewritten for a recruiter's
 * 10-second scan, but no capability is invented.
 *
 * Rendering contract (kept deliberately renderer-agnostic):
 *   screen.mode   → which generated laptop-screen UI the project uses
 *   screen.accent → per-project accent used for the screen UI and card
 *   cover         → data for the code-generated cover art (no binary assets needed)
 */

export const projects = [
  {
    id: 'orca',
    index: '01',
    name: 'ORCA',
    subtitle: 'Ocean routing & condition adviser · SIH × ISRO',
    year: '2026',
    tagline: 'Tells a fishing skipper where it is safe to go — using only live ocean data.',
    summary:
      'Built for the Smart India Hackathon ISRO problem statement. A FastAPI engine pulls twelve live marine sources, reasons over them with a ten-agent pipeline, and returns a route verified every two kilometres against the GLOBE land mask.',
    role: 'Backend & intelligence engine',
    tech: ['Python', 'FastAPI', 'Multi-agent pipeline', 'PostGIS / land mask', 'Next.js & Flutter clients'],
    highlights: [
      'Twelve live ocean sources — no dummy data anywhere',
      'Ten-agent reasoning: risk, ecology, anomaly, validation',
      'Courses verified every 2 km against the GLOBE 1 km land mask',
      'Bilingual skipper advisories using WMO / IMD small-craft thresholds',
      'A failing source is reported with its real reason — never invented values',
    ],
    stats: [
      { value: '12', label: 'live data sources' },
      { value: '10', label: 'reasoning agents' },
      { value: '2 km', label: 'route verification' },
    ],
    links: {
      github: 'https://github.com/SangamSitapuri07/ORCA-backend',
      live: null,
      extra: {
        label: 'Client app & dashboard',
        href: 'https://github.com/SangamSitapuri07/SIH',
      },
    },
    screen: { mode: 'map', accent: '#3FA9F5' },
    cover: { from: '#062033', via: '#0A3550', to: '#05060A', mark: 'ORCA' },
  },

  {
    id: 'nuno',
    index: '02',
    name: 'Nuno',
    subtitle: 'Real-time multiplayer card game',
    year: '2026',
    tagline: 'Eight players, one deck, and a server that will not let you cheat.',
    summary:
      'A real-time card game with rooms, rating-based matchmaking and a server-authoritative rules engine. Turn order, card legality and 108-card deck integrity are all validated on the server, so forged moves never reach the table.',
    role: 'Backend & rules engine',
    tech: ['TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Flutter', 'Render'],
    highlights: [
      'Rooms for up to eight players, with share codes and friend invites',
      'Server-side validation of turn order, card legality and deck integrity',
      'Rules engine supporting official rules plus six house-rule variants',
      'Rating-based matchmaking queues and level progression',
    ],
    stats: [
      { value: '8', label: 'players per table' },
      { value: '108', label: 'validated deck' },
      { value: '6', label: 'house-rule variants' },
    ],
    links: {
      github: 'https://github.com/SangamSitapuri07/Nuno_Backend',
      live: null,
      extra: {
        label: 'Game client',
        href: 'https://github.com/SangamSitapuri07/nuno',
      },
    },
    screen: { mode: 'terminal', accent: '#54E0A0' },
    cover: { from: '#0A1F1A', via: '#0E3B2E', to: '#05060A', mark: 'NUNO' },
  },

  {
    id: 'ai-debate-coach',
    index: '03',
    name: 'AI Debate Coach',
    subtitle: 'Debate practice in a 3D arena',
    year: '2026',
    tagline: 'Argue against an AI opponent — then read exactly why you lost.',
    summary:
      'A round-based debate platform with a live 3D battle arena built in React Three Fiber. It generates structured arguments, helps you dismantle the other side, then scores your delivery across clarity, logic, evidence and impact.',
    role: 'AI integration & backend (team of three)',
    tech: ['React', 'Three.js', 'React Three Fiber', 'Node.js', 'Express', 'Gemini', 'Groq'],
    highlights: [
      'Live 3D battle arena rendered with React Three Fiber',
      'Argument generator structured as claim, reasoning, evidence, impact',
      'Counterargument builder that targets weak logic in the opponent’s case',
      'Scorecard for clarity, logic, evidence and impact with actionable feedback',
      'Switchable models — Gemini 2.0 Flash and Groq (Llama 3 / Mixtral)',
    ],
    stats: [
      { value: '4', label: 'score dimensions' },
      { value: '2', label: 'AI providers' },
      { value: '3D', label: 'battle arena' },
    ],
    links: {
      github: 'https://github.com/SangamSitapuri07/AI-Debate_Coach',
      live: null,
    },
    screen: { mode: 'arena', accent: '#FF8A3D' },
    cover: { from: '#2A1005', via: '#4A1D08', to: '#05060A', mark: 'DEBATE' },
  },

  {
    id: 'news-pinch',
    index: '04',
    name: 'News Pinch',
    subtitle: 'Android news, polls & video posts',
    year: '2026',
    tagline: 'A news app that publishes itself — articles, polls and video, no news API.',
    summary:
      'An Android app where both readers and administrators contribute content. Video works by linking YouTube rather than paying for a news API, which kept the whole publishing pipeline lightweight enough to ship and maintain alone.',
    role: 'Android development',
    tech: ['Kotlin', 'Android', 'Material UI', 'YouTube embeds'],
    highlights: [
      'Content model covering articles, polls and video posts',
      'User contributions and an admin publishing flow',
      'Video content delivered through YouTube links — no external news API',
      'Designed for a fast, lightweight reading experience on low-end devices',
    ],
    stats: [
      { value: '3', label: 'content types' },
      { value: '0', label: 'news APIs needed' },
    ],
    links: {
      github: 'https://github.com/SangamSitapuri07/News-Pinch',
      live: null,
    },
    screen: { mode: 'mobile', accent: '#4B8CFF' },
    cover: { from: '#0A1030', via: '#152056', to: '#05060A', mark: 'PINCH' },
  },

  {
    id: 'portfolio',
    index: '05',
    name: 'This portfolio',
    subtitle: 'The page you are inside right now',
    year: '2026',
    tagline: 'One scroll timeline drives a real 3D laptop, camera and every word on screen.',
    summary:
      'A single master timeline maps scroll progress onto camera keyframes, the laptop hinge, the screen contents and the text overlays — so scrolling up plays the entire film backwards, exactly.',
    role: 'Design & engineering',
    tech: ['React', 'Vite', 'Three.js', 'React Three Fiber', 'GSAP ScrollTrigger', 'Lenis', 'Tailwind'],
    highlights: [
      'One normalised scroll progress drives camera, hinge, screen and text',
      'A scanned laptop model rigged with a real hinge pivot, not a fake rotation',
      'Screen interfaces drawn to canvas textures and swapped per section',
      'Quality tiers, reduced-motion support and an HTML fallback for no-WebGL devices',
    ],
    stats: [
      { value: '1', label: 'scroll timeline' },
      { value: '7', label: 'scenes' },
      { value: '60', label: 'fps target' },
    ],
    links: {
      github: 'https://github.com/SangamSitapuri07/sangam-portfolio',
      live: 'https://sangam-portfolio-roan.vercel.app',
    },
    screen: { mode: 'editor', accent: '#7C5CFF' },
    cover: { from: '#160B2E', via: '#271349', to: '#05060A', mark: 'SS' },
  },
]

/**
 * Smaller repositories, shown as a compact list — real links, no cards.
 * Keeps the Projects scene focused on five stories instead of a wall of tiles.
 */
export const moreOnGitHub = [
  {
    name: 'Café Billing',
    description: 'Billing app for a small café — Kotlin, Android',
    href: 'https://github.com/SangamSitapuri07/Cafe-Billing',
  },
  {
    name: 'Fault-Tolerant DFS',
    description: 'Distributed file system with replication — TypeScript',
    href: 'https://github.com/SangamSitapuri07/build-fault-tolerant-dfs',
  },
  {
    name: 'Dot & Connect',
    description: 'Real-time multiplayer dots game — JavaScript',
    href: 'https://github.com/SangamSitapuri07/Dot-and-Connect',
  },
  {
    name: 'Dynamic Memory Visualizer',
    description: 'Visualises allocation and fragmentation — JavaScript',
    href: 'https://github.com/SangamSitapuri07/dynamic-memory-visualizer',
  },
  {
    name: 'Innovators',
    description: 'Team site, live on Vercel — HTML',
    href: 'https://github.com/SangamSitapuri07/innovators',
  },
]

/** Convenience: project lookup by id (used by the screen-texture system). */
export const getProjectById = (id) => projects.find((project) => project.id === id)

export default projects
