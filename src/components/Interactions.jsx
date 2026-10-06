import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import { demos } from '@/config/demos'
import { projects } from '@/data/projects'
import {
  initInteraction,
  interaction,
  noteScrollActivity,
  updateInteraction,
} from '@/lib/interaction'
import { requestDemo } from '@/lib/uiBus'

/**
 * Interactions — the machine as something you can touch.
 *
 * Three jobs, all of them event-driven except the one that has to be per-frame:
 *
 *   1. Attach the drag/touch listeners to the canvas (once).
 *   2. Raycast the display each frame to know whether the pointer is on it. That
 *      is the only per-frame work here: one ray against two meshes, and it sets a
 *      cursor and a boolean — never React state.
 *   3. On a click that is not a drag, open the demo environment for the project
 *      currently on screen.
 *
 * The offsets themselves live in `lib/interaction.js`; this component only feeds
 * them the clock and the pointer.
 */

const RAYCAST_INTERVAL = 2 // frames between hover tests; 30 Hz is plenty

export default function Interactions({ refs, reducedMotion = false, onHoverChange }) {
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const raycaster = useRef(new THREE.Raycaster())
  const pointer = useRef(new THREE.Vector2(0, 0))
  const frame = useRef(0)
  const lastProgress = useRef(null)

  /* ---- 1. listeners ---- */
  useEffect(() => {
    const activate = () => {
      /* Only meaningful when a project is the thing on the display. */
      const index = refs.current.film?.projectIndex ?? -1
      const project = projects[index]
      if (project && demos[project.id]) requestDemo(project.id)
    }

    return initInteraction({
      element: gl.domElement,
      onActivate: activate,
      reducedMotion,
    })
  }, [gl, refs, reducedMotion])

  /* ---- 2 & 3. per frame ---- */
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    updateInteraction(dt, state.clock.elapsedTime)

    /* A visitor scrolling is not idle. Tracked here rather than in the scroll
       engine so the engine stays a pure reader of scroll position. */
    const progress = refs.current.film?.progress ?? null
    if (progress !== null && progress !== lastProgress.current) {
      if (lastProgress.current !== null) noteScrollActivity()
      lastProgress.current = progress
    }

    /* Hover: is the pointer over a display panel? */
    frame.current += 1
    if (frame.current % RAYCAST_INTERVAL === 0) {
      const rig = refs.current.rig
      const meshes = rig?.screens ? Object.values(rig.screens).filter(Boolean) : []
      let hovering = false
      if (meshes.length) {
        raycaster.current.setFromCamera(pointer.current, camera)
        const hits = raycaster.current.intersectObjects(meshes, false)
        hovering = hits.length > 0
      }
      if (hovering !== interaction.hoveringScreen) {
        interaction.hoveringScreen = hovering
        onHoverChange?.(hovering)
      }
    }
  })

  /* R3F tracks the pointer for us; mirror it into a plain Vector2 (no allocation). */
  useEffect(() => {
    const onMove = (event) => {
      const rect = gl.domElement.getBoundingClientRect()
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }
    gl.domElement.addEventListener('pointermove', onMove, { passive: true })
    return () => gl.domElement.removeEventListener('pointermove', onMove)
  }, [gl])

  return null
}
