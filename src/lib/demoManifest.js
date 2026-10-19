/**
 * Reads `public/demos/manifest.json` once, so the demo environment knows whether
 * a project has a real web build hosted in this repo.
 *
 * Deliberately a manifest and not a probe: a HEAD request for a missing file looks
 * like success on every dev server that serves a single-page fallback, and a demo
 * that silently shows the wrong thing is worse than one that shows the recording.
 */

import { hostedPath } from '@/config/demos'

let cached = null
let pending = null

const load = async () => {
  if (cached) return cached
  if (!pending) {
    pending = fetch('/demos/manifest.json', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : { demos: {} }))
      .then((value) => {
        cached = value?.demos && typeof value.demos === 'object' ? value.demos : {}
        return cached
      })
      .catch(() => {
        cached = {}
        return cached
      })
  }
  return pending
}

/** The hosted build entry for a project, or null. */
export const hostedDemo = async (projectId) => {
  const manifest = await load()
  const entry = manifest?.[projectId]
  if (!entry) return null
  const path = typeof entry === 'string' ? entry : entry.path
  return { path: path || hostedPath(projectId), note: entry.note ?? null }
}

export default hostedDemo
