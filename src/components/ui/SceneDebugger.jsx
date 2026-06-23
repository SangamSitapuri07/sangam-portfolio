'use client'

// Scene Debugger - TEMPORARY visualization tool

import { useSceneStore } from '@/store/useSceneStore'

export default function SceneDebugger() {
  const currentScene = useSceneStore(state => state.currentScene)
  const scrollProgress = useSceneStore(state => state.scrollProgress)
  const sceneProgress = useSceneStore(state => state.sceneProgress)

  return (
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '16px',
        color: 'white',
        fontSize: '13px',
        fontFamily: 'monospace',
        pointerEvents: 'auto',
        minWidth: '220px',
      }}
    >
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Debug Info
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        <span style={{ color: '#666' }}>Scene:</span>{' '}
        <span style={{ color: '#00d4ff' }}>{currentScene}</span>
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        <span style={{ color: '#666' }}>Global:</span>{' '}
        <span style={{ color: '#8b5cf6' }}>
          {(scrollProgress * 100).toFixed(1)}%
        </span>
      </div>
      
      <div>
        <span style={{ color: '#666' }}>Scene:</span>{' '}
        <span style={{ color: '#ffd700' }}>
          {(sceneProgress * 100).toFixed(1)}%
        </span>
      </div>

      <div 
        style={{
          marginTop: '12px',
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(to right, #00d4ff, #8b5cf6)',
            width: `${scrollProgress * 100}%`,
            transition: 'width 100ms ease-out',
          }}
        />
      </div>

      <div style={{ marginTop: '12px', fontSize: '11px', color: '#666' }}>
        Scroll to navigate ↓
      </div>
    </div>
  )
}