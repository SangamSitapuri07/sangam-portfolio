import { CASE_STUDY } from './story.js'

// Only projects supported by the supplied CV receive a full case study.
// Engineering decisions are source-backed descriptions, not invented accounts
// of personal difficulties or unsupported adoption/performance results.
export const CASE_STUDIES = {
  'ai-debate-coach': {
    ...CASE_STUDY,
    subtitle: 'AI integration and backend development, collaborating with two teammates.',
    architecture: ['React interface', 'Express API', 'Gemini / Groq'],
    pipelineLabel: 'REACT → EXPRESS → AI',
  },
  nuno: {
    problem: 'A shared card game needs every player to agree on whose turn it is, which moves are legal, and how the room rules apply. The server must not trust a client’s claimed move.',
    approach: 'Use a real-time game server for rooms and matchmaking, with server-side validation of turn order, card legality, and the integrity of the 108-card deck.',
    implementation: 'The supplied CV lists Node.js, TypeScript, Express.js, PostgreSQL, Flutter, and Render. Its public backend repository is the source link; the Android build is shared through Google Drive.',
    engineering: 'Keep the rules authoritative on the server. Separate official rules from six optional house-rule variants, and support rating-based queues as well as private rooms with share codes or invitations.',
    outcome: 'The CV documents a multiplayer implementation for up to eight players per table, with configurable room rules, matchmaking, ranking, and level progression. A public source repository and Android build are supplied.',
    subtitle: 'Real-time multiplayer, server-authoritative rules, and configurable rooms.',
    architecture: ['Flutter client', 'TypeScript server', 'PostgreSQL'],
    pipelineLabel: 'FLUTTER → SERVER → GAME STATE',
    personalChallenge: null,
    source: 'Supplied CV; Nuno_Backend repository metadata and provided Android build link',
  },
  'news-pinch': {
    problem: 'Publishing news on Android should accommodate more than a single article format. Readers and contributors need a simple way to work with articles, polls, and video posts.',
    approach: 'Build a lightweight Android publishing experience that supports those content types and allows both users and administrators to contribute.',
    implementation: 'The CV describes a Kotlin/Android application with an article, poll, and video content model. Video posts use YouTube links rather than an external news API.',
    engineering: 'Keep the publishing workflow focused on the application’s own content. Link to video content instead of requiring an external news feed, and support both user and administrator contributions.',
    outcome: 'A Kotlin Android news application covering articles, polls, and video-based posts. The supplied CV includes its source repository and an Android build; no user-count or performance claim is inferred.',
    subtitle: 'An Android publishing workflow for articles, polls, and video posts.',
    architecture: ['Kotlin / Android', 'Publishing workflow', 'Articles / polls / video'],
    pipelineLabel: 'CREATE → PUBLISH → READ',
    personalChallenge: null,
    source: 'Supplied CV, News-Pinch repository, and provided Android build link',
  },
}

export const CASE_STUDY_PROJECT_IDS = Object.keys(CASE_STUDIES)
export const CASE_STUDY_TABS = [
  { id: 'problem', label: 'The problem', heading: 'Problem' },
  { id: 'approach', label: 'The approach', heading: 'Approach' },
  { id: 'implementation', label: 'The build', heading: 'Implementation' },
  { id: 'engineering', label: 'Engineering decisions', heading: 'Engineering decisions' },
  { id: 'outcome', label: 'The outcome', heading: 'Outcome' },
]

export function getCaseStudy(id) {
  return Object.hasOwn(CASE_STUDIES, id) ? CASE_STUDIES[id] : null
}
