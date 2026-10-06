import { profile } from '@/data/profile'
import { Card, SectionHeading, Stat } from '@/components/ui'

/**
 * Scene 03 — About.
 *
 * The camera has pushed in until the laptop display is the subject, so the copy
 * sits to the right of it: short statements, never paragraphs.
 */
export default function About() {
  return (
    <div className="flex h-full w-full items-center justify-end">
      <div className="w-full max-w-md space-y-6">
        <SectionHeading eyebrow="02 — About" title={profile.about.headline} id="about-heading" />

        <p className="text-sm leading-relaxed text-ink-soft">{profile.about.intro}</p>

        <ul className="grid gap-2.5">
          {profile.about.facts.map((fact) => (
            <li key={fact.title}>
              <Card className="flex items-start gap-3 p-3.5">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-3.5 w-[3px] shrink-0 rounded-full bg-accent"
                />
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-medium text-ink">{fact.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{fact.detail}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-line pt-5 sm:grid-cols-4">
          {profile.facts.map((fact) => (
            <Stat key={fact.label} value={fact.value} label={fact.label} />
          ))}
        </div>

        <ul className="space-y-1.5">
          {profile.about.footer.map((line) => (
            <li key={line} className="flex items-baseline gap-2 text-xs text-ink-faint">
              <span aria-hidden="true" className="text-accent/60">
                —
              </span>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
