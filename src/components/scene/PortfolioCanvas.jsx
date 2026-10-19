import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, SRGBColorSpace, BufferGeometry, Float32BufferAttribute } from 'three'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import StudioLighting from './StudioLighting.jsx'
import SceneLoader from './SceneLoader.jsx'
import LaptopRig from './LaptopRig.jsx'
import CameraRig from './CameraRig.jsx'
import PerformanceGuard from './PerformanceGuard.jsx'
import { storyRuntime } from '../../animation/runtime.js'

function Atmosphere() {
  const geometry = useMemo(() => {
    const positions = []
    for (let i = 0; i < 44; i++) positions.push(Math.sin(i * 12.39) * 5, .2 + Math.abs(Math.sin(i * 7.17)) * 4, -2 - Math.abs(Math.cos(i * 8.5)) * 5)
    const shape = new BufferGeometry()
    shape.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return shape
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <points geometry={geometry}><pointsMaterial color="#5e9ca9" size={.012} sizeAttenuation transparent opacity={.45} /></points>
}

export default function PortfolioCanvas({ onUnavailable, onReady }) {
  const compact = useMediaQuery('(max-width: 767px)')
  const [ready, setReady] = useState(false)
  const [lowQuality, setLowQuality] = useState(false)
  const degrade = useCallback(() => setLowQuality(true), [])
  const [element, setElement] = useState(null)
  const markReady = useCallback(() => { setReady(true); onReady() }, [onReady])
  const created = useCallback(({ gl }) => {
    gl.toneMapping = ACESFilmicToneMapping
    gl.outputColorSpace = SRGBColorSpace
    setElement(gl.domElement)
  }, [])
  useEffect(() => {
    if (!element) return
    const lost = (event) => { event.preventDefault(); onUnavailable() }
    element.addEventListener('webglcontextlost', lost)
    return () => element.removeEventListener('webglcontextlost', lost)
  }, [element, onUnavailable])
  useEffect(() => {
    if (compact) return
    const move = (event) => {
      storyRuntime.pointer.x = event.clientX / window.innerWidth * 2 - 1
      storyRuntime.pointer.y = event.clientY / window.innerHeight * 2 - 1
      storyRuntime.invalidate?.()
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [compact])
  return (
    <div className={`portfolio-canvas ${ready ? 'is-ready' : ''}`} data-scene-ready={String(ready)}>
      <Canvas aria-hidden="true" frameloop="demand" dpr={[1, compact ? 1.5 : 1.75]} camera={{ position: [4.2, 3, 5.5], fov: 35, near: .1, far: 40 }} gl={{ alpha: true, antialias: !compact, powerPreference: 'high-performance' }} onCreated={created}>
        <CameraRig compact={compact} />
        <PerformanceGuard onDegrade={degrade} onUnavailable={onUnavailable} />
        <Suspense fallback={null}>
          <StudioLighting compact={compact} />
          <LaptopRig compact={compact} onReady={markReady} />
          {!compact && !lowQuality && <Atmosphere />}

        </Suspense>
      </Canvas>
      {!ready && <SceneLoader />}
    </div>
  )
}
