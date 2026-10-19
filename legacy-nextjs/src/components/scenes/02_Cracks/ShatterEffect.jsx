'use client'

// Face Model with DISSOLVE SHATTER EFFECT
// Face actually breaks apart during shatter

import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useFaceStore } from '@/store/useFaceStore'
import { useSceneStore } from '@/store/useSceneStore'
import { useMouseTracker } from '@/hooks/useMouseTracker'
import * as THREE from 'three'

export default function FaceModel() {
  const groupRef = useRef()
  const modelRef = useRef()
  
  const { scene } = useGLTF('/models/face.glb')
  
  const isVisible = useFaceStore(state => state.isVisible)
  const opacity = useFaceStore(state => state.opacity)
  const trackingEnabled = useFaceStore(state => state.trackingEnabled)
  const scale = useFaceStore(state => state.scale)
  const scrollProgress = useSceneStore(state => state.scrollProgress)
  
  const mouse = useMouseTracker()

  const targetRotation = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0, y: 0 })
  const breathingPhase = useRef(0)

  // Custom dissolve shader uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDissolveAmount: { value: 0 },
    uDissolveColor: { value: new THREE.Color('#00d4ff') },
    uEdgeWidth: { value: 0.05 },
  }), [])

  // Apply custom shader to all materials
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          // Store original material
          if (!child.userData.originalMaterial) {
            child.userData.originalMaterial = child.material
          }

          // Modify shader to add dissolve effect
          child.material.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = uniforms.uTime
            shader.uniforms.uDissolveAmount = uniforms.uDissolveAmount
            shader.uniforms.uDissolveColor = uniforms.uDissolveColor
            shader.uniforms.uEdgeWidth = uniforms.uEdgeWidth

            // Add varyings
            shader.vertexShader = shader.vertexShader.replace(
              '#include <common>',
              `
              #include <common>
              varying vec3 vWorldPos;
              `
            )

            shader.vertexShader = shader.vertexShader.replace(
              '#include <fog_vertex>',
              `
              #include <fog_vertex>
              vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
              `
            )

            // Fragment shader: add dissolve effect
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <common>',
              `
              #include <common>
              uniform float uTime;
              uniform float uDissolveAmount;
              uniform vec3 uDissolveColor;
              uniform float uEdgeWidth;
              varying vec3 vWorldPos;
              
              // Simple noise function
              float random(vec3 p) {
                return fract(sin(dot(p, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
              }
              
              float noise(vec3 p) {
                vec3 i = floor(p);
                vec3 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                
                float n000 = random(i);
                float n100 = random(i + vec3(1.0, 0.0, 0.0));
                float n010 = random(i + vec3(0.0, 1.0, 0.0));
                float n110 = random(i + vec3(1.0, 1.0, 0.0));
                float n001 = random(i + vec3(0.0, 0.0, 1.0));
                float n101 = random(i + vec3(1.0, 0.0, 1.0));
                float n011 = random(i + vec3(0.0, 1.0, 1.0));
                float n111 = random(i + vec3(1.0, 1.0, 1.0));
                
                float nx00 = mix(n000, n100, f.x);
                float nx10 = mix(n010, n110, f.x);
                float nx01 = mix(n001, n101, f.x);
                float nx11 = mix(n011, n111, f.x);
                
                float nxy0 = mix(nx00, nx10, f.y);
                float nxy1 = mix(nx01, nx11, f.y);
                
                return mix(nxy0, nxy1, f.z);
              }
              `
            )

            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <dithering_fragment>',
              `
              #include <dithering_fragment>
              
              // Generate noise pattern for dissolve
              float noiseValue = noise(vWorldPos * 8.0);
              float dissolveThreshold = uDissolveAmount;
              
              // Discard pixels based on noise + threshold
              if (noiseValue < dissolveThreshold) {
                discard;
              }
              
              // Add glowing edge effect
              float edge = smoothstep(dissolveThreshold, dissolveThreshold + uEdgeWidth, noiseValue);
              vec3 edgeColor = uDissolveColor * (1.0 - edge) * 3.0;
              gl_FragColor.rgb += edgeColor;
              `
            )

            // Store reference to update uniforms
            child.material.userData.shader = shader
          }
          
          // Force material to recompile
          child.material.needsUpdate = true
          
          if (child.material.roughness !== undefined) {
            child.material.roughness = 0.7
            child.material.metalness = 0.1
          }
        }
      })
    }
  }, [scene, uniforms])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    // Update time uniform
    uniforms.uTime.value = state.clock.elapsedTime

    // Calculate dissolve amount based on scroll
    let dissolveAmount = 0
    
    if (scrollProgress >= 0.15 && scrollProgress < 0.22) {
      // Dissolve happens during crack + shatter
      dissolveAmount = (scrollProgress - 0.15) / 0.07
    } else if (scrollProgress >= 0.22) {
      dissolveAmount = 1
    }
    
    uniforms.uDissolveAmount.value = dissolveAmount

    // Breathing animation
    breathingPhase.current += delta * 0.8
    const breath = Math.sin(breathingPhase.current) * 0.015
    groupRef.current.position.y = 0 + breath

    // Mouse tracking
    if (trackingEnabled) {
      targetRotation.current.y = mouse.normalizedX * 0.3
      targetRotation.current.x = -mouse.normalizedY * 0.15
      
      currentRotation.current.x = THREE.MathUtils.lerp(
        currentRotation.current.x,
        targetRotation.current.x,
        0.06
      )
      currentRotation.current.y = THREE.MathUtils.lerp(
        currentRotation.current.y,
        targetRotation.current.y,
        0.06
      )
      
      groupRef.current.rotation.x = currentRotation.current.x
      groupRef.current.rotation.y = currentRotation.current.y
    }

    // Apply scale
    groupRef.current.scale.setScalar(scale * 2.5)
  })

  if (!isVisible) return null

  return (
    <group ref={groupRef} position={[-2.5, 0, 0]}>
      <primitive ref={modelRef} object={scene} />
    </group>
  )
}

useGLTF.preload('/models/face.glb')