/**
 * Software preview renderer (development tool, not shipped).
 *
 * The sandbox has no GPU and no browser, so the only way to LOOK at the scene
 * while composing camera values and the exploded view is to rasterise it here.
 * It is deliberately crude — flat shading, a z-buffer, no textures — but it shows
 * silhouette, framing and overlap, which is what composition decisions need.
 *
 *   node tools/preview-raster.mjs [outfile.png] [--view=hero|breakdown|...]
 */

import * as THREE from 'three'
import { createCanvas } from '@napi-rs/canvas'
import { writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'

globalThis.self = globalThis
globalThis.createImageBitmap = async () => ({ width: 2, height: 2, close() {} })

const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')

const W = Number(process.env.W || 960)
const H = Number(process.env.H || 620)

const LIGHTS = [
  { dir: new THREE.Vector3(-0.55, 0.72, 0.65).normalize(), color: [0.85, 0.9, 1.0], intensity: 1.05 },
  { dir: new THREE.Vector3(-0.6, 0.25, -0.75).normalize(), color: [0.22, 0.5, 1.0], intensity: 1.25 },
  { dir: new THREE.Vector3(0.7, 0.2, -0.65).normalize(), color: [0.5, 0.38, 1.0], intensity: 0.8 },
]

export function renderMeshes({ meshes, camera, target, fov = 32, width = W, height = H, background = '#05060a', near = 0.02, far = 60, ambient = 0.22 }) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)
  const image = ctx.createImageData(width, height)
  const data = image.data

  const cam = new THREE.PerspectiveCamera(fov, width / height, near, far)
  cam.position.copy(camera)
  cam.lookAt(target)
  cam.updateMatrixWorld(true)
  cam.updateProjectionMatrix()

  const view = new THREE.Matrix4().copy(cam.matrixWorldInverse ?? cam.matrixWorld.clone().invert())
  const proj = cam.projectionMatrix
  const vp = new THREE.Matrix4().multiplyMatrices(proj, view)

  const zbuf = new Float32Array(width * height).fill(Infinity)
  const bg = [parseInt(background.slice(1, 3), 16), parseInt(background.slice(3, 5), 16), parseInt(background.slice(5, 7), 16)]
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = bg[0]; data[i * 4 + 1] = bg[1]; data[i * 4 + 2] = bg[2]; data[i * 4 + 3] = 255
  }

  const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
  const w = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
  const s = [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()]
  const n = new THREE.Vector3()
  const e1 = new THREE.Vector3()
  const e2 = new THREE.Vector3()

  const project = (vec, out) => {
    out.set(vec.x, vec.y, vec.z, 1).applyMatrix4(vp)
  }

  const uvScratch = [new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()]

  for (const item of meshes) {
    const mesh = item.mesh || item
    if (!mesh.isMesh || item.hidden) continue
    const geometry = mesh.geometry
    const position = geometry.attributes.position
    if (!position) continue
    const index = geometry.index
    const uvAttr = geometry.attributes.uv
    const map = item.map || null
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    const baseColor = item.color ? new THREE.Color(item.color) : material?.emissive && material.emissive.getHex() !== 0 ? material.emissive.clone() : material?.color?.clone() || new THREE.Color('#888888')
    const tone = item.tone ?? 1
    const emissive = Boolean(item.emissive || (material?.emissive && material.emissive.getHex() !== 0))
    mesh.updateWorldMatrix(true, false)
    const count = index ? index.count : position.count
    for (let i = 0; i < count; i += 3) {
      const ia = index ? index.getX(i) : i
      const ib = index ? index.getX(i + 1) : i + 1
      const ic = index ? index.getX(i + 2) : i + 2
      v[0].fromBufferAttribute(position, ia).applyMatrix4(mesh.matrixWorld)
      v[1].fromBufferAttribute(position, ib).applyMatrix4(mesh.matrixWorld)
      v[2].fromBufferAttribute(position, ic).applyMatrix4(mesh.matrixWorld)
      e1.subVectors(v[1], v[0]); e2.subVectors(v[2], v[0])
      n.crossVectors(e1, e2).normalize()
      const centre = w[0].copy(v[0]).add(v[1]).add(v[2]).multiplyScalar(1 / 3)
      const toCam = v[0].clone().sub(cam.position).normalize()
      if (n.dot(toCam) > 0) n.negate() // two-sided shading

      let r = baseColor.r * tone, g = baseColor.g * tone, b = baseColor.b * tone
      if (!emissive) {
        let lit = ambient
        let lr = ambient, lg = ambient, lb = ambient
        for (const L of LIGHTS) {
          const d = Math.max(0, n.dot(L.dir)) * L.intensity
          lr += d * L.color[0] * 0.72
          lg += d * L.color[1] * 0.72
          lb += d * L.color[2] * 0.72
        }
        r *= lr; g *= lg; b *= lb
      } else {
        r = Math.min(1, r * 1.5); g = Math.min(1, g * 1.5); b = Math.min(1, b * 1.5)
      }

      if (map && uvAttr) {
        uvScratch[0].fromBufferAttribute(uvAttr, ia)
        uvScratch[1].fromBufferAttribute(uvAttr, ib)
        uvScratch[2].fromBufferAttribute(uvAttr, ic)
      }

      project(v[0], s[0]); project(v[1], s[1]); project(v[2], s[2])
      const verts = []
      let skip = false
      for (let k = 0; k < 3; k += 1) {
        const q = s[k]
        if (q.w <= 1e-4) { skip = true; break }
        const ndcX = q.x / q.w
        const ndcY = q.y / q.w
        const sx = (ndcX * 0.5 + 0.5) * width
        const sy = (1 - (ndcY * 0.5 + 0.5)) * height
        verts.push([sx, sy, q.w])
      }
      if (skip) continue

      const minX = Math.max(0, Math.floor(Math.min(verts[0][0], verts[1][0], verts[2][0])))
      const maxX = Math.min(width - 1, Math.ceil(Math.max(verts[0][0], verts[1][0], verts[2][0])))
      const minY = Math.max(0, Math.floor(Math.min(verts[0][1], verts[1][1], verts[2][1])))
      const maxY = Math.min(height - 1, Math.ceil(Math.max(verts[0][1], verts[1][1], verts[2][1])))
      if (maxX < minX || maxY < minY) continue
      const [ax, ay, az] = verts[0]
      const [bx, by, bz] = verts[1]
      const [cx, cy, cz] = verts[2]
      const denom = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
      if (Math.abs(denom) < 1e-9) continue
      for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
          const px = x + 0.5, py = y + 0.5
          const w0 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / denom
          const w1 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / denom
          const w2 = 1 - w0 - w1
          if (w0 < -0.001 || w1 < -0.001 || w2 < -0.001) continue
          const depth = 1 / (w0 / az + w1 / bz + w2 / cz)
          const idx = y * width + x
          if (depth >= zbuf[idx]) continue
          zbuf[idx] = depth
          const o = idx * 4
          if (map) {
            // Perspective-correct UV interpolate, then nearest-sample the canvas.
            const u = (w0 * uvScratch[0].x / az + w1 * uvScratch[1].x / bz + w2 * uvScratch[2].x / cz) * depth
            const vv = (w0 * uvScratch[0].y / az + w1 * uvScratch[1].y / bz + w2 * uvScratch[2].y / cz) * depth
            const tx = Math.min(map.width - 1, Math.max(0, Math.round(u * (map.width - 1))))
            // CanvasTexture default flipY = true: v = 1 samples the top row.
            const ty = Math.min(map.height - 1, Math.max(0, Math.round((1 - vv) * (map.height - 1))))
            const to = (ty * map.width + tx) * 4
            data[o] = map.data[to]
            data[o + 1] = map.data[to + 1]
            data[o + 2] = map.data[to + 2]
            data[o + 3] = 255
            continue
          }
          data[o] = Math.min(255, Math.round(255 * Math.pow(Math.min(r, 1), 1 / 2.2)))
          data[o + 1] = Math.min(255, Math.round(255 * Math.pow(Math.min(g, 1), 1 / 2.2)))
          data[o + 2] = Math.min(255, Math.round(255 * Math.pow(Math.min(b, 1), 1 / 2.2)))
          data[o + 3] = 255
        }
      }
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

export async function loadLaptopRig() {
  const { createServer } = await import('vite')
  const server = await createServer({ root: path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'), logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' })
  const { assembleLaptop } = await server.ssrLoadModule('/src/lib/modelParts.js')
  const file = await readFile(new URL('../public/models/cyberpunk_laptop.glb', import.meta.url))
  const gltf = await new Promise((res, rej) =>
    new GLTFLoader().parse(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength), '', res, rej)
  )
  return assembleLaptop(gltf.scene, { quality: { id: 'high', glassOverlay: true } })
}
