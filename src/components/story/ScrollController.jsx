import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { storyRuntime } from '../../animation/runtime.js'
import { range } from '../../animation/storyboard.js'
import { measureStoryLayout, progressFromScroll, scrollFromProgress, createBookmark, readBookmark, STORY_HISTORY_KEY } from '../../animation/storyLayout.js'

gsap.registerPlugin(ScrollTrigger)

function hashId() {
  try { return decodeURIComponent(window.location.hash.slice(1)) } catch { return '' }
}

export default function ScrollController({ cinematic, reducedMotion, dialogOpen = false }) {
  const engine = useRef(null)
  const paused = useRef(dialogOpen)

  useEffect(() => {
    paused.current = dialogOpen
    if (dialogOpen) engine.current?.stop()
    else engine.current?.start()
  }, [dialogOpen])

  useLayoutEffect(() => {
    const root = document.getElementById('story')
    if (!root) return
    const sections = [...root.querySelectorAll('.story-scene')]
    const featureVisual = root.querySelector('.case-study-visual')
    const projectCards = [...root.querySelectorAll('.universe-card')]
    const effects = sections.map((section) => ({
      y: gsap.quickSetter(section.firstElementChild, 'y', 'px'),
      opacity: gsap.quickSetter(section.firstElementChild, 'opacity'),
    }))
    let layout = measureStoryLayout(root, sections, window.innerHeight, window.scrollY)
    let width = window.innerWidth
    let disposed = false, restoring = false, initialized = false
    let refreshFrame = 0, routeFrame = 0, persistTimer = 0
    const previousRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'

    const lenis = cinematic && !reducedMotion
      ? new Lenis({ duration: .85, smoothWheel: true, syncTouch: false, anchors: false })
      : null
    engine.current = lenis
    if (paused.current) lenis?.stop()
    lenis?.on('scroll', ScrollTrigger.update)
    const tick = (time) => lenis?.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    const playhead = { value: 0 }

    function savePosition() {
      if (disposed || restoring) return
      const progress = progressFromScroll(window.scrollY, layout).progress
      history.replaceState({ ...history.state, [STORY_HISTORY_KEY]: createBookmark(progress, window.location) }, '')
    }

    function update() {
      if (!initialized || restoring || disposed) return
      // ScrollTrigger can refresh before our ResizeObserver callback (notably
      // on mobile). Never reinterpret a new viewport's fraction in old bounds.
      if (window.innerWidth !== width || window.innerHeight !== layout.viewportHeight || root.scrollHeight !== layout.totalHeight) {
        requestReflow()
        return
      }
      const y = playhead.value * layout.maxScroll
      const { progress } = progressFromScroll(layout.rootTop + y, layout)
      storyRuntime.setProgress(progress)
      clearTimeout(persistTimer)
      persistTimer = window.setTimeout(savePosition, 180)
      if (!cinematic || reducedMotion) return

      const focus = range(.49, .535, progress)
      projectCards.forEach((card, index) => {
        card.style.opacity = String(index ? 1 - focus * .45 : 1)
        card.style.transform = `perspective(1200px) translateZ(${index ? -focus * 35 : focus * 35}px)`
      })
      if (featureVisual) {
        const arrival = range(.49, .545, progress), departure = range(.607, .637, progress)
        featureVisual.style.transform = `perspective(1200px) translate3d(${departure * 75}px,${(1 - arrival) * 25}px,0) scale(${.93 + arrival * .07 - departure * .18})`
        featureVisual.style.opacity = String(.72 + arrival * .28 - departure * .65)
      }
      layout.scenes.forEach((scene, index) => {
        const entry = index === 0 ? 1 : Math.max(0, Math.min(1, (y + window.innerHeight * .82 - scene.start) / (window.innerHeight * .65)))
        effects[index].y((1 - entry) * 24)
        effects[index].opacity(.6 + entry * .4)
      })
    }

    // The only cinematic timeline. Pixel restoration updates its playhead too;
    // it never starts another camera/lid tween or competes with ScrollTrigger.
    const timeline = gsap.timeline({
      scrollTrigger: {
        id: 'portfolio-master', trigger: root, start: 'top top', end: 'bottom bottom',
        scrub: reducedMotion || !cinematic ? true : .55,
        invalidateOnRefresh: true,
        onRefresh: () => { if (initialized && !restoring) requestReflow() },
      },
      onUpdate: update,
    })
    timeline.to(playhead, { value: 1, duration: 1, ease: 'none' }, 0)
    initialized = true

    function jumpToProgress(progress) {
      if (disposed) return
      restoring = true
      const y = scrollFromProgress(progress, layout)
      lenis?.resize()
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
      else window.scrollTo({ top: y, behavior: 'instant' })
      timeline.scrollTrigger?.update()
      const scrub = timeline.scrollTrigger?.getTween()
      if (scrub && typeof scrub.progress === 'function') scrub.progress(1)
      const fraction = Math.max(0, Math.min(1, (y - layout.rootTop) / layout.maxScroll))
      timeline.progress(fraction)
      playhead.value = fraction
      restoring = false
      update()
    }

    function reflow() {
      refreshFrame = 0
      if (disposed) return
      const next = measureStoryLayout(root, sections, window.innerHeight, window.scrollY)
      const changed = next.totalHeight !== layout.totalHeight || next.viewportHeight !== layout.viewportHeight || width !== window.innerWidth || next.rootTop !== layout.rootTop
      if (!changed) return
      const progress = storyRuntime.progress
      layout = next; width = window.innerWidth
      restoring = true
      timeline.scrollTrigger?.refresh()
      restoring = false
      jumpToProgress(progress)
    }

    function requestReflow() {
      if (!disposed && !refreshFrame) refreshFrame = requestAnimationFrame(reflow)
    }

    function restoreEntry(allowPending = false) {
      if (disposed) return
      layout = measureStoryLayout(root, sections, window.innerHeight, window.scrollY)
      width = window.innerWidth
      const pending = allowPending ? readBookmark({ [STORY_HISTORY_KEY]: storyRuntime.pendingPosition }, window.location) : null
      if (allowPending) storyRuntime.pendingPosition = null
      const saved = readBookmark(history.state, window.location)
      const id = hashId()
      const scene = layout.scenes.find((item) => item.id === id)
      // A pending mode switch preserves the exact point within its chapter.
      // History entries outrank a hash on reload/back: #skills is not a command
      // to throw away the visitor's position halfway through that chapter.
      const progress = pending ?? saved ?? (scene ? scene.range[0] : id === 'main' ? 0 : progressFromScroll(window.scrollY, layout).progress)
      restoring = true
      timeline.scrollTrigger?.refresh()
      restoring = false
      jumpToProgress(progress)
    }

    function restoreRoute() {
      cancelAnimationFrame(routeFrame)
      routeFrame = requestAnimationFrame(() => restoreEntry())
    }

    function focusTarget(target) {
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1')
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })
      }
      target.focus({ preventScroll: true })
    }

    function navigate(event) {
      if (!(event.target instanceof Element)) return
      const anchor = event.target.closest('a[href^="#"]')
      if (!anchor || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.classList.contains('skip-link')) return
      const id = anchor.getAttribute('href').slice(1)
      const target = document.getElementById(id)
      const scene = layout.scenes.find((item) => item.id === id)
      if (!target || !scene) return
      event.preventDefault()
      savePosition()
      const progress = progressFromScroll(layout.rootTop + scene.start + (id === 'home' ? 0 : 1), layout).progress
      const state = { ...history.state, [STORY_HISTORY_KEY]: createBookmark(progress, { pathname: location.pathname, hash: `#${id}` }) }
      if (location.hash === `#${id}`) history.replaceState(state, '', `#${id}`)
      else history.pushState(state, '', `#${id}`)
      const complete = () => { savePosition(); if (event.detail === 0) focusTarget(target) }
      if (lenis) lenis.scrollTo(scrollFromProgress(progress, layout), { duration: 1.05, force: true, onComplete: complete })
      else { jumpToProgress(progress); complete() }
    }

    const observer = new ResizeObserver(requestReflow)
    observer.observe(root)
    const visibility = () => { if (document.visibilityState === 'hidden') savePosition() }
    const pageshow = (event) => { if (event.persisted) restoreRoute() }
    document.addEventListener('click', navigate)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', savePosition)
    window.addEventListener('pageshow', pageshow)
    window.addEventListener('popstate', restoreRoute)
    window.addEventListener('hashchange', restoreRoute)
    window.addEventListener('resize', requestReflow)
    document.fonts.ready.then(() => { if (!disposed) requestReflow() })
    restoreEntry(true)

    return () => {
      savePosition()
      storyRuntime.pendingPosition = createBookmark(storyRuntime.progress, window.location)
      disposed = true
      clearTimeout(persistTimer)
      cancelAnimationFrame(refreshFrame)
      cancelAnimationFrame(routeFrame)
      document.removeEventListener('click', navigate)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('pagehide', savePosition)
      window.removeEventListener('pageshow', pageshow)
      window.removeEventListener('popstate', restoreRoute)
      window.removeEventListener('hashchange', restoreRoute)
      window.removeEventListener('resize', requestReflow)
      observer.disconnect()
      timeline.scrollTrigger?.kill()
      timeline.kill()
      sections.forEach((section) => gsap.set(section.firstElementChild, { clearProps: 'transform,opacity' }))
      gsap.set([...projectCards, ...(featureVisual ? [featureVisual] : [])], { clearProps: 'transform,opacity' })
      gsap.ticker.remove(tick)
      lenis?.destroy()
      if (engine.current === lenis) engine.current = null
      history.scrollRestoration = previousRestoration
    }
  }, [cinematic, reducedMotion])
  return null
}
