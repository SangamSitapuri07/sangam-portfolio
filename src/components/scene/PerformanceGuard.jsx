import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { storyRuntime } from '../../animation/runtime.js'

export default function PerformanceGuard({ onDegrade, onUnavailable }) {
  const { setDpr } = useThree()
  const samples = useRef({ previous: 0, frames: 0, total: 0, lowered: false, finished: false })
  useFrame((_state, delta) => {
    const sample = samples.current
    if (sample.finished) return
    const moving = Math.abs(sample.previous - storyRuntime.progress) > .00001
    sample.previous = storyRuntime.progress
    // Ignore pauses and first-frame shader compilation. Demand rendering has
    // long idle deltas that must not be interpreted as poor GPU performance.
    if (!moving || delta > .5 || delta < .001) return
    sample.frames++; sample.total += delta
    if (sample.frames < 100) return
    const average = sample.total / sample.frames
    if (!sample.lowered && average > .055) {
      setDpr(1); onDegrade(); sample.lowered = true
      sample.frames = 0; sample.total = 0
    } else if (sample.lowered && average > .12) {
      sample.finished = true; onUnavailable()
    } else { sample.frames = 0; sample.total = 0 }
  })
  return null
}
