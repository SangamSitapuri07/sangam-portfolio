import { SCENES } from '../data/story.js'
import { clamp01, getSceneIndex } from './storyboard.js'

// Shared pixel <-> narrative mapping. It is deliberately independent of GSAP
// and the browser so restoration uses the same rules as ordinary scrolling.
export function createStoryLayout(starts, totalHeight, viewportHeight, rootTop = 0) {
  const maxScroll = Math.max(1, totalHeight - viewportHeight)
  const scenes = SCENES.map((scene, index) => {
    const start = Math.max(0, Math.min(maxScroll - .001, starts[index] ?? 0))
    const end = index === SCENES.length - 1 ? maxScroll : Math.max(start + .001, Math.min(maxScroll, starts[index + 1] ?? maxScroll))
    return { id: scene.id, start, end, length: end - start, range: scene.range }
  })
  return { rootTop, maxScroll, totalHeight, viewportHeight, scenes }
}

export function measureStoryLayout(root, sections, viewportHeight, scrollY) {
  const rootTop = root.getBoundingClientRect().top + scrollY
  const starts = sections.map((section) => section.getBoundingClientRect().top + scrollY - rootTop)
  return createStoryLayout(starts, root.scrollHeight, viewportHeight, rootTop)
}

export function progressFromScroll(scrollY, layout) {
  const y = Math.max(0, Math.min(layout.maxScroll, scrollY - layout.rootTop))
  let index = layout.scenes.findLastIndex((scene) => y >= scene.start)
  index = Math.max(0, index)
  const scene = layout.scenes[index]
  const local = clamp01((y - scene.start) / scene.length)
  return { index, local, progress: scene.range[0] + local * (scene.range[1] - scene.range[0]) }
}

export function scrollFromProgress(value, layout) {
  const progress = clamp01(value)
  const scene = layout.scenes[getSceneIndex(progress)]
  const local = clamp01((progress - scene.range[0]) / (scene.range[1] - scene.range[0]))
  return layout.rootTop + scene.start + local * scene.length
}

export const STORY_HISTORY_KEY = 'portfolioStory'

export function createBookmark(progress, location) {
  const value = clamp01(progress)
  return { version: 1, progress: value, scene: SCENES[getSceneIndex(value)].id, pathname: location.pathname, hash: location.hash }
}

export function readBookmark(state, location) {
  const bookmark = state?.[STORY_HISTORY_KEY]
  if (!bookmark || bookmark.version !== 1 || !Number.isFinite(bookmark.progress)) return null
  if (bookmark.progress < 0 || bookmark.progress > 1) return null
  if (bookmark.pathname !== location.pathname || bookmark.hash !== location.hash) return null
  if (bookmark.scene !== SCENES[getSceneIndex(bookmark.progress)].id) return null
  return bookmark.progress
}
