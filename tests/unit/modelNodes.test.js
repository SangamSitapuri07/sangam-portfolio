import test from 'node:test'
import assert from 'node:assert/strict'
import { Group } from 'three'
import { resolveModelNode } from '../../src/utils/modelNodes.js'

test('source names resolve after GLTFLoader sanitizes punctuation', () => {
  const scene = new Group()
  const lid = new Group()
  lid.name = 'Cube001_3'
  scene.add(lid)
  assert.equal(resolveModelNode(scene, 'Cube.001_3'), lid)
})

test('already-correct node names and missing nodes behave predictably', () => {
  const scene = new Group()
  const base = new Group()
  base.name = 'Cube_0'
  scene.add(base)
  assert.equal(resolveModelNode(scene, 'Cube_0'), base)
  assert.equal(resolveModelNode(scene, 'missing'), undefined)
})
