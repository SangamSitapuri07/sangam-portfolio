import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Group, Matrix4, PropertyBinding } from 'three'
import { SCENES, STORY_PROJECT_IDS } from '../../src/data/story.js'
import { sampleStory, CAMERA_POSES, getSceneIndex } from '../../src/animation/storyboard.js'
import { prepareExplodedParts, applyExplodedParts } from '../../src/animation/modelRig.js'
import { getProjectById } from '../../src/data/projects.js'

function sourceHierarchy() {
  const glb = readFileSync(new URL('../../public/models/cyberpunk_laptop.glb', import.meta.url))
  const doc = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString())
  const objects = doc.nodes.map((node) => {
    const object = new Group()
    object.name = PropertyBinding.sanitizeNodeName(node.name)
    if (node.matrix) new Matrix4().fromArray(node.matrix).decompose(object.position, object.quaternion, object.scale)
    else { if (node.translation) object.position.fromArray(node.translation); if (node.rotation) object.quaternion.fromArray(node.rotation); if (node.scale) object.scale.fromArray(node.scale) }
    return object
  })
  doc.nodes.forEach((node, index) => node.children?.forEach((child) => objects[index].add(objects[child])))
  return objects[0]
}

test('ten scenes cover one uninterrupted 0–1 storyboard', () => {
  assert.equal(SCENES.length, 10)
  assert.equal(new Set(SCENES.map(({ id }) => id)).size, 10)
  assert.equal(SCENES[0].range[0], 0)
  assert.equal(SCENES[9].range[1], 1)
  SCENES.forEach((scene, i) => { assert(scene.range[1] > scene.range[0]); if (i) assert.equal(SCENES[i - 1].range[1], scene.range[0]) })
})

test('the sampler is deterministic, finite, and constrained across forward/reverse scroll', () => {
  for (let i = 0; i <= 500; i++) {
    const p = i / 500
    const frame = sampleStory(p)
    assert.deepEqual(frame, sampleStory(p))
    assert(frame.camera.every(Number.isFinite))
    assert(frame.target.every(Number.isFinite))
    assert(frame.explosion >= 0 && frame.explosion <= 1)
    assert(frame.lid >= 0 && frame.lid <= 1)
    assert(frame.scene >= 0 && frame.scene < 10)
  }
  assert.equal(sampleStory(-100).progress, 0)
  assert.equal(sampleStory(100).progress, 1)
  assert.equal(getSceneIndex(1), 9)
})

test('camera positions remain continuous at every keyframe', () => {
  for (const { at } of CAMERA_POSES.slice(1, -1)) {
    const a = sampleStory(at - .00001), b = sampleStory(at + .00001)
    assert(a.camera.every((value, i) => Math.abs(value - b.camera[i]) < .01))
  }
})

test('the source hierarchy returns exactly to its assembled transforms after arbitrary scrubbing', () => {
  const model = sourceHierarchy(), parts = prepareExplodedParts(model)
  const rest = parts.map(({ object }) => ({ position: object.position.toArray(), quaternion: object.quaternion.toArray() }))
  for (const p of [.10, .29, .63, .70, .32, .75, .18, .53, .28, .81]) applyExplodedParts(parts, sampleStory(p))
  applyExplodedParts(parts, { explosion: 0, lid: 1 })
  parts.forEach(({ object }, i) => {
    assert.deepEqual(object.position.toArray(), rest[i].position)
    assert(object.quaternion.toArray().every((value, j) => Math.abs(value - rest[i].quaternion[j]) < 1e-12))
  })
})

test('scenes 3 and 7 use the same explosion curve and the mobile separation is smaller', () => {
  assert.equal(sampleStory(.18).explosion, 0)
  assert.equal(sampleStory(.32).explosion, 1)
  assert.equal(sampleStory(.75).explosion, 0)
  assert.equal(sampleStory(.5).explosion, 1)
  assert.equal(sampleStory(.5, true).explosion, .57)
})

test('story project IDs resolve to real editable projects with usable visuals', () => {
  assert.equal(STORY_PROJECT_IDS.length, 4)
  for (const id of STORY_PROJECT_IDS) {
    const project = getProjectById(id)
    assert(project.links.github)
    assert(project.media.poster.startsWith('/images/projects/'))
  }
})
