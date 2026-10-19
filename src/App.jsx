import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Navigation from './components/story/Navigation.jsx'
import ScrollController from './components/story/ScrollController.jsx'
import StorySections from './sections/StorySections.jsx'
import ProjectDialog from './components/story/ProjectDialog.jsx'
import SceneBoundary from './components/scene/SceneBoundary.jsx'
import { useMediaQuery } from './hooks/useMediaQuery.js'
import { useAssetAvailability } from './hooks/useAssetAvailability.js'
import { supportsWebGL2 } from './utils/webgl.js'
import { LAPTOP_ASSET } from './config/assets.js'
import { FLAGSHIP_PROJECT_ID } from './data/story.js'
import { getCaseStudy } from './data/caseStudies.js'
import { storyRuntime } from './animation/runtime.js'
import { createBookmark } from './animation/storyLayout.js'
import { getProjectById } from './data/projects.js'
import { THEME } from './config/theme.js'
import { SCENE_READY_TIMEOUT_MS } from './config/loading.js'

const PortfolioCanvas = lazy(() => import('./components/scene/PortfolioCanvas.jsx'))
const imagePreference = () => { try { return window.localStorage.getItem('portfolio:image-view') === 'true' } catch { return false } }

export default function App() {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [reading, setReading] = useState(imagePreference)
  const [unavailable, setUnavailable] = useState(false)
  const [ready, setReady] = useState(false)
  const readyRef = useRef(false)
  const [projectId, setProjectId] = useState(null)
  const [featuredProjectId, setFeaturedProjectId] = useState(FLAGSHIP_PROJECT_ID)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const syncLocation = () => {
      const parameters = new URLSearchParams(window.location.search)
      const project = parameters.get('project')
      const feature = parameters.get('feature')
      const selected = getCaseStudy(feature) ? feature : FLAGSHIP_PROJECT_ID
      setProjectId(getProjectById(project) ? project : null)
      setFeaturedProjectId(selected)
      storyRuntime.setFeaturedProject(selected)
    }
    syncLocation()
    window.addEventListener('popstate', syncLocation)
    return () => window.removeEventListener('popstate', syncLocation)
  }, [])

  const capable = useMemo(() => mounted && !reading && !reducedMotion && supportsWebGL2(), [mounted, reading, reducedMotion])
  const handleUnavailable = useCallback(() => {
    storyRuntime.pendingPosition = createBookmark(storyRuntime.progress, window.location)
    setUnavailable(true)
    readyRef.current = false
    setReady(false)
  }, [])
  const markReady = useCallback(() => { readyRef.current = true; setReady(true) }, [])
  const cinematic = capable && !unavailable
  const assetAvailable = useAssetAvailability(LAPTOP_ASSET.url, cinematic, handleUnavailable)
  useEffect(() => {
    if (!cinematic || ready) return
    const timer = setTimeout(() => {
      if (!readyRef.current) handleUnavailable()
    }, SCENE_READY_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [cinematic, ready, handleUnavailable])

  const closeProject = useCallback(() => {
    setProjectId(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('project')
    history.replaceState(history.state, '', url)
  }, [])
  const openProject = useCallback((id) => {
    if (!getProjectById(id)) return
    setProjectId(id)
    const url = new URL(window.location.href)
    url.searchParams.set('project', id)
    history.replaceState(history.state, '', url)
  }, [])
  const selectFeaturedProject = useCallback((id) => {
    if (!getCaseStudy(id)) return
    setFeaturedProjectId(id)
    storyRuntime.setFeaturedProject(id)
    const url = new URL(window.location.href)
    if (id === FLAGSHIP_PROJECT_ID) url.searchParams.delete('feature')
    else url.searchParams.set('feature', id)
    history.replaceState(history.state, '', url)
  }, [])

  function toggleView() {
    storyRuntime.pendingPosition = createBookmark(storyRuntime.progress, window.location)
    const next = cinematic
    setReading(next)
    setUnavailable(false)
    readyRef.current = false
    setReady(false)
    try { localStorage.setItem('portfolio:image-view', String(next)) } catch { /* State still works without storage. */ }
  }

  return (
    <div className={`protocol-root ${cinematic ? 'is-cinematic' : 'is-reading'}`} data-render-mode={cinematic ? '3d' : 'image'} data-model-ready={String(ready)} data-capability-checked={String(mounted)} style={{ '--bg': THEME.background, '--surface': THEME.surface, '--accent': THEME.accent, '--ink': THEME.ink, '--muted': THEME.muted }}>
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="protocol-atmosphere" aria-hidden="true" />
      {cinematic && assetAvailable && <SceneBoundary onFailure={handleUnavailable}><Suspense fallback={null}><PortfolioCanvas onUnavailable={handleUnavailable} onReady={markReady} /></Suspense></SceneBoundary>}
      <Navigation cinematic={cinematic} reducedMotion={reducedMotion} onToggleView={toggleView} />
      <main id="main" tabIndex={-1}><StorySections cinematic={cinematic} onOpenProject={openProject} featuredProjectId={featuredProjectId} onFeatureProject={selectFeaturedProject} /></main>
      <ScrollController cinematic={cinematic} reducedMotion={reducedMotion} dialogOpen={Boolean(projectId)} />
      <ProjectDialog projectId={projectId} onClose={closeProject} />
    </div>
  )
}
