/**
 * Timeline — certifications, training, hackathons, achievements and education.
 * Sourced from SangamCV.pdf (certificates, training, achievements, education)
 * and the public repos (Smart India Hackathon / ORCA).
 *
 * Newest first, because the scroll travels forward in time.
 * `kind` drives the small marker icon and colour on the rail.
 */

export const timeline = [
  {
    id: 'sih-orca',
    kind: 'hackathon',
    period: '2026',
    title: 'Smart India Hackathon — ISRO problem statement',
    organisation: 'Team ORCA',
    detail:
      'Built the data and reasoning engine for a marine advisory tool: twelve live ocean sources, a ten-agent pipeline, and routes verified against the GLOBE land mask.',
    tags: ['Python', 'FastAPI', 'Multi-agent'],
    link: { label: 'ORCA-backend', href: 'https://github.com/SangamSitapuri07/ORCA-backend' },
  },
  {
    id: 'oci-ai',
    kind: 'certification',
    period: '2026',
    title: 'OCI Certified AI Foundations Associate',
    organisation: 'Oracle Cloud Infrastructure',
    detail:
      'Cloud AI fundamentals: model lifecycle, responsible AI, and the OCI services used to build and serve models.',
    tags: ['AI', 'Cloud'],
  },
  {
    id: 'lpu-dsa',
    kind: 'training',
    period: '2026',
    title: 'Data Structures Fundamentals: Basic to Applications',
    organisation: 'Lovely Professional University',
    detail:
      'Structured training across arrays, strings, linked lists, stacks and queues, applied to algorithmic problem solving.',
    tags: ['C++', 'DSA'],
  },
  {
    id: 'iamneo-java',
    kind: 'certification',
    period: '2026',
    title: 'Programming in Java',
    organisation: 'IamNeo',
    detail: 'Object-oriented Java: classes, collections, exceptions and file handling.',
    tags: ['Java', 'OOP'],
  },
  {
    id: 'infosys-cpp',
    kind: 'certification',
    period: '2025',
    title: 'Programming Using C++',
    organisation: 'Infosys',
    detail: 'C++ fundamentals, memory model and object-oriented design, assessed by Infosys.',
    tags: ['C++'],
  },
  {
    id: 'skillearn-qa',
    kind: 'certification',
    period: '2025',
    title: 'Fundamentals of Software Testing',
    organisation: 'SkillEra',
    detail: 'Test planning, levels of testing and defect reporting — how software is checked before release.',
    tags: ['Testing', 'QA'],
  },
  {
    id: 'skillearn-comms',
    kind: 'certification',
    period: 'Oct 2024',
    title: 'Effective Communication Skills',
    organisation: 'SkillEra',
    detail: 'Professional writing, presentation and interview communication.',
    tags: ['Soft skills'],
  },
  {
    id: 'lpu-start',
    kind: 'education',
    period: '2024 — 2028',
    title: 'B.Tech, Computer Science & Engineering',
    organisation: 'Lovely Professional University, Phagwara',
    detail: 'Current CGPA 8.52. Coursework in data structures, operating systems, DBMS and networks.',
    tags: ['CGPA 8.52'],
  },
  {
    id: 'school',
    kind: 'education',
    period: '2023 — 2024',
    title: 'Intermediate — 76%',
    organisation: 'Kunwar Public School, Jaunpur',
    detail: 'Science stream with computer science, and the first place code actually clicked.',
    tags: ['Science'],
  },
]

/** Achievements are displayed as a compact strip, not as timeline rows. */
export const achievements = [
  {
    value: '200+',
    label: 'DSA problems solved',
    detail: 'LeetCode & GeeksforGeeks',
    href: 'https://leetcode.com/u/SangamSitapuri07/',
  },
  {
    value: '4★',
    label: 'HackerRank Python badge',
    detail: 'Awarded for problem-solving performance',
    href: 'https://www.hackerrank.com/profile/sitapurisangampac',
  },
  {
    value: '8.52',
    label: 'CGPA at LPU',
    detail: 'B.Tech Computer Science & Engineering',
  },
  {
    value: 'SIH',
    label: 'Smart India Hackathon',
    detail: 'ISRO problem statement, 2026',
    href: 'https://github.com/SangamSitapuri07/ORCA-backend',
  },
]

/** Education block for the About scene footer. */
export const education = {
  institution: 'Lovely Professional University',
  place: 'Phagwara, Punjab',
  degree: 'B.Tech — Computer Science & Engineering',
  years: '2024 — 2028',
  cgpa: '8.52',
}

export default timeline
