import { useCallback, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

import { createDirector } from '@/lib/director'
import { sceneState } from '@/lib/scrollEngine'
import { autoTune } from '@/config/quality'

/**
 * CameraRig — the projection booth.
 *
 * It owns the ONLY per-frame loop in the application. Everything animated — the
 * camera, the hinge, the machine's pose, the studio lights and the laptop screen —
 * is written here, by the director, in a single pass. No React state is touched
 * while the user scrolls.
 *
 * The same loop watches frame time and asks for one quality step down if the first
 * seconds are consistently slow, so a weak GPU gets a smooth film instead of a
 * beautiful slideshow.
 */
export default function CameraRig({
  quality,
  variant,
  reducedMotion,
  screenTextures,
  refs,
  onPerformanceDrop,
}) {
  const camera = useThree((state) => state.camera)

  const director = useMemo(
    () =>
      createDirector({
        quality,
        variant,
        reducedMotion,
        screenTextures,
        sceneState,
      }),
    [quality, variant, reducedMotion, screenTextures]
  )

  const samples = useRef({ frames: 0, total: 0, judged: false })

  useFrame((_, delta) => {
    director.register({
      camera,
      rig: refs.current.rig,
      lights: refs.current.lights,
    })
    const film = director.update(delta)
    refs.current.film = film

    /* ---- Frame-time watchdog (runs once, ever) ---- */
    if (autoTune.enabled && !samples.current.judged && film.progress !== null) {
      samples.current.frames += 1
      // Ignore the first frames: shader compilation and texture upload dominate.
      if (samples.current.frames > 30) samples.current.total += delta * 1000

      const measured = samples.current.frames - 30
      if (measured >= autoTune.sampleFrames) {
        samples.current.judged = true
        const average = samples.current.total / Math.max(measured, 1)
        if (average > autoTune.slowFrameMs && quality.id !== 'low') {
          onPerformanceDrop?.(average)
        }
      }
    }
  })

  /** Children register their objects here; the loop picks them up without a render. */
  const register = useCallback(
    (objects) => {
      if (objects?.rig) refs.current.rig = objects.rig
      if (objects?.lights) refs.current.lights = objects.lights
    },
    [refs]
  )

  useMemo(() => {
    refs.current.register = register
    return register
  }, [refs, register])

  return null
}
