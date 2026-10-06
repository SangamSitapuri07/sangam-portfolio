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
