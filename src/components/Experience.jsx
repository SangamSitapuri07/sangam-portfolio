import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'

import CameraRig from '@/components/CameraRig'
import Interactions from '@/components/Interactions'
import Laptop from '@/components/Laptop'
import Studio from '@/components/Studio'
import Effects from '@/components/Effects'
import { createScreenTextures } from '@/lib/screenTextures'

/**
 * Experience — everything inside the canvas.
 *
 * Its job is wiring: build the screen textures, mount the machine and the studio,
 * and hand a shared `refs` bucket to the camera rig so children can register
 * objects without triggering renders. All animation lives in `lib/director.js`.
 */
export default function Experience({
  quality,
  variant,
  reducedMotion,
  onSceneReady,
  onPerformanceDrop,
  onHoverChange,
}) {
  const gl = useThree((state) => state.gl)
  const refs = useRef({ rig: null, lights: null, loaderProgress: 1, film: null })

  /* Screen content lives for the session: one canvas per panel, swapped by key. */
  const screenTextures = useMemo(
    () =>
      createScreenTextures({
        quality,
        renderer: gl,
        getProgress: () => refs.current.film?.progress ?? 0,
        getLoaderProgress: () => refs.current.loaderProgress ?? 1,
      }),
    [quality, gl]
  )

  useEffect(() => () => screenTextures.dispose(), [screenTextures])

  const handleRig = useCallback(
    (rig) => {
      refs.current.rig = rig
      onSceneReady?.(rig)
    },
    [onSceneReady]
  )

  const registerLights = useCallback((lights) => {
    refs.current.lights = lights
  }, [])

  useEffect(() => {
    gl.setClearColor('#05060a', 1)
  }, [gl])

  return (
    <>
      <CameraRig
        quality={quality}
        variant={variant}
        reducedMotion={reducedMotion}
        screenTextures={screenTextures}
        refs={refs}
        onPerformanceDrop={onPerformanceDrop}
      />

      <Studio quality={quality} registerLights={registerLights} />

      {/* Drag, hover and click live here: they need the canvas element and the
          shared refs, and they must not re-render anything while they work. */}
      <Interactions refs={refs} reducedMotion={reducedMotion} onHoverChange={onHoverChange} />

      <Suspense fallback={null}>
        <Laptop quality={quality} onRig={handleRig} />
      </Suspense>

      <Effects quality={quality} />
    </>
  )
}
