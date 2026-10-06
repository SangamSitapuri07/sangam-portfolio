import { useCallback, useEffect, useRef, useState } from 'react'

import { profile } from '@/data/profile'
import { navSections } from '@/config/scenes'
import { scrollToSection, scrollToProgress } from '@/lib/scrollEngine'

/**
 * Navbar — fixed, minimal, and honest about where you are.
 *
 * Left: the initials. Right: the six chapters plus the résumé. The active state
 * comes from the scroll engine (one React update per scene change — six in a full
 * pass), never per frame.
 *
 * On small screens the links collapse into a sheet that traps focus, closes on
 * Escape, and restores focus to the trigger.
 */
export default function Navbar({ activeSceneId, ready, onSceneChange, staticMode = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const sheetRef = useRef(null)
  const triggerRef = useRef(null)

  /* In film mode the scroll engine owns every jump, so the default anchor
     behaviour is suppressed and the engine tweens to the chapter. In static mode
     there is no engine (and no timeline), so the plain `href="#id"` jump is left
     alone — the links stay live either way. */
  const handleNav = useCallback(
    (event, id) => {
      setMenuOpen(false)
      if (staticMode) {
        onSceneChange?.(id)
        return
      }
      event.preventDefault()
      scrollToSection(id)
      onSceneChange?.(id)
    },
    [onSceneChange, staticMode]
  )

  const goHome = useCallback(
    (event) => {
      setMenuOpen(false)
      if (staticMode) return
      event.preventDefault()
      scrollToProgress(0)
    },
    [staticMode]
  )

  /* Escape closes the sheet; focus returns to the trigger it came from. */
  useEffect(() => {
    if (!menuOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    const firstLink = sheetRef.current?.querySelector('a, button')
    firstLink?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-opacity duration-700 ${
        ready || staticMode ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5">
        {/* Identity */}
        <a
          href="#top"
          onClick={goHome}
          className="group flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1"
          aria-label={`${profile.name} — back to the top`}
        >
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface-2/70 text-[0.8125rem] font-semibold tracking-wide text-ink backdrop-blur-md transition-colors group-hover:border-accent/60"
          >
            {profile.initials}
          </span>
          <span className="hidden text-sm font-medium text-ink-soft transition-colors group-hover:text-ink sm:inline">
            {profile.name}
          </span>
        </a>

        {/* Desktop navigation */}
        <nav aria-label="Sections" className="hidden md:block">
          <ul className="flex items-center gap-1 rounded-full border border-line/80 bg-surface/60 px-1.5 py-1.5 backdrop-blur-md">
            {navSections.map((section) => {
              const isActive = section.id === activeSceneId
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={(event) => handleNav(event, section.id)}
                    className={`relative rounded-full px-3.5 py-1.5 text-[0.8125rem] transition-colors duration-300 ${
                      isActive ? 'text-ink' : 'text-ink-faint hover:text-ink-soft'
                    }`}
                  >
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full border border-accent/35 bg-accent/10"
                      />
                    ) : null}
                    <span className="relative">{section.label}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={profile.resume.href}
            download
            className="hidden rounded-full border border-line bg-surface-2/50 px-4 py-2 text-[0.8125rem] font-medium text-ink-soft backdrop-blur-md transition-colors hover:border-accent/60 hover:text-ink sm:inline-flex"
          >
            Résumé
          </a>

          {/* Mobile menu trigger */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface-2/70 text-ink backdrop-blur-md md:hidden"
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <span aria-hidden="true" className="relative block h-3 w-4">
              <span
                className={`absolute inset-x-0 top-0 h-px bg-current transition-transform duration-300 ${
                  menuOpen ? 'translate-y-1.5 rotate-45' : ''
                }`}
              />
              <span
                className={`absolute inset-x-0 top-1.5 h-px bg-current transition-opacity duration-200 ${
                  menuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute inset-x-0 top-3 h-px bg-current transition-transform duration-300 ${
                  menuOpen ? '-translate-y-1.5 -rotate-45' : ''
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <div
        id="mobile-nav"
        ref={sheetRef}
        hidden={!menuOpen}
        className="mx-4 mt-1 rounded-2xl border border-line bg-surface/95 p-2 backdrop-blur-xl md:hidden"
      >
        <nav aria-label="Sections">
          <ul className="flex flex-col">
            {navSections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={(event) => handleNav(event, section.id)}
                  aria-current={section.id === activeSceneId ? 'true' : undefined}
                  className={`block rounded-xl px-4 py-3 text-sm transition-colors ${
                    section.id === activeSceneId
                      ? 'bg-accent/10 text-ink'
                      : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  {section.label}
                </a>
              </li>
            ))}
            <li className="mt-1 border-t border-line pt-1">
              <a
                href={profile.resume.href}
                download
                className="block rounded-xl px-4 py-3 text-sm text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Download résumé
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
