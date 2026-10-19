import { chapterById } from '@/data/chapters'
import { projects } from '@/data/projects'
import ChapterHeading from './ChapterHeading'

/**
 * Scene 06 — The Deep Dive.
 *
 * The case study, in the order a reviewer actually reads one: problem, approach,
 * implementation, what was hard, what came out of it, and where to look at it.
 * Every line comes from the project's own data — nothing here is invented for the
 * page, and the tabs switch between all three projects rather than only the
 * flagship.
 */

function ExternalLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2/40 px-3.5 py-1.5 text-xs text-ink transition-colors hover:border-accent/60 hover:text-white"
    >
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  )
}

const SECTIONS = [
  { id: 'problem', label: 'Problem' },
  { id: 'approach', label: 'Approach' },
  { id: 'implementation', label: 'Implementation' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'outcome', label: 'Outcome' },
]

export default function DeepDive({ projectId, onSelect }) {
  const chapter = chapterById['deep-dive']
  const project = projects.find((entry) => entry.id === projectId) || projects[1]

  return (
    <div className="w-full space-y-5">
      <ChapterHeading chapter={chapter} id="deep-dive-heading" />

      <div
        role="tablist"
        aria-label="Choose a project"
        className="flex flex-wrap gap-1.5 border-b border-line/70 pb-3"
      >
        {projects.map((entry) => {
          const active = entry.id === project.id
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect?.(entry.id)}
              className={`rounded-full px-3 py-1.5 text-[0.6875rem] transition-colors ${
                active
                  ? 'bg-accent text-[#04101f]'
                  : 'border border-line/70 text-ink-soft hover:border-accent/50 hover:text-ink'
              }`}
            >
              {entry.name}
            </button>
          )
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-ink">{SECTIONS[0].label}</h3>
          <p className="text-xs leading-relaxed text-ink-soft">{project.tagline}</p>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-ink">{SECTIONS[1].label}</h3>
          <p className="text-xs leading-relaxed text-ink-soft">{project.summary}</p>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-ink">{SECTIONS[2].label}</h3>
          <ul className="space-y-1 text-xs leading-relaxed text-ink-soft">
            {project.highlights.slice(0, 3).map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-ink">{SECTIONS[3].label}</h3>
          <ul className="space-y-1 text-xs leading-relaxed text-ink-soft">
            {project.constraints.map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-2 border-t border-line/70 pt-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3 className="text-sm font-semibold text-ink">{SECTIONS[4].label}</h3>
          <p className="font-mono text-[0.625rem] text-ink-faint">
            {project.role} · {project.year}
          </p>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          {project.stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-lg font-semibold text-ink tabular-nums">{stat.value}</dd>
              <dd className="text-[0.625rem] text-ink-faint">{stat.label}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs leading-relaxed text-ink-soft">{project.outcome}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ExternalLink href={project.links.github}>Source</ExternalLink>
        <ExternalLink href={project.links.live}>Live demo / walkthrough</ExternalLink>
        <p className="font-mono text-[0.6875rem] tracking-wide text-ink-faint">{chapter.foot}</p>
      </div>
    </div>
  )
}
