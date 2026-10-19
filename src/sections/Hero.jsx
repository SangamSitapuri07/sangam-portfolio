import { profile } from '@/data/profile'
import { Button, Chip, StatusDot } from '@/components/ui'
import { scrollToSection } from '@/lib/scrollEngine'

/**
 * Scene 02 — Hero.
 *
 * Answers the two questions a recruiter has in the first three seconds: who is
 * this, and what do they build. The laptop occupies the right of the frame, so
 * the copy lives on the left.
 */
export default function Hero() {
  return (
    <div className="flex h-full w-full items-center">
      <div className="w-full max-w-xl space-y-7">
        <div className="space-y-5">
          <p className="eyebrow">{profile.role}</p>

          <h1 id="hero-heading" className="text-hero font-semibold text-ink">
            <span className="sr-only">{profile.name} — </span>
            <span aria-hidden="true" className="block">
              {profile.name.split(' ').map((word) => (
                <span key={word} className="block">
                  {word}
                </span>
              ))}
            </span>
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
            {profile.tagline}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Button size="lg" onClick={() => scrollToSection('projects')}>
            View projects
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

          <Button size="lg" variant="ghost" href={profile.resume.href} download>
            {profile.resume.label}
            <span className="text-ink-faint">{profile.resume.meta}</span>
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

        <p className="font-mono text-[0.6875rem] tracking-wide text-ink-faint">
          {profile.location.full} · {profile.education.institution}
        </p>
      </div>
    </div>
  )
}
