import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGLTF } from '@react-three/drei'

import { laptopModel } from '@/config/laptop'
import { assembleLaptop } from '@/lib/modelParts'
import { buildProceduralLaptop } from '@/lib/proceduralLaptop'

/**
 * Laptop — the machine itself.
 *
 * Two interchangeable sources, one rig interface:
 *   • the scanned model (`/models/cyberpunk_laptop.glb`) assembled onto a hinge,
 *   • the procedural stand-in, built to the same conventions and display size.
 *
 * The stand-in renders first, so the stage is never empty; when the scan resolves
 * it takes over. `onRig(rig)` always reports whichever is current — the director
 * does the animating, this component only builds, binds the displays and hands
 * over. The GLB is loaded once and reused for the whole session.
 */

class RigErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    // A missing or corrupt model must never blank the page.
    if (import.meta.env?.DEV) {
      console.warn('[laptop] using the procedural stand-in:', error?.message || error)
    }
    this.props.onFail?.(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

function ScannedLaptop({ onRig, quality, textures }) {
  const gltf = useGLTF(laptopModel.url)
  const rig = useMemo(() => assembleLaptop(gltf.scene, { quality }), [gltf, quality])

  /* The screens need their live textures bound after assembly — the rig cannot
     paint them, and the painter needs a mounted canvas. */
  useEffect(() => {
    if (!textures) return undefined
    rig.setScreenTextures?.(textures)
    return () => rig.setScreenTextures?.({ main: null, status: null })
  }, [rig, textures])

  useEffect(() => {
    onRig(rig)
  }, [rig, onRig])

  return <primitive object={rig.machine} />
}

export default function Laptop({ onRig, quality, textures, onModelError }) {
  const [scannedRig, setScannedRig] = useState(null)
  const fallbackRef = useRef(null)

  const fallbackRig = useMemo(() => {
    if (typeof document === 'undefined') return null
    try {
      return buildProceduralLaptop({ quality })
    } catch (error) {
      if (import.meta.env?.DEV) console.warn('[laptop] stand-in failed to build:', error)
      return null
    }
  }, [quality])

  /* The stand-in is reported immediately so the director always has something to
     pose; the scan takes over the moment it resolves. */
  useEffect(() => {
    if (scannedRig || !fallbackRig) return undefined
    fallbackRef.current = fallbackRig
    fallbackRig.setScreenTextures?.(textures)
    onRig?.(fallbackRig)
    return undefined
  }, [scannedRig, fallbackRig, onRig, textures])

  const handleScanned = useCallback(
    (rig) => {
      setScannedRig(rig)
      onRig?.(rig)
    },
    [onRig]
  )

  return (
    <group name="laptop-slot">
      <RigErrorBoundary onFail={onModelError}>
        <Suspense fallback={null}>
          <ScannedLaptop quality={quality} onRig={handleScanned} textures={textures} />
        </Suspense>
      </RigErrorBoundary>
      {!scannedRig && fallbackRig ? <primitive object={fallbackRig.machine} /> : null}
    </group>
  )
}

/* The model is the only heavy asset; ask drei to fetch it as soon as the module
   loads rather than when the component first suspends. */
useGLTF.preload?.(laptopModel.url)
