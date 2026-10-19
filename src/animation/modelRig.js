import { Quaternion, Vector3 } from 'three'
import { EXPLODED_PARTS } from './storyboard.js'
import { LAPTOP_ASSET } from '../config/assets.js'
import { resolveModelNode } from '../utils/modelNodes.js'

export function prepareExplodedParts(model) {
  model.updateMatrixWorld(true)
  return EXPLODED_PARTS.map((definition) => {
    const object = resolveModelNode(model, definition.name)
    if (!object) throw new Error(`Required laptop assembly is missing: ${definition.name}`)
    const inverseParent = object.parent.getWorldQuaternion(new Quaternion()).invert()
    return {
      ...definition, object,
      offset: new Vector3(...definition.offset).applyQuaternion(inverseParent),
      position: object.position.clone(), quaternion: object.quaternion.clone(), euler: object.rotation.clone(),
    }
  })
}

export function applyExplodedParts(parts, frame) {
  for (const part of parts) {
    part.object.position.copy(part.position).addScaledVector(part.offset, frame.explosion)
    part.object.quaternion.copy(part.quaternion)
    if (part.name === LAPTOP_ASSET.nodes.lid) part.object.rotation.x = part.euler.x * frame.lid
    part.object.rotation.x += part.turn[0] * frame.explosion
    part.object.rotation.y += part.turn[1] * frame.explosion
    part.object.rotation.z += part.turn[2] * frame.explosion
  }
}
