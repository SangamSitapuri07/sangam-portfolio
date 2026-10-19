import test from 'node:test'
import assert from 'node:assert/strict'
import { checkLocalAsset } from '../../src/utils/assetCheck.js'

const response = (status, type, length) => ({ ok: status === 200, headers: new Headers({ 'content-type': type, ...(length === undefined ? {} : { 'content-length': String(length) }) }) })

test('preflight accepts real local binaries and rejects HTML, empty, missing, and failed responses', async () => {
  assert.equal(await checkLocalAsset('/model.glb', { fetcher: async () => response(200, 'model/gltf-binary', 5000) }), true)
  for (const item of [response(404, 'text/plain', 10), response(200, 'Text/HTML', 1000), response(200, 'model/gltf-binary', 0)]) {
    assert.equal(await checkLocalAsset('/model.glb', { fetcher: async () => item }), false)
  }
  assert.equal(await checkLocalAsset('/model.glb', { fetcher: async () => { throw new Error('Offline') } }), false)
})

test('a hanging HEAD request times out and aborts instead of waiting forever', async () => {
  let signal
  const result = await checkLocalAsset('/model.glb', { timeoutMs: 15, fetcher: (_url, options) => { signal = options.signal; return new Promise(() => {}) } })
  assert.equal(result, false)
  assert.equal(signal.aborted, true)
})

test('a cancelled component does not begin an asset request', async () => {
  const controller = new AbortController()
  controller.abort()
  let called = false
  assert.equal(await checkLocalAsset('/model.glb', { signal: controller.signal, fetcher: async () => { called = true } }), false)
  assert.equal(called, false)
})
