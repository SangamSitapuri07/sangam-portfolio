import { getSceneIndex, sampleStory } from './storyboard.js'
import { FLAGSHIP_PROJECT_ID } from '../data/story.js'

// Mutable frame state is deliberately outside React. Subscribers are notified
// at scene boundaries only; scrolling never sets React state every frame.
const listeners = new Set()
let cachedFrame = null
let cachedCompact = null
let cachedFeatured = null

export const storyRuntime = {
  progress: 0,
  scene: 0,
  ready: false,
  invalidate: null,
  pendingPosition: null,
  featuredProjectId: FLAGSHIP_PROJECT_ID,
  pointer: { x: 0, y: 0 },
  setProgress(progress) {
    this.progress = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0))
    const scene = getSceneIndex(this.progress)
    if (scene !== this.scene) { this.scene = scene; listeners.forEach((notify) => notify()) }
    this.invalidate?.()
    if (typeof document !== 'undefined') document.documentElement.style.setProperty('--story-progress', String(this.progress))
  },
  setFeaturedProject(id) {
    if (this.featuredProjectId === id) return
    this.featuredProjectId = id
    this.invalidate?.()
  },
  getFrame(compact = false) {
    if (!cachedFrame || cachedFrame.progress !== this.progress || cachedCompact !== compact || cachedFeatured !== this.featuredProjectId) {
      cachedFrame = sampleStory(this.progress, compact, this.featuredProjectId)
      cachedCompact = compact
      cachedFeatured = this.featuredProjectId
    }
    return cachedFrame
  },
}
export const subscribeScene = (notify) => { listeners.add(notify); return () => listeners.delete(notify) }
export const getActiveScene = () => storyRuntime.scene
export const getServerScene = () => 0
