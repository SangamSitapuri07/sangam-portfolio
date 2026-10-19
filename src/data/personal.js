import { RESUME_ASSET } from '../config/assets.js'

const EDUCATION = {
  institution: 'Lovely Professional University',
  location: 'Phagwara, Punjab',
  degree: 'B.Tech · Computer Science and Engineering',
  period: 'Aug 2024 – Present',
  cgpa: '8.52',
}

// Profile and education come from the supplied SangamCV.pdf.
// Keep unconfirmed details out rather than publishing sample contact links.
export const PERSONAL = {
  name: 'Sangam Sitapuri',
  firstName: 'Sangam',
  lastName: 'Sitapuri',
  initials: 'SS',
  title: 'Full Stack & Android Developer',
  shortTitle: 'Developer & Builder',
  tagline: 'Ideas, engineered into reality.',
  introduction: 'I build thoughtful digital experiences—from full-stack applications to Android apps and real-time systems.',
  education: EDUCATION,
  about: {
    heading: 'Curiosity is the starting point.',
    summary: `I’m a Computer Science and Engineering student at ${EDUCATION.institution}. I build full-stack applications, Android experiences, and real-time systems—with a focus on thoughtful interfaces and reliable backend engineering.`,
    points: [
      'B.Tech · Computer Science & Engineering',
      `${EDUCATION.institution} · ${EDUCATION.period}`,
      `CGPA ${EDUCATION.cgpa}`,
      'Full-stack, Android & real-time development',
    ],
  },
  contact: {
    email: 'sitapurisangampac@gmail.com',
    github: 'https://github.com/SangamSitapuri07',
    githubUsername: 'SangamSitapuri07',
    linkedin: 'https://www.linkedin.com/in/sangam-sitapuri',
  },
  resume: RESUME_ASSET.url,
  resumeFilename: RESUME_ASSET.downloadName,
  farewell: 'Let’s build something meaningful.',
  portfolioYear: '2026',
}
