/**
 * Profile — the single source of truth for who this portfolio belongs to.
 * Every string here is taken from SangamCV.pdf or the public GitHub profile
 * (github.com/SangamSitapuri07). No invented facts.
 *
 * To re-purpose this portfolio: change the values below, nothing else.
 */

export const profile = {
  name: 'Sangam Sitapuri',
  initials: 'SS',

  /** Primary role line (used in the hero and <title>) */
  role: 'Full-Stack & Android Developer',

  /** Supporting role chips — deliberately factual, no buzzwords */
  specialties: ['Full-Stack Web', 'Android', 'Real-Time Systems', '3D on the Web'],

  /**
   * Positioning sentence. Kept to one breath so the hero never needs a paragraph.
   */
  tagline:
    'I build complete products — a server that refuses to be cheated, and an interface people actually enjoy using.',

  /** One-line status, shown as a small pill in the hero */
  status: 'Open to internships & freelance work',
  currently: 'Shipping ORCA for the Smart India Hackathon (ISRO problem statement)',

  location: {
    city: 'Phagwara, Punjab',
    country: 'India',
    full: 'Phagwara, Punjab, India',
  },

  education: {
    institution: 'Lovely Professional University',
    place: 'Phagwara, Punjab',
    degree: 'B.Tech — Computer Science & Engineering',
    years: '2024 — 2028',
    cgpa: '8.52',
  },

  contact: {
    email: 'sitapurisangampac@gmail.com',
    github: 'https://github.com/SangamSitapuri07',
    githubHandle: 'SangamSitapuri07',
    linkedin: 'https://www.linkedin.com/in/sangam-sitapuri',
    linkedinHandle: 'sangam-sitapuri',
    /** Optional — kept here so it can be switched on in one place if ever wanted. */
    phone: '+91 91204 61358',
    showPhone: false,
  },

  /** Served from /public — also linked from the hero and the contact scene. */
  resume: {
    href: '/SangamCV.pdf',
    label: 'Download résumé',
    /** Shown under the button so people know what they are opening. */
    meta: 'PDF · 1 page',
  },

  /** Hard numbers, all verifiable. Used sparingly as quiet proof. */
  facts: [
    { value: '8.52', label: 'CGPA' },
    { value: '200+', label: 'DSA problems solved' },
    { value: '5', label: 'Shipped projects' },
    { value: '4★', label: 'HackerRank Python' },
  ],

  /** Scene 03 — short, scannable statements. Never paragraphs. */
  about: {
    headline: 'Second-year CSE student who ships real things.',
    intro:
      'I started with Android apps, moved into full-stack web, and never stopped at "it runs on my machine".',
    facts: [
      {
        title: 'Frontend',
        detail: 'React & component architecture, Tailwind, Three.js / React Three Fiber.',
      },
      {
        title: 'Backend',
        detail: 'Node.js, Express, REST APIs, PostgreSQL & MongoDB, auth and validation.',
      },
      {
        title: 'Android',
        detail: 'Kotlin and Java apps with Firebase — built and released end to end.',
      },
      {
        title: 'Interests',
        detail: 'Real-time systems, rules engines, data visualisation and 3D on the web.',
      },
    ],
    /** Verifiable, human details shown as a quiet line at the bottom of the scene. */
    footer: [
      'B.Tech CSE @ Lovely Professional University · CGPA 8.52',
      'Based in Phagwara, Punjab, India',
      'Also writes Python, C and C++',
    ],
  },

  /** Scene 07 — closing line and contact calls to action. */
  closing: {
    title: "Let's build something meaningful.",
    subtitle:
      'I read every message. If you have a product, a role or a strange idea that needs building — write to me.',
    primaryCta: 'Email me',
    secondaryCta: 'Connect on LinkedIn',
  },

  seo: {
    title: 'Sangam Sitapuri — Full-Stack & Android Developer',
    description:
      'Sangam Sitapuri is a full-stack, Android and WebGL developer from India. Scroll through a cinematic 3D portfolio: real-time multiplayer systems, AI-powered web apps and Android products.',
    keywords:
      'Sangam Sitapuri, full-stack developer, Android developer, React developer, Node.js, Three.js, WebGL portfolio, Smart India Hackathon',
  },
}

export default profile
