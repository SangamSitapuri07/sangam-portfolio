import { Environment, Lightformer } from '@react-three/drei'

export default function StudioLighting({ compact = false }) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[-3, 5, 4]} intensity={3.2} color="#e5eaff" />
      <pointLight position={[4, 2.5, -2]} intensity={14} distance={12} color="#35d8ee" />
      <pointLight position={[-3, 2, -2]} intensity={7} distance={10} color="#937aff" />
      <Environment resolution={compact ? 128 : 256} frames={1}>
        <Lightformer position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 5, 1]} intensity={3.5} color="#e6ecff" />
        <Lightformer position={[4, 2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[5, 3, 1]} intensity={2} color="#62b6ca" />
        <Lightformer position={[-4, 1, 0]} rotation={[0, Math.PI / 2, 0]} scale={[4, 2, 1]} intensity={1.5} color="#b4a4e2" />
      </Environment>
    </>
  )
}
