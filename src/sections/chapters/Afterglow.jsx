import { useEffect, useState } from 'react'

import { chapterById } from '@/data/chapters'
import { profile } from '@/data/profile'
import { scrollToProgress } from '@/lib/scrollEngine'

/**
 * Scene 10 — The Afterglow.
 *
 * The footer, and the only place the film admits it is a page: a year that is
 * computed rather than typed, a way back to the top, and a line about what the
 * machine on screen actually is.
 */
export default function Afterglow() {
  const chapter = chapterById.afterglow
  const [year, setYear] = useState(() => new Date().getFullYear())

  /* Midnight on New Year's Eve is an edge case, but it is a one-line one. */
  useEffect(() => {
    const timer = window.setInterval(() => setYear(new Date().getFullYear()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="w-full space-y-5 text-center">
      <div className="flex items-center justify-center gap-3">
        <span aria-hidden="true" className="h-px w-10 bg-line" />
        <span className="font-mono text-[0.6875rem] tracking-[0.2em] text-accent">{chapter.number}</span>
        <span aria-hidden="true" className="h-px w-10 bg-line" />
      </div>

      <h2 id="afterglow-heading" className="text-title font-semibold text-ink">
        {chapter.title}
      </h2>
      <p className="mx-auto max-w-[46ch] text-sm leading-relaxed text-ink-soft">{chapter.body}</p>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => scrollToProgress(0)}
          className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface-2/40 px-4 py-2 text-xs text-ink transition-colors hover:border-accent/60 hover:text-white"
        >
          <span aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5">
            ↑
          </span>
          Back to the top
        </button>
        <a
          href={profile.contact.github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ink-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          github.com/{profile.contact.githubHandle}
        </a>
      </div>

      <p className="mx-auto max-w-[52ch] pt-2 text-[0.625rem] leading-relaxed text-ink-faint">
        The machine is a 3D scan, not a mock-up of a data sheet; the exploded view separates the
        model&apos;s own meshes and does not claim to show a motherboard, a fan or a battery.
      </p>

      <p className="font-mono text-[0.625rem] tracking-wide text-ink-faint">
        © {year} {profile.name} · {chapter.foot}
      </p>
    </div>
  )
}
