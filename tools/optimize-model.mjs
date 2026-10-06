/**
 * Model pipeline.
 *
 * The scanned laptop ships as an 8.3 MB glTF. This script turns it into a
 * deployable asset without changing how it looks, then writes it to
 * `public/models/cyberpunk_laptop.glb` — the path the app loads.
 *
 * What it does, in order:
 *   1. prune    — drops meshes/materials/textures nothing references. The scan
 *                 carries two unused 1024² images (≈2 MB of its 2.7 MB of
 *                 textures) left over from the original project.
 *   2. dedup    — merges duplicate accessors/materials.
 *   3. quantize — 14-bit positions, 10-bit normals, 12-bit UVs. Supported by
 *                 three.js out of the box via KHR_mesh_quantization.
 *   4. textures — re-encodes to WebP (sharp) at the original resolution.
 *
 * The untouched master stays at the repository root as the design source.
 *
 *   npm run model:optimize
 *
 * Re-run it any time the master changes; the app needs no changes.
 */

import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, KHRMaterialsEmissiveStrength } from '@gltf-transform/extensions'
import { dedup, prune, quantize, textureCompress } from '@gltf-transform/functions'
import sharp from 'sharp'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SOURCE = path.join(root, 'cyberpunk_laptop.glb')
const TARGET_DIR = path.join(root, 'public', 'models')
const TARGET = path.join(TARGET_DIR, 'cyberpunk_laptop.glb')

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`

async function main() {
  const before = (await stat(SOURCE)).size
  console.log(`\n▸ source  ${mb(before)}  ${path.relative(root, SOURCE)}`)

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  const document = await io.read(SOURCE)

  const texturesBefore = document.getRoot().listTextures().length
  await document.transform(
    prune(),
    dedup(),
    quantize({
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 12,
      quantizeColor: 8,
      quantizeWeight: 8,
    }),
    textureCompress({
      encoder: sharp,
      targetFormat: 'webp',
      quality: 82,
      resize: [1024, 1024],
    })
  )

  // Keep the emissive-strength extension explicit: the app relies on being able
  // to read and override those values.
  if (!document.getRoot().listExtensionsUsed().some((e) => e.extensionName === 'KHR_materials_emissive_strength')) {
    document.createExtension(KHRMaterialsEmissiveStrength).setRequired(false)
  }

  const out = await io.writeBinary(document)
  await mkdir(TARGET_DIR, { recursive: true })
  await writeFile(TARGET, Buffer.from(out))

  const after = (await stat(TARGET)).size
  const stats = {
    meshes: document.getRoot().listMeshes().length,
    materials: document.getRoot().listMaterials().length,
    textures: document.getRoot().listTextures().length,
  }

  console.log(`▸ output  ${mb(after)}  ${path.relative(root, TARGET)}`)
  console.log(`▸ saved   ${mb(before - after)}  (${Math.round((1 - after / before) * 100)}% smaller)`)
  console.log(
    `▸ kept    ${stats.meshes} meshes · ${stats.materials} materials · ${texturesBefore}→${stats.textures} textures\n`
  )
}

main().catch((error) => {
  console.error('\n✗ model pipeline failed\n', error)
  process.exitCode = 1
})
