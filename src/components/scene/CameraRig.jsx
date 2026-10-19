import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { storyRuntime } from '../../animation/runtime.js'

export default function CameraRig({ compact }) {
  const { camera, gl, size, invalidate } = useThree()
  useEffect(() => {
    storyRuntime.invalidate = invalidate
    invalidate()
    return () => { if (storyRuntime.invalidate === invalidate) storyRuntime.invalidate = null }
  }, [invalidate])
  useEffect(() => {
    camera.fov = compact ? 45 : 35
    camera.setViewOffset(size.width, size.height, compact ? 0 : -size.width * .20, 0, size.width, size.height)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, compact, size, invalidate])
  useFrame(() => {
    const frame = storyRuntime.getFrame(compact)
    camera.position.set(...frame.camera)
    camera.lookAt(...frame.target)
    gl.toneMappingExposure = frame.exposure
    const canvas = gl.domElement
    canvas.dataset.progress = frame.progress.toFixed(5)
    canvas.dataset.explosion = frame.explosion.toFixed(5)
    canvas.dataset.scene = String(frame.scene + 1)
  })
  return null
}
