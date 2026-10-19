import { profile } from '@/data/profile'
import { chapterById } from '@/data/chapters'
import { Button, Chip, StatusDot } from '@/components/ui'
import { scrollToSection } from '@/lib/scrollEngine'

/**
 * Scene 01 — The Awakening.
 *
 * The first three seconds have to answer "who is this and what do they build".
 * The machine is shut, low and to the right; the copy owns the left column and
 * the rest of the frame is dark.
 */
export default function Awakening() {
  const chapter = chapterById.awakening
  return (
    <div className="w-full space-y-8">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[0.6875rem] tracking-[0.2em] text-accent">
            {chapter.number}
          </span>
          <span aria-hidden="true" className="h-px w-8 bg-line" />
          <p className="eyebrow !text-[0.625rem]">{chapter.kicker}</p>
        </div>

        <h1 id="awakening-heading" className="text-hero font-semibold text-ink">
          <span className="sr-only">{profile.name} — </span>
          {chapter.title}
        </h1>

        <p className="text-sm font-medium tracking-wide text-accent-bright">
          {profile.name} · {profile.role}
        </p>

        <p className="max-w-[46ch] text-base leading-relaxed text-ink-soft">{chapter.body}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button size="lg" onClick={() => scrollToSection('projects')}>
          Explore my work
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </Button>
        <Button size="lg" variant="ghost" onClick={() => scrollToSection('about')}>
          {chapter.secondaryCta.label}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip className="gap-2 border-line bg-surface-2/50">
          <StatusDot />
          {profile.status}
        </Chip>
        {profile.specialties.slice(0, 3).map((specialty) => (
          <Chip key={specialty} className="border-line/70">
            {specialty}
          </Chip>
        ))}
      </div>

      <p className="font-mono text-[0.6875rem] tracking-wide text-ink-faint">{chapter.foot}</p>
    </div>
  )
}
