import { useEffect, useMemo } from 'react'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

/**
 * Effects — post-processing, deliberately restrained.
 *
 * Bloom picks out the display and the emissive accents, a gentle vignette closes
 * the frame, and a very light film grain removes the digital flatness. Nothing
 * else: the brief's rule is that post should flatter the machine, not become the
 * subject.
 *
 * Tiers (`config/quality.js`) decide what runs: `low` gets no composer at all,
 * which is the single biggest win on phones.
 */
export default function Effects({ quality }) {
  const gl = useThree((state) => state.gl)
  const settings = quality?.postprocessing

  /* The composer needs a float buffer for bloom to behave like film rather than
   * a hard threshold. */
  const frameBufferType = useMemo(() => THREE.HalfFloatType, [])

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = quality?.id === 'low' ? 1.0 : 1.06
  }, [gl, quality])

  if (!settings?.enabled) return null

  const { bloom, vignette, noise } = settings

  const noiseBlend =
    noise.blendFunction === 'overlay' ? BlendFunction.OVERLAY : BlendFunction.SOFT_LIGHT

  return (
    <EffectComposer
      multisampling={0}
      frameBufferType={frameBufferType}
      enableNormalPass={false}
      disableNormalPass
    >
      <Bloom
        intensity={bloom.intensity}
        luminanceThreshold={bloom.threshold}
        luminanceSmoothing={bloom.smoothing}
        mipmapBlur={bloom.mipmapBlur}
        kernelSize={KernelSize.LARGE}
        radius={0.72}
      />
      <Vignette offset={vignette.offset} darkness={vignette.darkness} />
      <Noise premultiply opacity={noise.opacity} blendFunction={noiseBlend} />
    </EffectComposer>
  )
}
