import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { MeshoptDecoder } from 'meshoptimizer'
import { LAPTOP_ASSET } from '../../src/config/assets.js'

await MeshoptDecoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder })
const source = (await io.read(new URL('../../public/models/cyberpunk_laptop.glb', import.meta.url).pathname)).getRoot()
const runtimeURL = new URL(`../../public${LAPTOP_ASSET.url}`, import.meta.url)
const optimized = (await io.read(runtimeURL.pathname)).getRoot()
const bytes = readFileSync(runtimeURL)
const equalBytes = (a, b) => Buffer.from(a.buffer, a.byteOffset, a.byteLength).equals(Buffer.from(b.buffer, b.byteOffset, b.byteLength))

test('the runtime asset is a smaller valid meshopt derivative of the exact source', () => {
  assert.equal(bytes.subarray(0, 4).toString(), 'glTF')
  assert.equal(bytes.length, bytes.readUInt32LE(8))
  assert.equal(bytes.length, LAPTOP_ASSET.bytes)
  assert(bytes.length < LAPTOP_ASSET.sourceBytes * .7)
  const hash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
  assert.equal(hash, LAPTOP_ASSET.optimizedSha)
  const meta = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString())
  assert(meta.extensionsRequired.includes('EXT_meshopt_compression'))
})

test('compression preserves every named node, hierarchy, transform, and mesh binding', () => {
  const a = source.listNodes(), b = optimized.listNodes()
  assert.deepEqual(a.map((node) => node.getName()), b.map((node) => node.getName()))
  assert.equal(a.length, 42)
  for (let i = 0; i < a.length; i++) {
    assert.deepEqual(a[i].listChildren().map((node) => node.getName()), b[i].listChildren().map((node) => node.getName()))
    for (const getter of ['getTranslation', 'getRotation', 'getScale']) {
      assert(a[i][getter]().every((value, j) => Math.abs(value - b[i][getter]()[j]) < 1e-12))
    }
    assert.equal(source.listMeshes().indexOf(a[i].getMesh()), optimized.listMeshes().indexOf(b[i].getMesh()))
  }
})

test('all geometry attributes and oriented triangles are unchanged after decoding', () => {
  const a = source.listMeshes(), b = optimized.listMeshes()
  assert.equal(a.length, 37)
  assert.equal(a.length, b.length)
  for (let i = 0; i < a.length; i++) {
    const primitives = a[i].listPrimitives(), decoded = b[i].listPrimitives()
    assert.equal(primitives.length, decoded.length)
    for (let j = 0; j < primitives.length; j++) {
      assert.deepEqual(primitives[j].listSemantics(), decoded[j].listSemantics())
      for (const semantic of primitives[j].listSemantics()) {
        assert(equalBytes(primitives[j].getAttribute(semantic).getArray(), decoded[j].getAttribute(semantic).getArray()), `Changed ${semantic}`)
      }
      const x = primitives[j].getIndices().getArray(), y = decoded[j].getIndices().getArray()
      assert.equal(x.length, y.length)
      // Meshopt may rotate an index triple, but cannot change its winding or vertices.
      for (let k = 0; k < x.length; k += 3) {
        assert([0, 1, 2].some((r) => x[k] === y[k + r] && x[k + 1] === y[k + (r + 1) % 3] && x[k + 2] === y[k + (r + 2) % 3]))
      }
    }
  }
})

test('artist textures and material appearance are preserved without recompression', () => {
  assert.equal(source.listTextures().length, 8)
  assert.equal(source.listTextures().length, optimized.listTextures().length)
  source.listTextures().forEach((texture, index) => assert(equalBytes(texture.getImage(), optimized.listTextures()[index].getImage())))
  const a = source.listMaterials(), b = optimized.listMaterials()
  assert.equal(a.length, b.length)
  a.forEach((material, index) => {
    for (const getter of ['getName', 'getBaseColorFactor', 'getEmissiveFactor', 'getMetallicFactor', 'getRoughnessFactor', 'getAlphaMode', 'getDoubleSided']) {
      assert.deepEqual(material[getter](), b[index][getter]())
    }
  })
})
