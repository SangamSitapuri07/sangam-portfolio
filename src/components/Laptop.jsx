import { Component, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
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
 * does the animating, this component only builds and hands over.
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
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

function ScannedLaptop({ onRig, quality }) {
  const gltf = useGLTF(laptopModel.url)
  const rig = useMemo(() => assembleLaptop(gltf.scene, { quality }), [gltf, quality])

  useEffect(() => {
    onRig(rig)
  }, [rig, onRig])

  return <primitive object={rig.machine} />
}

export default function Laptop({ onRig, quality }) {
  const [scannedRig, setScannedRig] = useState(null)

  const fallbackRig = useMemo(
    () => (typeof document === 'undefined' ? null : buildProceduralLaptop({ quality })),
    [quality]
  )

  /* Report the stand-in immediately so the director has something to pose, then
   * hand over to the scan the moment it arrives. */
  useEffect(() => {
    if (!scannedRig && fallbackRig) onRig?.(fallbackRig)
  }, [scannedRig, fallbackRig, onRig])

  const handleScanned = useCallback(
    (rig) => {
      setScannedRig(rig)
      onRig?.(rig)
    },
    [onRig]
  )

  return (
    <group name="laptop-slot">
      <RigErrorBoundary>
        <Suspense fallback={null}>
          <ScannedLaptop quality={quality} onRig={handleScanned} />
        </Suspense>
      </RigErrorBoundary>
      {!scannedRig && fallbackRig ? <primitive object={fallbackRig.machine} /> : null}
    </group>
  )
}
