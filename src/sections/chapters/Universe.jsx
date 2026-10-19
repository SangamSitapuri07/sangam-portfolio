import { chapterById } from '@/data/chapters'
import { projects } from '@/data/projects'
import ChapterHeading from './ChapterHeading'

/**
 * Scene 05 — Project Universe.
 *
 * Three panels, one per project on the CV, in the order the CV lists them. Each
 * panel is a real control: it selects the project and takes you to the deep dive,
 * where the full case study lives. No dead cards.
 */
export default function Universe({ onSelect, onOpen }) {
  const chapter = chapterById.universe
  return (
    <div className="w-full space-y-6">
      <ChapterHeading chapter={chapter} id="universe-heading" />

      <ul className="space-y-2.5">
        {projects.map((project) => (
          <li key={project.id}>
            <button
              type="button"
              onClick={() => onSelect?.(project.id)}
              className="group w-full rounded-xl border border-line/70 bg-surface/40 p-4 text-left backdrop-blur-sm transition-colors duration-300 hover:border-accent/60 hover:bg-surface-2/60 focus-visible:border-accent"
              aria-label={`${project.name}: open the case study`}
            >
              <span className="flex items-baseline gap-3">
                <span className="font-mono text-[0.6875rem]" style={{ color: project.screen.accent }}>
                  {project.index}
                </span>
                <span className="text-sm font-semibold text-ink">{project.name}</span>
                <span className="ml-auto font-mono text-[0.625rem] text-ink-faint">{project.year}</span>
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-ink-soft">{project.subtitle}</span>
              <span className="mt-2 flex flex-wrap gap-x-2 gap-y-1 font-mono text-[0.625rem] text-ink-faint">
                {project.tech.slice(0, 4).map((tech) => (
                  <span key={tech}>{tech}</span>
                ))}
              </span>
              <span
                aria-hidden="true"
                className="mt-2 block text-[0.6875rem] text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                Open case study →
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onOpen?.()}
          className="rounded-full border border-line bg-surface-2/40 px-4 py-2 text-xs text-ink transition-colors hover:border-accent/60 hover:text-white"
        >
          Read the flagship case study
        </button>
        <p className="font-mono text-[0.6875rem] tracking-wide text-ink-faint">{chapter.foot}</p>
      </div>
    </div>
  )
}
