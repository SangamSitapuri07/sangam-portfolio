import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { scenes } from '@/config/scenes'
import { overlayOpacityFor, overlayRiseFor, arrivalProgress } from '@/lib/timeline'
import { onProgress, scrollToProgress } from '@/lib/scrollEngine'
import { announceProject } from '@/lib/uiBus'
import { projects } from '@/data/projects'
import {
  Awakening,
  Machine,
  Breakdown,
  Core,
  Universe,
  DeepDive,
  Rebuild,
  Beyond,
  Transmission,
  Afterglow,
} from '@/sections/chapters'

/**
 * SectionOverlay — the text layer of the film.
 *
 * The page is one tall column: ten sections, each exactly as tall as its scene's
 * share of the timeline (`config/scenes.js` heights), so DOM scrolling and 3D
 * progress are the same measurement. Inside each section a sticky viewport-height
 * panel holds the copy, which the scroll engine fades and lifts directly on the
 * DOM node — no React render per frame.
 *
 * The copy sits wherever the camera left room for it: left of the machine on
 * desktop, beneath it on phones. Those rectangles come from `lib/framing.js` —
 * the same ones the camera is fitted against and the composition check asserts —
 * so the words and the machine cannot end up in the same place.
 *
 * All content stays in the document at all times, so search engines and screen
 * readers get the whole portfolio whether or not they scroll like a human.
 */

const CHAPTERS = {
  awakening: Awakening,
  engine: Machine,
  breakdown: Breakdown,
  core: Core,
  universe: Universe,
  'deep-dive': DeepDive,
  rebuild: Rebuild,
  beyond: Beyond,
  transmission: Transmission,
  afterglow: Afterglow,
}

function SceneSection({ index, scene, children }) {
  const panelRef = useRef(null)
  const isBanner = scene.keys[0].camera.stage === 'banner'

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return undefined

    let lastOpacity = -1
    let lastShift = -1

    return onProgress((progress) => {
      const opacity = overlayOpacityFor(index, progress)
      if (Math.abs(opacity - lastOpacity) > 0.004) {
        lastOpacity = opacity
        panel.style.opacity = opacity.toFixed(3)
        // Never let invisible copy swallow clicks meant for the scene behind it.
        panel.style.pointerEvents = opacity < 0.12 ? 'none' : 'auto'
        panel.style.visibility = opacity <= 0.002 ? 'hidden' : 'visible'
      }

      const shift = (1 - overlayRiseFor(index, progress)) * 20
      if (Math.abs(shift - lastShift) > 0.3) {
        lastShift = shift
        panel.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`
      }
    })
  }, [index])

  return (
    <section
      id={scene.id}
      aria-labelledby={`${scene.id}-heading`}
      data-scene={scene.id}
      data-nav={scene.nav?.id}
      className="relative"
      style={{ height: `${scene.height}vh` }}
    >
      {/* The machine is the frame, so the copy sits on the shield in the lower
          left on a desktop and across the bottom on a phone — the two rectangles
          `lib/framing.js` calls `copy`, which the composition check measures the
          shield against. */}
      <div className="sticky top-0 flex h-[100svh] w-full items-end justify-start px-5 pt-24 pb-8 sm:px-8 sm:pb-10 md:px-[4.5vw] md:pb-[7vh]">
        <div
          className={`mx-auto flex w-full max-w-[1600px] flex-col ${
            isBanner ? 'items-center' : 'items-stretch'
          }`}
        >
          <div
            ref={panelRef}
            className={`will-change-[opacity,transform] ${
              isBanner
                ? 'mx-auto w-full max-w-2xl text-center'
                : 'w-full max-w-[40rem] md:max-w-[min(40rem,40vw)]'
            }`}
            style={{ opacity: index === 0 ? 1 : 0 }}
          >
            <div
              /* The panel has to fit inside `stages.full.copy`, or its top lines
                 climb into the part of the shield that fades out. Desktop: copy
                 runs 40→94% of the height, and the panel is pinned 7vh off the
                 bottom, so it gets 46svh. Mobile: 52→97%, pinned 2rem up, so 38.
                 Dense chapters scroll inside the panel rather than push the film
                 around. */
              className="max-h-[38svh] overflow-y-auto overscroll-contain pr-1 md:max-h-[46svh]"
              data-lenis-prevent
            >
              {children}
            </div>
          </div>
        </div>
      </div>
      {/* Kept for screen readers so the chapter is announced before it fades in */}
      <span className="sr-only">
        Scene {index + 1} of {scenes.length}: {scene.screen.section}
      </span>
    </section>
  )
}

export default function SectionOverlay() {
  /* Which project the deep dive is showing. Lifted here because two chapters
     write it: a card in Project Universe, and the tabs in the Deep Dive. */
  const [selectedProject, setSelectedProject] = useState(() => {
    if (typeof window === 'undefined') return projects[1].id
    const fromUrl = new URLSearchParams(window.location.search).get('project')
    return projects.some((project) => project.id === fromUrl) ? fromUrl : projects[1].id
  })

  /* The 3D display follows the case study the visitor picked in the DOM. */
  useEffect(() => {
    announceProject(selectedProject)
  }, [selectedProject])

  const openCaseStudy = useCallback((projectId) => {
    if (projectId) setSelectedProject(projectId)
    scrollToProgress(arrivalProgress('deep-dive'))
  }, [])

  const chapters = useMemo(
    () =>
      scenes.map((scene, index) => ({ scene, index, Content: CHAPTERS[scene.id] })),
    []
  )

  return (
    <main id="main-content" className="overlay-layer">
      {chapters.map(({ scene, index, Content }) => (
        <SceneSection key={scene.id} index={index} scene={scene}>
          <Content
            projectId={selectedProject}
            onSelect={scene.id === 'deep-dive' ? setSelectedProject : openCaseStudy}
            onOpen={() => openCaseStudy(selectedProject)}
          />
        </SceneSection>
      ))}
    </main>
  )
}
