import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { RESUME_ASSET } from '../../src/config/assets.js'
import { PERSONAL } from '../../src/data/personal.js'
import { TIMELINE, ACHIEVEMENTS } from '../../src/data/timeline.js'

const pdf = readFileSync(new URL('../../public/assets/sangamcv.pdf', import.meta.url))

test('resume download is the exact supplied PDF, not a placeholder', () => {
  assert(pdf.subarray(0, 5).equals(Buffer.from('%PDF-')))
  assert.equal(pdf.length, RESUME_ASSET.bytes)
  const sha = createHash('sha1').update(`blob ${pdf.length}\0`).update(pdf).digest('hex')
  assert.equal(sha, RESUME_ASSET.sourceSha)
  assert.equal(PERSONAL.resume, RESUME_ASSET.url)
  assert.equal(PERSONAL.resumeFilename, RESUME_ASSET.downloadName)
})

test('CV-backed timeline has credentials and real dates rather than invented employment', () => {
  assert.equal(TIMELINE.length, 6)
  assert.equal(new Set(TIMELINE.map(({ id }) => id)).size, TIMELINE.length)
  for (const item of TIMELINE) {
    assert(['certification', 'training'].includes(item.kind))
    assert(item.date && item.organisation)
    assert.equal(new URL(item.credentialUrl).hostname, 'drive.google.com')
    assert.match(item.sortDate, /^20\d{2}-\d{2}$/)
  }
  assert(TIMELINE.every((item, index) => !index || TIMELINE[index - 1].sortDate >= item.sortDate))
})

test('the two achievements are recorded as supplied in the CV', () => {
  assert.equal(ACHIEVEMENTS.length, 2)
  assert.equal(ACHIEVEMENTS[0].title, '200+ coding problems solved')
  assert.equal(ACHIEVEMENTS[1].title, '4-Star Python Programming Badge')
  assert(ACHIEVEMENTS.every(({ date }) => date === 'Aug 2024 – Present'))
})
