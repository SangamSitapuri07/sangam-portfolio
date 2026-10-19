import { PropertyBinding } from 'three'

// GLTFLoader sanitizes punctuation (for example Cube.001_3 → Cube001_3).
// Keep source node names in the asset manifest and resolve them consistently.
export function resolveModelNode(scene, sourceName) {
  return scene.getObjectByName(sourceName) ?? scene.getObjectByName(PropertyBinding.sanitizeNodeName(sourceName))
}
