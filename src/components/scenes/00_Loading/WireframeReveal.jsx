'use client'

// Wireframe Reveal
// SVG wireframe that draws itself based on loading progress
// Placeholder for face - will be replaced with actual face wireframe later

export default function WireframeReveal({ progress = 0 }) {
  // Calculate stroke offset for drawing animation
  const totalLength = 2000
  const dashOffset = totalLength - (totalLength * progress) / 100

  return (
    <svg
      viewBox="0 0 300 300"
      style={{
        width: '100%',
        height: '100%',
        filter: 'drop-shadow(0 0 20px #00d4ff)',
      }}
    >
      <defs>
        <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Outer Circle (head outline) */}
      <circle
        cx="150"
        cy="150"
        r="120"
        fill="none"
        stroke="url(#wireGradient)"
        strokeWidth="1.5"
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 200ms ease-out' }}
      />

      {/* Face structure lines (triangulated wireframe) */}
      <g
        fill="none"
        stroke="url(#wireGradient)"
        strokeWidth="0.8"
        opacity={progress / 100}
        style={{ transition: 'opacity 300ms ease-out' }}
      >
        {/* Horizontal lines */}
        <line x1="50" y1="130" x2="250" y2="130" />
        <line x1="40" y1="170" x2="260" y2="170" />
        <line x1="60" y1="210" x2="240" y2="210" />
        
        {/* Vertical lines */}
        <line x1="100" y1="50" x2="100" y2="250" />
        <line x1="150" y1="40" x2="150" y2="260" />
        <line x1="200" y1="50" x2="200" y2="250" />

        {/* Eye sockets (circles) */}
        <circle cx="115" cy="140" r="15" />
        <circle cx="185" cy="140" r="15" />

        {/* Pupils */}
        <circle cx="115" cy="140" r="4" fill="#00d4ff" />
        <circle cx="185" cy="140" r="4" fill="#00d4ff" />

        {/* Nose triangle */}
        <polygon points="150,160 140,190 160,190" />

        {/* Mouth line */}
        <path d="M 125 215 Q 150 225 175 215" />

        {/* Cross-connecting lines (mesh effect) */}
        <line x1="100" y1="100" x2="200" y2="200" />
        <line x1="200" y1="100" x2="100" y2="200" />
        <line x1="80" y1="150" x2="220" y2="150" />
        
        {/* Geometric facets */}
        <polygon points="100,100 150,80 200,100 150,130" fill="rgba(0,212,255,0.05)" />
        <polygon points="100,200 150,220 200,200 150,170" fill="rgba(139,92,246,0.05)" />
      </g>

      {/* Center pulse dot */}
      <circle
        cx="150"
        cy="150"
        r="3"
        fill="#ffffff"
        opacity={progress / 100}
      >
        <animate
          attributeName="r"
          values="3;6;3"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="1;0.3;1"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Corner accents (cinematic feel) */}
      <g stroke="#00d4ff" strokeWidth="1" fill="none" opacity={progress > 50 ? 1 : 0} style={{ transition: 'opacity 500ms' }}>
        <path d="M 20 20 L 40 20 L 40 30" />
        <path d="M 280 20 L 260 20 L 260 30" />
        <path d="M 20 280 L 40 280 L 40 270" />
        <path d="M 280 280 L 260 280 L 260 270" />
      </g>
    </svg>
  )
}