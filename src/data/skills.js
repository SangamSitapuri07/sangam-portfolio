/**
 * Skills — drawn from the CV's SKILLS section, plus tools the CV's own project
 * descriptions name (the AI Debate Coach bullet says React Three Fiber; the Nuno
 * tech line says PostgreSQL). Nothing here comes from a repository README, and
 * nothing is aspirational.
 *
 * The CV lists: Languages — C++, C, Java, JavaScript, Python. Tools —
 * ReactJS, NodeJS, MongoDB, Express.js, Mongoose, VS Code, GitHub, Flutter,
 * Kotlin, SQL. Soft skills — problem-solving, teamwork, time management,
 * adaptability, quick learner.
 */

export const skillCategories = [
  {
    id: 'frontend',
    title: 'Frontend',
    note: 'Interfaces that stay fast while they animate.',
    accent: '#4B8CFF',
    items: ['React', 'JavaScript', 'Three.js'],
    also: ['React Three Fiber', 'Component architecture'],
  },
  {
    id: 'backend',
    title: 'Backend',
    note: 'APIs and data models that hold up under real use.',
    accent: '#54E0A0',
    items: ['Node.js', 'Express.js', 'MongoDB', 'Mongoose'],
    also: ['PostgreSQL', 'Server-side validation', 'Rating & ranking systems'],
  },
  {
    id: 'programming',
    title: 'Programming',
    note: 'The fundamentals behind every framework.',
    accent: '#FFB25E',
    items: ['C', 'C++', 'Java', 'Python', 'SQL'],
    also: ['200+ problems on LeetCode & GeeksforGeeks', '4★ HackerRank Python'],
  },
  {
    id: 'development',
    title: 'Development',
    note: 'Shipping, versioning and the tools around the code.',
    accent: '#7C5CFF',
    items: ['Kotlin', 'Android', 'Flutter'],
    also: ['GitHub', 'VS Code', 'Render'],
  },
]

/** Language chips shown in the About scene as a quiet backstop — the CV's list. */
export const coreLanguages = ['C++', 'C', 'Java', 'JavaScript', 'Python']

export default skillCategories

/**
 * The Engineering Core — scene 04's three columns.
 *
 * Deliberately three, not four: the scene's whole argument is "the language, the
 * interface, and the thinking that holds them together". Everything listed is
 * from the CV's SKILLS section; the descriptions say what the skill is *for*, not
 * how good I am at it.
 */
export const coreGroups = [
  {
    id: 'programming',
    number: '01',
    title: 'Programming',
    note: 'The language layer: data structures, memory and the fundamentals that outlive frameworks.',
    accent: '#FFB25E',
    items: ['C', 'C++', 'Java', 'Python', 'SQL'],
    detail:
      'Used for algorithmic problem solving — 200+ problems across LeetCode and GeeksforGeeks, and a 4★ HackerRank rating in Python.',
  },
  {
    id: 'frontend',
    number: '02',
    title: 'Frontend',
    note: 'The interface layer: React, and 3D on the web when a page needs to be a place.',
    accent: '#4B8CFF',
    items: ['React', 'JavaScript', 'Three.js'],
    detail:
      'React Three Fiber and Three.js for the debate arena, React for the surrounding product, plain JavaScript underneath both.',
  },
  {
    id: 'core',
    number: '03',
    title: 'Core concepts',
    note: 'The layer between: how state, requests and rules move through a system.',
    accent: '#54E0A0',
    items: ['Data structures', 'OOP', 'Client–server', 'Real-time state', 'Input validation'],
    detail:
      'Server-authoritative rules, rating and ranking logic, and REST APIs behind Express — the parts that have to be correct before the interface can be pleasant.',
  },
]
