/**
 * What each part of the machine *is about*.
 *
 * The exploded view is not decoration: every separable group in the model is
 * pinned to one thing the portfolio claims, so Scene 03 can stop on a component
 * and have the copy, the camera and the part all talking about the same idea.
 *
 * Rules for this file:
 *   • `part` must name a unit in `lib/explodedView.js` — the content gate checks
 *     that no story points at a component the model does not actually have.
 *   • the technology named must already appear in `data/` (skills, projects or
 *     profile). No new claims are invented here; this is a lens on the same CV.
 *   • these are ideas, not measurements. Nothing here is a number, an award or a
 *     user count.
 */

export const parts = [
  {
    id: 'display',
    part: 'display',
    index: '01',
    pillar: 'Frontend',
    title: 'The interface',
    line: 'React and Three.js, holding a frame while a page of copy scrolls past it.',
  },
  {
    id: 'input',
    part: 'keyboard',
    index: '02',
    pillar: 'Programming',
    title: 'The input',
    line: 'TypeScript and Node — every move arrives, is checked, and only then counts.',
  },
  {
    id: 'foundation',
    part: 'deck',
    index: '03',
    pillar: 'Core concepts',
    title: 'The foundation',
    line: 'Data structures and the language underneath; the layer everything rests on.',
  },
  {
    id: 'base',
    part: 'bottom',
    index: '04',
    pillar: 'Backend',
    title: 'The base',
    line: 'PostgreSQL and MongoDB — persistence, the part that must not lose the game.',
  },
  {
    id: 'finish',
    part: 'accent',
    index: '05',
    pillar: 'Craft',
    title: 'The finish',
    line: 'Motion, spacing and timing: the polish that makes an interface feel alive.',
  },
  {
    id: 'integrations',
    part: 'hardware',
    index: '06',
    pillar: 'Integrations',
    title: 'The integrations',
    line: 'Gemini and Groq behind Express — the machine talking to systems it does not own.',
  },
  {
    id: 'details',
    part: 'details',
    index: '07',
    pillar: 'Quality',
    title: 'The details',
    line: 'Testing and edge cases: the things that only show up on the tenth playthrough.',
  },
  {
    id: 'whole',
    part: 'lid',
    index: '08',
    pillar: 'The whole',
    title: 'The lid',
    line: 'Every layer above, folded into one object you can hold and open.',
  },
]

export const partByUnit = Object.fromEntries(parts.map((entry) => [entry.part, entry]))
export const storyById = Object.fromEntries(parts.map((entry) => [entry.id, entry]))

export default parts
