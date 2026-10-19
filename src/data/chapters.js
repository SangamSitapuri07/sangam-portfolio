/**
 * The words.
 *
 * One entry per scene of the film, kept out of `config/scenes.js` on purpose: that
 * file is camera work and choreography, this one is copy. Editing the story should
 * not mean reading trigonometry, and editing a camera move should not risk a typo
 * in a headline.
 *
 * Everything factual here comes from SangamCV.pdf or the public GitHub profile —
 * role, projects, certifications, CGPA, location. Nothing is invented: where the
 * film needs a claim it does not have (a metric, an award, a job title), the line
 * says something true instead, or it is left out.
 */

export const chapters = [
  {
    id: 'awakening',
    number: '01',
    label: 'The Awakening',
    kicker: 'A developer, in ten scenes',
    title: 'Turning Ideas Into Intelligent Experiences.',
    body:
      'I build software, interactive experiences and technology-driven products — from a server that refuses to be cheated to a 3D arena you can argue with.',
    primaryCta: { label: 'Explore my work', target: 'projects' },
    secondaryCta: { label: 'About me', target: 'about' },
    foot: 'Scroll to begin · one continuous shot',
  },
  {
    id: 'engine',
    number: '02',
    label: 'Into the Machine',
    kicker: 'Scene 02 · The machine',
    title: 'Every Line of Code Has a Purpose.',
    body:
      'From logical problem-solving to interactive interfaces, every detail is part of the engineering process.',
    /* Only what the CV lists, plus what its own project descriptions name. */
    tags: ['C++', 'C', 'Java', 'Python', 'JavaScript', 'React', 'Node.js', 'SQL'],
    foot: 'Hover the machine · drag to turn it',
  },
  {
    id: 'breakdown',
    number: '03',
    label: 'The Breakdown Protocol',
    kicker: 'Scene 03 · Major transition',
    title: 'To Understand the System, Break It Down.',
    body:
      'Every component has a purpose. Every system begins with understanding how its parts work together.',
    note: 'The lid, the keyboard, the chassis shell and the bottom plate are the model’s own meshes. The circuit glass between them is lighting, not hardware.',
    foot: 'Scroll to disassemble · scroll back to rebuild',
  },
  {
    id: 'core',
    number: '04',
    label: 'The Engineering Core',
    kicker: 'Scene 04 · Inside the machine',
    title: 'Logic Is the Foundation. Engineering Is the Craft.',
    body:
      'Four layers do the work: the language, the interface, the server, and the thinking that holds them together.',
    foot: 'Languages · interfaces · systems · problem-solving',
  },
  {
    id: 'universe',
    number: '05',
    label: 'Project Universe',
    kicker: 'Scene 05 · Shipped work',
    title: 'Ideas Become Real When You Build Them.',
    body:
      'Three projects from the CV — a multiplayer game server, an AI debate platform, and an Android news app. Each one is real, and each one can be opened.',
    foot: 'Every project opens · sources and demos linked',
  },
  {
    id: 'deep-dive',
    number: '06',
    label: 'The Deep Dive',
    kicker: 'Scene 06 · Flagship project',
    title: 'Built to Solve. Designed to Evolve.',
    body:
      'AI Debate Coach: practise a debate against an AI opponent inside a live 3D arena, then get scored on clarity, logic, evidence and impact.',
    foot: 'Problem · approach · implementation · outcome',
  },
  {
    id: 'rebuild',
    number: '07',
    label: 'The Reassembly Protocol',
    kicker: 'Scene 07 · Major transition',
    title: 'Every Component Has a Role.',
    body:
      'Great results come from understanding the parts, connecting the logic, and building the complete system.',
    foot: 'Everything returns to where it came from',
  },
  {
    id: 'beyond',
    number: '08',
    label: 'Beyond the Code',
    kicker: 'Scene 08 · The person',
    title: 'Always Learning. Always Building.',
    body:
      'Technology evolves. Curiosity keeps the process moving.',
    foot: 'Education · certifications · how I work',
  },
  {
    id: 'transmission',
    number: '09',
    label: 'The Final Transmission',
    kicker: 'Scene 09 · Contact',
    title: 'Have an Idea? Let’s Build It.',
    body:
      'Open to interesting projects, collaboration, and opportunities to build meaningful technology.',
    foot: 'Email · GitHub · LinkedIn · résumé',
  },
  {
    id: 'afterglow',
    number: '10',
    label: 'The Afterglow',
    kicker: 'Scene 10 · End of transmission',
    title: 'The Next Build Starts Here.',
    body:
      'One scroll position, ten scenes, one machine. That is the whole film — the rest is the work.',
    foot: 'Thanks for scrolling',
  },
]

export const chapterById = Object.fromEntries(chapters.map((chapter) => [chapter.id, chapter]))

export default chapters
