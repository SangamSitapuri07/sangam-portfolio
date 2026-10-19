import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { LAPTOP_ASSET } from '../../config/assets.js'
import { storyRuntime } from '../../animation/runtime.js'
import { prepareExplodedParts, applyExplodedParts } from '../../animation/modelRig.js'
import { resolveModelNode } from '../../utils/modelNodes.js'
import { createScreenSurface } from './ScreenSurface.js'
import EngineeringCore from './EngineeringCore.jsx'

export default function LaptopRig({ compact, onReady }) {
  const { scene } = useGLTF(LAPTOP_ASSET.url, false, true)
  const root = useRef()
  const pointerGroup = useRef()
  const ready = useRef(false)
  const { invalidate, gl } = useThree()
  const prepared = useMemo(() => {
    const model = scene.clone(true)
    const materials = new Map()
    model.traverse((object) => {
      if (!object.isMesh) return
      const source = Array.isArray(object.material) ? object.material : [object.material]
      const copies = source.map((material) => {
        if (!materials.has(material.uuid)) {
          const copy = material.clone()
          if ('emissiveIntensity' in copy) copy.emissiveIntensity = Math.min(copy.emissiveIntensity, .8)
          if ('envMapIntensity' in copy) copy.envMapIntensity = .85
          materials.set(material.uuid, copy)
        }
        return materials.get(material.uuid)
      })
      object.material = Array.isArray(object.material) ? copies : copies[0]
    })
    const parts = prepareExplodedParts(model)
    const screen = resolveModelNode(model, LAPTOP_ASSET.nodes.mainScreen)
    const surface = createScreenSurface(invalidate, ({ projectId, status }) => {
      gl.domElement.dataset.screenProject = projectId
      gl.domElement.dataset.screenPreview = status
    })
    // The original LCD uses only a central band of an atlas (U≈.188–.814).
    // Fit our content to that existing UV region without mutating geometry.
    const uv = screen.geometry.attributes.uv
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity
    for (let i = 0; i < uv.count; i++) {
      minU = Math.min(minU, uv.getX(i)); maxU = Math.max(maxU, uv.getX(i))
      minV = Math.min(minV, uv.getY(i)); maxV = Math.max(maxV, uv.getY(i))
    }
    surface.texture.repeat.set(1 / (maxU - minU), 1 / (maxV - minV))
    surface.texture.offset.set(-minU / (maxU - minU), -minV / (maxV - minV))
    // Only the genuine LCD material is replaced. The exterior design and all
    // other artist textures remain recognisable and the binary is untouched.
    screen.material.map = surface.texture
    screen.material.emissiveMap = surface.texture
    screen.material.emissive.set('#ffffff')
    screen.material.emissiveIntensity = .65
    screen.material.needsUpdate = true
    return { model, materials: [...materials.values()], parts, screen, surface }
  }, [scene, invalidate, gl])

  useEffect(() => {
    prepared.surface.activate()
    return () => {
      prepared.materials.forEach((material) => material.dispose())
      prepared.surface.dispose()
    }
  }, [prepared])

  useFrame(() => {
    const frame = storyRuntime.getFrame(compact)
    root.current.rotation.y = frame.rotation
    root.current.position.y = frame.lift
    applyExplodedParts(prepared.parts, frame)
    prepared.screen.material.emissiveIntensity = .08 + frame.screen * .66
    prepared.surface.draw(frame)
    if (pointerGroup.current && !compact) {
      const strength = 1 - frame.rawExplosion
      const targetX = storyRuntime.pointer.y * .018 * strength
      const targetY = storyRuntime.pointer.x * .025 * strength
      pointerGroup.current.rotation.x += (targetX - pointerGroup.current.rotation.x) * .12
      pointerGroup.current.rotation.y += (targetY - pointerGroup.current.rotation.y) * .12
      if (Math.abs(targetX - pointerGroup.current.rotation.x) + Math.abs(targetY - pointerGroup.current.rotation.y) > .0002) invalidate()
    }
    if (!ready.current) { ready.current = true; storyRuntime.ready = true; onReady() }
    // Read-only diagnostics support browser regression tests, never control the
    // animation. There are no per-frame React state updates.
    if (root.current) {
      root.current.userData.explosion = frame.explosion
      root.current.userData.lid = frame.lid
    }
  })

  return (
    <group ref={root} name="portfolio-laptop-rig">
      <group ref={pointerGroup}>
        <primitive object={prepared.model} dispose={null} />
        <EngineeringCore compact={compact} />
      </group>
    </group>
  )
}
