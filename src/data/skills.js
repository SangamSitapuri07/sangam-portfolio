/**
 * Skills — four categories, exactly as surfaced in the CV, with a few
 * additions that this portfolio itself proves (React Three Fiber, Git/GitHub,
 * Flutter, PostgreSQL) marked normally: nothing here is aspirational.
 *
 * `note` is the one-line summary shown above each card.
 * `also` holds secondary tools shown as faint chips so the primary list stays scannable.
 */

export const skillCategories = [
  {
    id: 'frontend',
    title: 'Frontend',
    note: 'Interfaces that stay fast while they animate.',
    accent: '#4B8CFF',
    items: ['HTML', 'CSS', 'JavaScript', 'React', 'Three.js'],
    also: ['Tailwind CSS', 'React Three Fiber', 'Responsive design', 'Accessibility'],
  },
  {
    id: 'backend',
    title: 'Backend',
    note: 'APIs and data models that hold up under real use.',
    accent: '#54E0A0',
    items: ['Node.js', 'Express', 'APIs', 'Databases'],
    also: ['PostgreSQL', 'MongoDB & Mongoose', 'REST design', 'Server-side validation'],
  },
  {
    id: 'programming',
    title: 'Programming',
    note: 'The fundamentals behind every framework.',
    accent: '#FFB25E',
    items: ['C', 'C++', 'Java', 'Python', 'DSA'],
    also: ['200+ problems on LeetCode & GeeksforGeeks', '4★ HackerRank Python'],
  },
  {
    id: 'development',
    title: 'Development',
    note: 'Shipping, versioning and the tools around the code.',
    accent: '#7C5CFF',
    items: ['Git', 'GitHub', 'Android', 'Firebase'],
    also: ['Kotlin', 'Flutter', 'VS Code', 'Render & Vercel deploys'],
  },
]

/** Language/tool chips shown in the About scene as a quiet backstop. */
export const coreLanguages = ['C++', 'C', 'Java', 'JavaScript', 'Python', 'SQL']

export default skillCategories
