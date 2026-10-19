export const SCENES = [
  { id: 'home', title: 'The Awakening', chapter: 'Reveal', range: [0, .10], span: 1.1, kicker: '01 / The Awakening', headline: 'Turning ideas into intelligent experiences.' },
  { id: 'machine', title: 'Into the Machine', chapter: 'Reveal', range: [.10, .18], span: 1, kicker: '02 / Into the Machine', headline: 'Every line of code has a purpose.' },
  { id: 'breakdown', title: 'The Breakdown Protocol', chapter: 'Deconstruct', range: [.18, .32], span: 1.65, kicker: '03 / The Breakdown Protocol', headline: 'To understand the system, break it down.' },
  { id: 'skills', title: 'The Engineering Core', chapter: 'Deconstruct', range: [.32, .41], span: 1.45, kicker: '04 / The Engineering Core', headline: 'Logic is the foundation. Engineering is the craft.' },
  { id: 'projects', title: 'Project Universe', chapter: 'Explore', range: [.41, .52], span: 1.5, kicker: '05 / Project Universe', headline: 'Ideas become real when you build them.' },
  { id: 'deep-dive', title: 'The Deep Dive', chapter: 'Explore', range: [.52, .63], span: 1.5, kicker: '06 / The Deep Dive', headline: 'Built to solve. Designed to evolve.' },
  { id: 'reassembly', title: 'Reassembly Protocol', chapter: 'Rebuild', range: [.63, .75], span: 1.45, kicker: '07 / Reassembly Protocol', headline: 'Every component has a role.' },
  { id: 'about', title: 'Beyond the Code', chapter: 'Rebuild', range: [.75, .84], span: 1.35, kicker: '08 / Beyond the Code', headline: 'Always learning. Always building.' },
  { id: 'contact', title: 'The Final Transmission', chapter: 'Connect', range: [.84, .94], span: 1.05, kicker: '09 / The Final Transmission', headline: 'Have an idea? Let’s build it.' },
  { id: 'afterglow', title: 'The Afterglow', chapter: 'Connect', range: [.94, 1], span: .95, kicker: '10 / The Afterglow', headline: 'The next build starts here.' },
]

export const CHAPTERS = ['Reveal', 'Deconstruct', 'Explore', 'Rebuild', 'Connect']
export const STORY_PROJECT_IDS = ['ai-debate-coach', 'nuno', 'news-pinch', 'dot-connect']
export const FLAGSHIP_PROJECT_ID = 'ai-debate-coach'

export const CASE_STUDY = {
  problem: 'Debate practice needs more than an answer. Learners need structured arguments, convincing counterarguments, and feedback they can act on.',
  approach: 'Bring argument generation, rebuttals, evaluation, and a round-based 3D debate arena into one React application.',
  implementation: 'React and React Three Fiber on the client. An Express API delegates requests to a configurable Gemini or Groq provider. Dedicated prompts structure the generation and evaluation flows.',
  engineering: 'The repository separates provider configuration and request validation from the interface. This keeps API credentials on the server and lets debate modes share the same AI integration boundary.',
  outcome: 'A publicly accessible application with learning, counterargument, evaluation, and battle modes. The CV credits Sangam with AI integration and backend development alongside two teammates.',
  // A personal account of the hardest challenge has not been supplied. The UI
  // labels the repository-backed analysis above “Engineering decisions”, not
  // an invented story about difficulties the developer personally overcame.
  personalChallenge: null,
  source: 'CV + public repository README, app shell, validation and provider code',
}

export const STORY_COPY = {
  machine: 'Before the interface, there is intent. Before the experience, there is logic. These are the languages I use to connect the two.',
  breakdown: 'Nothing here moves at random. The display lifts, the keycaps separate, and the chassis makes room for the thinking underneath.',
  skills: 'Languages are tools. The goal is a clear interface, a reliable system, and a solution that holds together.',
  'deep-dive': 'An interface is the visible part. Here’s the system behind it.',
  reassembly: 'Understanding the parts is only the beginning. The real work is connecting the logic and building the complete system.',
  contact: 'A good conversation is where the next build starts. For projects, collaboration, or a different way to solve a problem.',
}
export const TECHNICAL_IDENTITY = ['C++', 'Java', 'Python', 'JavaScript', 'React', 'HTML', 'CSS', 'DSA']
