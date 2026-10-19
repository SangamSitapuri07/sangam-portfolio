import { chapterById } from '@/data/chapters'
import { profile } from '@/data/profile'
import { Chip } from '@/components/ui'
import ChapterHeading from './ChapterHeading'

/**
 * Scene 02 — Into the Machine.
 *
 * The lid finishes opening and the camera settles on the display. The copy lists
 * what is actually on the CV under SKILLS — no stack padding.
 */
export default function Machine() {
  const chapter = chapterById.engine
  return (
    <div className="w-full space-y-7">
      <ChapterHeading chapter={chapter} id="engine-heading" />

      <ul className="flex flex-wrap gap-2" aria-label="Tools and languages">
        {chapter.tags.map((tag) => (
          <li key={tag}>
            <Chip className="border-line/70 bg-surface-2/40 font-mono">{tag}</Chip>
          </li>
        ))}
      </ul>

      <dl className="grid max-w-md grid-cols-2 gap-x-6 gap-y-3 border-t border-line/70 pt-5 text-sm">
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-ink-faint uppercase">Based in</dt>
          <dd className="mt-0.5 text-ink-soft">{profile.location.full}</dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-ink-faint uppercase">Studying</dt>
          <dd className="mt-0.5 text-ink-soft">
            {profile.education.degree}, {profile.education.years}
          </dd>
        </div>
      </dl>

      <p className="font-mono text-[0.6875rem] tracking-wide text-ink-faint">{chapter.foot}</p>
    </div>
  )
}
