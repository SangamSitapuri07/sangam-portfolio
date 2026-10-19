import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { LAPTOP_ASSET } from '../../src/config/assets.js'

const binary = readFileSync(new URL('../../public/models/cyberpunk_laptop.glb', import.meta.url))
const jsonLength = binary.readUInt32LE(12)
const gltf = JSON.parse(binary.subarray(20, 20 + jsonLength).toString())

test('supplied model is a valid, complete GLB 2.0', () => {
  assert.equal(binary.subarray(0, 4).toString(), 'glTF')
  assert.equal(binary.readUInt32LE(4), 2)
  assert.equal(binary.readUInt32LE(8), binary.length)
  assert.equal(binary.length, LAPTOP_ASSET.sourceBytes)
  assert(gltf.images.every((image) => 'bufferView' in image && !image.uri))
})

test('the original artist asset is unmodified', () => {
  const sha = createHash('sha1').update(`blob ${binary.length}\0`).update(binary).digest('hex')
  assert.equal(sha, LAPTOP_ASSET.sourceSha)
  assert.equal(gltf.asset.extras.author, 'Vivien Deroche (https://sketchfab.com/blue-odym)')
  assert.equal(gltf.asset.extras.license.split(' ')[0], 'CC-BY-4.0')
})

test('base and lid are separate groups with screen meshes under the lid', () => {
  const baseIndex = gltf.nodes.findIndex(({ name }) => name === LAPTOP_ASSET.nodes.base)
  const lidIndex = gltf.nodes.findIndex(({ name }) => name === LAPTOP_ASSET.nodes.lid)
  const screenIndex = gltf.nodes.findIndex(({ name }) => name === LAPTOP_ASSET.nodes.mainScreen)
  assert(baseIndex >= 0 && lidIndex >= 0 && screenIndex >= 0)
  assert.notEqual(baseIndex, lidIndex)
  assert(gltf.nodes[lidIndex].children.includes(screenIndex))
  assert(!gltf.nodes[baseIndex].children.includes(screenIndex))
  assert.deepEqual(gltf.nodes[lidIndex].matrix.slice(12, 15), LAPTOP_ASSET.hinge.position)
})
