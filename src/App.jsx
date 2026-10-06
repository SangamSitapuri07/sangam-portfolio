import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'

import Experience from '@/components/Experience'
import Loader from '@/components/Loader'
import Navbar from '@/components/Navbar'
import ProgressBar from '@/components/ProgressBar'
import ScrollHint from '@/components/ScrollHint'
import SectionOverlay from '@/components/SectionOverlay'
import FallbackPortfolio from '@/sections/FallbackPortfolio'
import SceneBoundary from '@/components/SceneBoundary'

import { detectDevice, probeWebGL, resolveDpr, tierDown } from '@/lib/device'
import { initScrollEngine, onSceneChange, startScroll, stopScroll, sceneState } from '@/lib/scrollEngine'
import { sceneRanges } from '@/lib/timeline'
import { autoTune } from '@/config/quality'

/**
 * App — the composition root.
 *
 * Decides what this device can do (WebGL, quality tier, layout variant, motion
 * preference), mounts the fixed WebGL stage, lays the scrollable text column on
 * top of it, and gates the whole thing behind the loader. If WebGL is unavailable,
 * or if the scene throws, it renders the static portfolio instead — same content,
 * no canvas.
 */

/* Decide once, before the first render, so nothing flickers into the wrong mode. */
const initialState = () => {
  const device = detectDevice()
  const webgl = probeWebGL()
  return { device, webgl }
}

export default function App() {
  const [{ device, webgl }] = useState(initialState)
  const [quality, setQuality] = useState(device.tier)
  const [forcedStatic, setForcedStatic] = useState(false)
  const [sceneCrashed, setSceneCrashed] = useState(false)
  const [ready, setReady] = useState(false)
  const [activeSceneId, setActiveSceneId] = useState('home')
  const [variant, setVariant] = useState(device.variant)

  const tierDropped = useRef(false)
  const useStatic = forcedStatic || sceneCrashed || !webgl.ok

  /* ---- Keep the layout variant honest across resizes ---- */
  useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth
      setVariant(width < 768 ? 'mobile' : width < 1280 ? 'tablet' : 'desktop')
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /* ---- Start the scroll engine once the film is ready ----
   * Linking the engine only after load means the intro cannot be scrolled past
   * while assets stream in, and ScrollTrigger measures a settled layout. */
  useEffect(() => {
    // The engine drives the film's chapters. In static mode the page is an
    // ordinary document and must keep ordinary scrolling.
    if (!ready || useStatic) return undefined
    initScrollEngine({ reducedMotion: device.reducedMotion })
    startScroll()
    const unsubscribe = onSceneChange((index) => {
      const scene = sceneRanges[index]
      if (!scene) return
      const navScene = scene.id === 'intro' ? 'home' : scene.id
      setActiveSceneId(navScene)
    })
    return () => {
      unsubscribe()
    }
  }, [ready, useStatic, device.reducedMotion])

  /* While loading, the page must not scroll behind the loader. */
  useEffect(() => {
    if (ready || useStatic) return undefined
    stopScroll()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [ready, useStatic])

  /* Static mode has nothing to stream — no model, no textures — so the page is
     ready as soon as it mounts. Without this the nav would wait on a loader that
     is never rendered. */
  useEffect(() => {
    if (useStatic) setReady(true)
  }, [useStatic])

  /* ---- One automatic quality step down if the first seconds are slow ---- */
  const handlePerformanceDrop = useCallback(() => {
    if (tierDropped.current || !autoTune.enabled) return
    tierDropped.current = true
    setQuality((current) => tierDown(current))
  }, [])

  const dpr = useMemo(() => resolveDpr(quality, variant), [quality, variant])

  const handleSceneReady = useCallback(() => {
    if (import.meta.env?.DEV) {
      // Handy when tuning scenes by hand.
      window.__scene = { sceneState, ranges: sceneRanges }
    }
  }, [])

  return (
    <>
      <a
        href="#main-content"
        className="sr-only-focusable fixed top-4 left-4 z-[80] rounded-full bg-accent px-4 py-2 text-sm font-medium text-[#04101f]"
      >
        Skip to content
      </a>

      {/* ---------------- The film ---------------- */}
      {!useStatic ? (
        <div className="canvas-layer" aria-hidden="true">
          <SceneBoundary onError={() => setSceneCrashed(true)}>
            <Canvas
              dpr={dpr}
              gl={{
                antialias: quality.id !== 'low',
                alpha: false,
                powerPreference: 'high-performance',
                stencil: false,
                depth: true,
              }}
              camera={{ fov: 32, near: 0.05, far: 80, position: [0, 1.2, 4.5] }}
              shadows={quality.shadows}
              frameloop="always"
              onCreated={({ gl, scene }) => {
                gl.setClearColor('#05060a', 1)
                gl.toneMapping = THREE.ACESFilmicToneMapping
                gl.toneMappingExposure = 1.05
                scene.fog = new THREE.FogExp2('#05060a', 0.045)
              }}
            >
              <Experience
                quality={quality}
                variant={variant}
                reducedMotion={device.reducedMotion}
                onSceneReady={handleSceneReady}
                onPerformanceDrop={handlePerformanceDrop}
              />
            </Canvas>
          </SceneBoundary>
        </div>
      ) : (
        <FallbackPortfolio />
      )}

      {/* Readability scrim under the copy on small screens, where the machine
          sits above the text. */}
      {!useStatic ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-[58%] md:hidden"
          style={{
            background:
              'linear-gradient(to top, rgba(5,6,10,0.96) 0%, rgba(5,6,10,0.82) 34%, rgba(5,6,10,0.35) 68%, rgba(5,6,10,0) 100%)',
          }}
        />
      ) : null}

      <Navbar activeSceneId={activeSceneId} ready={ready} staticMode={useStatic} />

      {!useStatic ? (
        <>
          <ProgressBar ready={ready} />
          <ScrollHint ready={ready} />
        </>
      ) : null}

      {/* The film's chapters only exist when the film is running: in static mode
          the fallback above IS the content, and rendering both would duplicate
          every heading (and the h1) for readers and crawlers alike. */}
      {!useStatic ? <SectionOverlay /> : null}

      {!useStatic ? <Loader onComplete={() => setReady(true)} /> : null}
    </>
  )
}
