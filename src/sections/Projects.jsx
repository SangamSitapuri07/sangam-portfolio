import { useMemo } from 'react'

import { projects } from '@/data/projects'
import { Card, SectionHeading } from '@/components/ui'

/**
 * Scene 05 — Projects. The centrepiece.
 *
 * All five cards are stacked in the same place and cross-faded by the scroll
 * timeline (see `SectionOverlay`), which means switching projects costs no React
 * render at all — the change is a single opacity write per card per frame.
 *
 * Every card stays in the DOM: a screen reader reads the whole portfolio in order
 * while a sighted visitor sees one project at a time.
 */

/** Generated cover art — no image files, so nothing can 404. */
function Cover({ project }) {
  const { from, via, to, mark } = project.cover
  return (
    <div
      aria-hidden="true"
      className="relative hidden h-28 w-full overflow-hidden rounded-xl border border-line/70 sm:block sm:h-32"
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${via} 55%, ${to} 100%)` }}
    >
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div
        className="absolute -right-6 -bottom-8 h-32 w-32 rounded-full blur-2xl"
        style={{ background: project.screen.accent, opacity: 0.28 }}
      />
      <div className="absolute inset-0 flex items-center justify-between p-5">
        <span className="font-mono text-[0.6875rem] tracking-[0.24em] text-white/70">
          {project.index}
        </span>
        <span className="text-lg font-semibold tracking-[0.18em] text-white/85">{mark}</span>
      </div>
    </div>
  )
}

function ProjectCard({ project, index }) {
  return (
    <article
      aria-labelledby={`project-${project.id}-title`}
      data-project-card={index}
      className="absolute inset-x-0 top-1/2 w-full -translate-y-1/2 will-change-transform"
    >
      <Card className="p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[0.6875rem] tracking-[0.2em] text-accent">
                {project.index}
              </span>
              <span className="h-px flex-1 bg-line" />
              <span className="font-mono text-[0.6875rem] text-ink-faint">{project.year}</span>
            </div>

            <div className="space-y-1.5">
              <h3 id={`project-${project.id}-title`} className="text-lg font-semibold text-ink">
                {project.name}
              </h3>
              <p className="text-xs text-ink-faint">{project.subtitle}</p>
            </div>

            <p className="max-w-prose text-sm leading-relaxed text-ink-soft">{project.summary}</p>

            <ul className="space-y-1.5">
              {project.highlights.slice(0, 3).map((highlight) => (
                <li key={highlight} className="flex items-baseline gap-2 text-xs text-ink-soft">
                  <span
                    aria-hidden="true"
                    className="mt-1 h-1 w-1 shrink-0 rounded-full"
                    style={{ background: project.screen.accent }}
                  />
                  {highlight}
                </li>
              ))}
            </ul>

            <ul className="flex flex-wrap gap-1.5 pt-1">
              {project.tech.map((tech) => (
                <li
                  key={tech}
                  className="rounded-md border border-line bg-surface-2/50 px-2 py-1 font-mono text-[0.6875rem] text-ink-soft"
                >
                  {tech}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <a
                href={project.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink transition-colors hover:text-accent-bright"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.8.06 1.23.82 1.23.82.71 1.22 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                </svg>
                Source
              </a>

              {project.links.live ? (
                <a
                  href={project.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-bright"
                >
                  <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                    <span className="absolute inset-0 rounded-full bg-accent" />
                    <span className="absolute -inset-1 animate-ping rounded-full bg-accent/30" />
                  </span>
                  Live
                </a>
              ) : null}

              {project.links.extra ? (
                <a
                  href={project.links.extra.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.8125rem] text-ink-faint transition-colors hover:text-ink-soft"
                >
                  {project.links.extra.label} ↗
                </a>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Cover project={project} />
            <dl className="grid grid-cols-3 gap-2 sm:hidden lg:grid lg:grid-cols-1 lg:gap-1.5">
              {project.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-line/70 bg-surface-2/40 px-2.5 py-2"
                >
                  <dt className="text-[0.625rem] tracking-wide text-ink-faint uppercase">
                    {stat.label}
                  </dt>
                  <dd className="font-mono text-sm text-ink">{stat.value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-[0.6875rem] text-ink-faint">Role — {project.role}</p>
          </div>
        </div>
      </Card>
    </article>
  )
}

export default function Projects() {
  const cards = useMemo(() => projects, [])

  return (
    <div className="flex h-full w-full flex-col justify-center gap-5">
      <SectionHeading
        eyebrow="04 — Projects"
        title="Things I have shipped"
        id="projects-heading"
        className="max-w-lg"
      />

      {/* Fixed-height stage: all cards are absolutely positioned inside it */}
      <div className="relative min-h-[24rem] sm:min-h-[23rem] lg:min-h-[21rem]">
        {cards.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </div>

    </div>
  )
}
