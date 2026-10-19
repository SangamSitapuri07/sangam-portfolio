import { chapterById } from '@/data/chapters'
import { profile } from '@/data/profile'
import { timeline } from '@/data/timeline'
import ChapterHeading from './ChapterHeading'

/**
 * Scene 08 — Beyond the Code.
 *
 * The person behind the machine: where the education comes from, what has been
 * certified, and how the work gets done. Certifications are listed exactly as the
 * CV lists them — nothing is promoted into an achievement it is not.
 */
export default function Beyond() {
  const chapter = chapterById.beyond
  const { education } = profile
  return (
    <div className="w-full space-y-5">
      <ChapterHeading chapter={chapter} id="beyond-heading" />

      <div className="rounded-xl border border-line/70 bg-surface/40 p-4 backdrop-blur-sm">
        <p className="font-mono text-[0.625rem] tracking-[0.14em] text-ink-faint uppercase">Education</p>
        <p className="mt-1 text-sm font-semibold text-ink">{education.institution}</p>
        <p className="text-xs text-ink-soft">{education.degree}</p>
        <p className="mt-1 font-mono text-[0.6875rem] text-ink-faint">
          {education.years} · {education.place} · CGPA {education.cgpa}
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[0.625rem] tracking-[0.14em] text-ink-faint uppercase">
          Certifications & training
        </p>
        <ul className="space-y-1.5">
          {timeline
            .filter((entry) => entry.kind !== 'education')
            .slice(0, 4)
            .map((entry) => (
              <li key={entry.id} className="flex items-baseline gap-3 text-xs">
                <span className="w-8 shrink-0 font-mono text-[0.625rem] text-ink-faint tabular-nums">
                  {entry.period}
                </span>
                <span className="text-ink-soft">
                  {entry.title}
                  <span className="text-ink-faint"> · {entry.organisation}</span>
                </span>
              </li>
            ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-line/70 pt-4">
        {profile.specialties.map((specialty) => (
          <span key={specialty} className="font-mono text-[0.625rem] text-ink-faint">
            {specialty}
          </span>
        ))}
      </div>

      <p className="font-mono text-[0.6875rem] tracking-wide text-ink-faint">{chapter.foot}</p>
    </div>
  )
}
