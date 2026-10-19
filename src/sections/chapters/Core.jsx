import { chapterById } from '@/data/chapters'
import { coreGroups } from '@/data/skills'
import ChapterHeading from './ChapterHeading'

/**
 * Scene 04 — The Engineering Core.
 *
 * Three layers, in the order a request travels through them: the language, the
 * interface, and the thinking between. The camera is inside the opened chassis
 * here, so the copy stays narrow and the cards stack.
 */
export default function Core() {
  const chapter = chapterById.core
  return (
    <div className="w-full space-y-6">
      <ChapterHeading chapter={chapter} id="core-heading" />

      <ul className="space-y-3">
        {coreGroups.map((group) => (
          <li
            key={group.id}
            className="rounded-xl border border-line/70 bg-surface/50 p-4 backdrop-blur-sm"
            style={{ borderLeftColor: group.accent, borderLeftWidth: 2 }}
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[0.6875rem]" style={{ color: group.accent }}>
                {group.number}
              </span>
              <h3 className="text-sm font-semibold text-ink">{group.title}</h3>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{group.note}</p>
            <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 font-mono text-[0.6875rem] text-ink-faint">
              {group.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </p>
          </li>
        ))}
      </ul>

      <p className="font-mono text-[0.6875rem] tracking-wide text-ink-faint">{chapter.foot}</p>
    </div>
  )
}
