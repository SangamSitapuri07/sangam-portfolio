import test from 'node:test'
import assert from 'node:assert/strict'
import { SCENES } from '../../src/data/story.js'
import { createStoryLayout, progressFromScroll, scrollFromProgress, createBookmark, readBookmark, STORY_HISTORY_KEY } from '../../src/animation/storyLayout.js'

const layouts = [
  createStoryLayout(SCENES.map((_, i) => i * 1300), 13500, 900),
  createStoryLayout(SCENES.map((_, i) => i * 800), 8200, 844, 60),
  createStoryLayout(SCENES.map((_, i) => i * 1600), 16400, 768),
]

test('scroll position and storyboard progress round-trip in every layout', () => {
  for (const layout of layouts) {
    for (let index = 0; index <= 1000; index++) {
      const progress = index / 1000
      const restored = progressFromScroll(scrollFromProgress(progress, layout), layout).progress
      assert(Math.abs(restored - progress) < 1e-10, `Round trip failed at ${progress}`)
    }
  }
})

test('a mid-chapter bookmark survives viewport and reading-layout changes', () => {
  for (const progress of [.056, .256, .376, .578, .697, .863, .988]) {
    const firstY = scrollFromProgress(progress, layouts[0])
    const p = progressFromScroll(firstY, layouts[0]).progress
    for (const layout of layouts.slice(1)) {
      const nextY = scrollFromProgress(p, layout)
      assert(Math.abs(progressFromScroll(nextY, layout).progress - progress) < 1e-10)
    }
  }
})

test('scroll mapping clamps out-of-range values and remains finite', () => {
  for (const layout of layouts) {
    assert.equal(progressFromScroll(-10000, layout).progress, 0)
    assert.equal(progressFromScroll(1e9, layout).progress, 1)
    assert.equal(scrollFromProgress(-1, layout), layout.rootTop)
    assert.equal(scrollFromProgress(100, layout), layout.rootTop + layout.maxScroll)
  }
})

test('history bookmarks are scoped to an entry, reject stale data, and allow modal queries', () => {
  const location = { pathname: '/', hash: '#skills', search: '?project=nuno' }
  const bookmark = createBookmark(.376, location)
  const state = { anotherFeature: true, [STORY_HISTORY_KEY]: bookmark }
  assert.equal(readBookmark(state, { pathname: '/', hash: '#skills', search: '' }), .376)
  assert.equal(readBookmark(state, { pathname: '/', hash: '#contact' }), null)
  assert.equal(readBookmark(state, { pathname: '/other', hash: '#skills' }), null)
  assert.equal(readBookmark({}, location), null)
  assert.equal(readBookmark({ [STORY_HISTORY_KEY]: { ...bookmark, progress: NaN } }, location), null)
  assert.equal(readBookmark({ [STORY_HISTORY_KEY]: { ...bookmark, scene: 'old-scene' } }, location), null)
})
