import { useProgress } from '@react-three/drei'

export default function SceneLoader() {
  const { active, progress } = useProgress()
  return (
    <div className="scene-loader" role="status" aria-live="polite">
      <span className="loader-mark" aria-hidden="true">s<span>.</span></span>
      <p>Preparing the workspace<span>{active ? `${Math.round(progress)}%` : 'Almost ready'}</span></p>
      <div className="scene-loader-track" aria-hidden="true"><span style={{ transform: `scaleX(${progress / 100})` }} /></div>
    </div>
  )
}
