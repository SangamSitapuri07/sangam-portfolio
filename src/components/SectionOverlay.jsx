import { useEffect, useMemo, useRef } from 'react'

import { scenes } from '@/config/scenes'
import { sceneRanges, overlayOpacityFor, overlayRiseFor } from '@/lib/timeline'
import { onProgress } from '@/lib/scrollEngine'
import Intro from '@/sections/Intro'
import Hero from '@/sections/Hero'
import About from '@/sections/About'
import Skills from '@/sections/Skills'
import Projects from '@/sections/Projects'
import Experience from '@/sections/Experience'
import Contact from '@/sections/Contact'

/**
 * SectionOverlay — the text layer of the film.
 *
 * The page is one tall column: seven sections, each exactly as tall as its scene's
 * share of the timeline (`config/scenes.js` heights), so DOM scrolling and 3D
 * progress are the same measurement. Inside each section a sticky viewport-height
 * panel holds the copy, which the scroll engine fades and lifts directly on the
 * DOM node — no React render per frame.
 *
 * All content stays in the document at all times, so search engines and screen
 * readers get the whole portfolio whether or not they scroll like a human.
 */

const SECTION_CONTENT = {
  intro: Intro,
  hero: Hero,
  about: About,
  skills: Skills,
  projects: Projects,
  experience: Experience,
  contact: Contact,
}

/**
 * Where the copy sits relative to the machine. On phones everything drops to the
 * bottom of the viewport — the camera frames the laptop higher there — so text can
 * never land on top of it.
 */
const ANCHOR_CLASSES = {
  left: 'items-end justify-center text-center md:items-start md:justify-start md:text-left',
  right: 'items-end justify-center text-center md:items-center md:justify-end md:text-left',
  center: 'items-center justify-center text-center',
  bottom: 'items-end justify-center text-center',
}

function SceneSection({ index, scene, anchor, sectionId }) {
  const panelRef = useRef(null)
  const range = sceneRanges[index]
  const Content = SECTION_CONTENT[scene.id]

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
      id={sectionId}
      aria-labelledby={`${scene.id}-heading`}
      data-scene={scene.id}
      className="relative"
      style={{ height: `${scene.height}vh` }}
    >
      <div
        className={`sticky top-0 mx-auto flex h-[100svh] w-full max-w-[1600px] flex-col px-5 pt-20 pb-28 sm:px-8 sm:pt-24 sm:pb-28 ${
          ANCHOR_CLASSES[anchor] || ANCHOR_CLASSES.center
        }`}
      >
        <div
          ref={panelRef}
          className="w-full will-change-[opacity,transform]"
          style={{ opacity: index === 0 ? 1 : 0 }}
        >
          <Content />
        </div>
      </div>
      {/* Kept for screen readers so the chapter is announced even before fading in */}
      <span className="sr-only">
        {scene.name}, {Math.round(range.span * 100)}% of the scroll
      </span>
    </section>
  )
}

export default function SectionOverlay() {
  const sections = useMemo(
    () =>
      scenes.map((scene, index) => ({
        scene,
        index,
        sectionId: scene.nav?.id || scene.id,
        anchor: index === 0 ? 'center' : scene.overlay?.anchor || 'center',
      })),
    []
  )

  return (
    <main id="main-content" className="overlay-layer">
      {sections.map(({ scene, index, anchor, sectionId }) => (
        <SceneSection
          key={scene.id}
          index={index}
          scene={scene}
          anchor={anchor}
          sectionId={sectionId}
        />
      ))}
    </main>
  )
}
