import { useEffect, useMemo, useRef } from 'react'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'

import { sceneState } from '@/lib/scrollEngine'

/**
 * Effects — post-processing, deliberately restrained.
 *
 * Bloom picks out the display and the emissive accents, a gentle vignette closes
 * the frame, and a very light film grain removes the digital flatness. Nothing
 * else: post should flatter the machine, not become the subject.
 *
 * The bloom's strength is scaled per scene from `film.fx.bloom`, so the breakdown
 * can glow harder than the quiet ending without touching the composer's settings.
 * Tiers decide whether the composer runs at all — `low` gets none, which is the
 * single biggest win on phones.
 */
export default function Effects({ quality }) {
  const gl = useThree((state) => state.gl)
  const bloomRef = useRef(null)
  const settings = quality?.postprocessing
  const baseBloom = settings?.bloom?.intensity ?? 0

  /* Bloom wants a float buffer to behave like film rather than a hard threshold. */
  const frameBufferType = useMemo(() => THREE.HalfFloatType, [])

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = quality?.id === 'low' ? 1.0 : 1.06
  }, [gl, quality])

  useFrame(() => {
    const effect = bloomRef.current
    if (!effect) return
    const scale = 0.55 + (sceneState.film?.fx.bloom ?? 0.9) * 0.75
    effect.intensity = baseBloom * scale
  })

  if (!settings?.enabled) return null

  const { vignette, noise } = settings
  const noiseBlend = noise.blendFunction === 'overlay' ? BlendFunction.OVERLAY : BlendFunction.SOFT_LIGHT

  return (
    <EffectComposer
      multisampling={0}
      frameBufferType={frameBufferType}
      enableNormalPass={false}
      disableNormalPass
    >
      <Bloom
        ref={bloomRef}
        intensity={baseBloom}
        luminanceThreshold={settings.bloom.threshold}
        luminanceSmoothing={settings.bloom.smoothing}
        mipmapBlur={settings.bloom.mipmapBlur}
        kernelSize={KernelSize.LARGE}
        radius={0.7}
      />
      <Vignette offset={vignette.offset} darkness={vignette.darkness} />
      <Noise premultiply opacity={noise.opacity} blendFunction={noiseBlend} />
    </EffectComposer>
  )
}
