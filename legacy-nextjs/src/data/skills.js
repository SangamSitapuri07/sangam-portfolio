// Skills Data
// Used in the Neural Network visualization
// Update proficiency levels and add skills anytime

export const SKILLS = {
  // Core skill clusters - these are the BIG nodes
  coreNodes: [
    {
      id: 'fullstack',
      label: 'Full Stack',
      position: [0, 0, 0],
      color: '#4a90d9',
      size: 1.5,
      description: 'Building complete web experiences',
      children: [
        {
          id: 'react',
          label: 'React',
          proficiency: 85,
          color: '#61dafb',
          projects: ['ai-debate-coach'],
        },
        {
          id: 'nextjs',
          label: 'Next.js',
          proficiency: 80,
          color: '#ffffff',
          projects: ['portfolio'],
        },
        {
          id: 'javascript',
          label: 'JavaScript',
          proficiency: 90,
          color: '#f7df1e',
          projects: ['dot-connect', 'ai-debate-coach'],
        },
        {
          id: 'nodejs',
          label: 'Node.js',
          proficiency: 80,
          color: '#68a063',
          projects: ['dot-connect', 'ai-debate-coach'],
        },
        {
          id: 'html-css',
          label: 'HTML/CSS',
          proficiency: 90,
          color: '#e34c26',
          projects: ['dot-connect'],
        },
        {
          id: 'tailwind',
          label: 'Tailwind',
          proficiency: 85,
          color: '#06b6d4',
          projects: ['portfolio'],
        },
      ],
    },

    {
      id: 'android',
      label: 'Android',
      position: [3, 1, -1],
      color: '#3ddc84',
      size: 1.4,
      description: 'Native Android development',
      children: [
        {
          id: 'java',
          label: 'Java',
          proficiency: 90,
          color: '#f89820',
          projects: ['news-pinch', 'cafe-billing', 'polity-notes'],
        },
        {
          id: 'android-studio',
          label: 'Android Studio',
          proficiency: 90,
          color: '#3ddc84',
          projects: ['news-pinch', 'cafe-billing', 'polity-notes'],
        },
        {
          id: 'xml',
          label: 'XML',
          proficiency: 85,
          color: '#ff6b6b',
          projects: ['news-pinch', 'cafe-billing', 'polity-notes'],
        },
        {
          id: 'sqlite',
          label: 'SQLite',
          proficiency: 80,
          color: '#003b57',
          projects: ['cafe-billing', 'polity-notes'],
        },
        {
          id: 'firebase',
          label: 'Firebase',
          proficiency: 80,
          color: '#ffca28',
          projects: ['news-pinch'],
        },
      ],
    },

    {
      id: 'realtime',
      label: 'Real-time',
      position: [-3, 1, -1],
      color: '#8b5cf6',
      size: 1.2,
      description: 'Real-time and multiplayer systems',
      children: [
        {
          id: 'socketio',
          label: 'Socket.io',
          proficiency: 75,
          color: '#010101',
          projects: ['dot-connect'],
        },
        {
          id: 'websockets',
          label: 'WebSockets',
          proficiency: 70,
          color: '#4a90d9',
          projects: ['dot-connect'],
        },
      ],
    },

    {
      id: 'ai',
      label: 'AI & 3D',
      position: [0, 3, -1],
      color: '#f59e0b',
      size: 1.3,
      description: 'AI integration and 3D experiences',
      children: [
        {
          id: 'threejs',
          label: 'Three.js',
          proficiency: 70,
          color: '#049ef4',
          projects: ['ai-debate-coach', 'portfolio'],
        },
        {
          id: 'r3f',
          label: 'React Three Fiber',
          proficiency: 65,
          color: '#000000',
          projects: ['portfolio'],
        },
        {
          id: 'ai-apis',
          label: 'AI APIs',
          proficiency: 75,
          color: '#ff6f00',
          projects: ['ai-debate-coach'],
        },
      ],
    },

    {
      id: 'creative',
      label: 'Creative',
      position: [0, -3, 0],
      color: '#ffd700',
      size: 1.0,
      description: 'Design and creative skills',
      children: [
        {
          id: 'ui-design',
          label: 'UI/UX Design',
          proficiency: 80,
          color: '#ff78c4',
          projects: ['news-pinch', 'cafe-billing'],
        },
        {
          id: 'problem-solving',
          label: 'Problem Solving',
          proficiency: 90,
          color: '#10b981',
          projects: ['dot-connect', 'ai-debate-coach'],
        },
        {
          id: 'algorithms',
          label: 'Algorithms',
          proficiency: 80,
          color: '#ec4899',
          projects: ['dot-connect'],
        },
      ],
    },
  ],

  // Connections between skills (synapse lines)
  connections: [
    { from: 'react', to: 'nextjs', strength: 0.9 },
    { from: 'react', to: 'javascript', strength: 1.0 },
    { from: 'nextjs', to: 'react', strength: 0.95 },
    { from: 'javascript', to: 'nodejs', strength: 0.85 },
    { from: 'html-css', to: 'tailwind', strength: 0.9 },
    { from: 'java', to: 'android-studio', strength: 1.0 },
    { from: 'android-studio', to: 'xml', strength: 0.95 },
    { from: 'java', to: 'sqlite', strength: 0.7 },
    { from: 'android-studio', to: 'firebase', strength: 0.8 },
    { from: 'socketio', to: 'nodejs', strength: 0.9 },
    { from: 'websockets', to: 'socketio', strength: 0.95 },
    { from: 'threejs', to: 'r3f', strength: 0.95 },
    { from: 'r3f', to: 'react', strength: 0.9 },
    { from: 'threejs', to: 'javascript', strength: 0.85 },
    { from: 'ai-apis', to: 'nodejs', strength: 0.7 },
    { from: 'ui-design', to: 'html-css', strength: 0.7 },
    { from: 'problem-solving', to: 'algorithms', strength: 0.9 },
  ],
}

// Helper: Get all skills as flat array
export const getAllSkills = () => {
  return SKILLS.coreNodes.flatMap(node => node.children)
}

// Helper: Get skill by ID
export const getSkillById = (id) => {
  return getAllSkills().find(s => s.id === id)
}

// Helper: Get skills used in a project
export const getSkillsForProject = (projectId) => {
  return getAllSkills().filter(s => s.projects.includes(projectId))
}