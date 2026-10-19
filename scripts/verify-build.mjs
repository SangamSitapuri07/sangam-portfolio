import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { SCENES, STORY_PROJECT_IDS } from '../src/data/story.js'
import { getProjectById } from '../src/data/projects.js'
import { LAPTOP_ASSET, RESUME_ASSET } from '../src/config/assets.js'

const output = new URL('../dist/', import.meta.url)
const html = await readFile(new URL('index.html', output), 'utf8')
for (const scene of SCENES) assert(html.includes(`id="${scene.id}"`), `Missing prerendered chapter ${scene.id}`)
assert.equal((html.match(/class="story-scene /g) || []).length, 10)
assert(html.includes('application/ld+json'), 'Person metadata missing')
assert(html.includes('Download résumé'), 'Real resume action missing')
assert(!/your-email|your-name|example\.com/i.test(html), 'Placeholder content must not ship')

const paths = new Set([LAPTOP_ASSET.url, LAPTOP_ASSET.originalUrl, LAPTOP_ASSET.poster, RESUME_ASSET.url, '/assets/og-image.png'])
for (const id of STORY_PROJECT_IDS) paths.add(getProjectById(id).media.poster)
for (const match of html.matchAll(/(?:src|href)="(\/(?!\/)[^"?#]*)(?:[?#][^"]*)?"/g)) paths.add(match[1])
for (const path of paths) {
  if (!path || path === '/') continue
  assert(!path.includes('..'), 'Asset paths cannot escape the static output')
  await access(resolve(output.pathname, `.${path}`))
}
const model = await readFile(new URL(`.${LAPTOP_ASSET.url}`, output))
assert.equal(model.length, LAPTOP_ASSET.bytes)
assert(model.length < 6_000_000, 'Runtime model exceeds the release budget')
console.log(`Release checks passed: 10 prerendered chapters, structured metadata, ${paths.size} local assets, and ${(model.length / 1e6).toFixed(2)} MB runtime model.`)
