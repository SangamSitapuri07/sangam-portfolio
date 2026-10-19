import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { storyRuntime } from '../../animation/runtime.js'

// Added schematic geometry, NOT an internal motherboard extracted from GLB.
// Its provenance is explicitly labelled in the semantic breakdown/core scenes.
export default function EngineeringCore({ compact }) {
  const root = useRef()
  const geometry = useMemo(() => {
    const vertices = []
    for (let i = 0; i < 10; i++) {
      const x = -.82 + i * .18, z = -.43 + (i % 4) * .24
      vertices.push(x, .036, z, x * .45, .036, z, x * .45, .036, z, x * .45, .036, 0)
    }
    const shape = new BufferGeometry()
    shape.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    return shape
  }, [])
  useFrame(() => {
    const frame = storyRuntime.getFrame(compact)
    root.current.visible = frame.core > .001
    root.current.position.set(.1, .22 + frame.explosion * .12, .7 * frame.rawExplosion)
    root.current.scale.setScalar(Math.max(.001, frame.core * .96))
  })
  return (
    <group ref={root} name="illustrative-engineering-core" visible={false}>
      <mesh><boxGeometry args={[1.8, .04, 1.18]} /><meshStandardMaterial color="#102c33" roughness={.53} metalness={.5} /></mesh>
      <mesh position={[0, .055, 0]}><boxGeometry args={[.43, .08, .39]} /><meshStandardMaterial color="#101b25" roughness={.3} metalness={.7} /></mesh>
      <mesh position={[0, .102, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.27, .22]} /><meshBasicMaterial color="#35e7ff" transparent opacity={.5} /></mesh>
      {[-.58, .58].map((x) => <mesh key={x} position={[x, .06, .24]}><boxGeometry args={[.19, .07, .42]} /><meshStandardMaterial color="#273f48" roughness={.45} metalness={.65} /></mesh>)}
      <lineSegments geometry={geometry}><lineBasicMaterial color="#35d8e9" transparent opacity={.7} /></lineSegments>
    </group>
  )
}
