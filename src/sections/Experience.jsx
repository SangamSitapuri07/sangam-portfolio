import { timeline, achievements } from '@/data/timeline'
import { Card, SectionHeading, Stat } from '@/components/ui'

/**
 * Scene 06 — Experience & certifications.
 *
 * The camera lifts to a higher angle, so the copy takes the right of the frame.
 * A single vertical rail keeps certifications, training, hackathons and education
 * in one readable column; achievements sit underneath as quiet proof.
 */

const KIND_LABEL = {
  hackathon: 'Hackathon',
  certification: 'Certification',
  training: 'Training',
  education: 'Education',
}

const KIND_ACCENT = {
  hackathon: '#FFB25E',
  certification: '#4B8CFF',
  training: '#54E0A0',
  education: '#7C5CFF',
}

export default function Experience() {
  return (
    <div className="flex h-full w-full items-center justify-end">
      <div className="w-full max-w-xl space-y-6">
        <SectionHeading
          eyebrow="05 — Experience"
          title="Certifications & the road here"
          id="experience-heading"
        />

        <ol className="relative space-y-4 border-l border-line pl-5">
          {timeline.slice(0, 6).map((item) => {
            const accent = KIND_ACCENT[item.kind] || '#4B8CFF'
            return (
              <li key={item.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute top-2 -left-[1.6875rem] h-2 w-2 rounded-full ring-4 ring-void"
                  style={{ background: accent }}
                />
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-[0.6875rem] text-ink-faint">{item.period}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[0.625rem] font-medium"
                    style={{ background: `${accent}18`, color: accent }}
                  >
                    {KIND_LABEL[item.kind] || 'Milestone'}
                  </span>
                </div>
                <h3 className="mt-1 text-[0.9375rem] font-medium text-ink">{item.title}</h3>
                <p className="text-xs text-ink-faint">{item.organisation}</p>
                <p className="mt-1 max-w-prose text-xs leading-relaxed text-ink-soft">
                  {item.detail}
                </p>
                {item.link ? (
                  <a
                    href={item.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-accent transition-colors hover:text-accent-bright"
                  >
                    {item.link.label} ↗
                  </a>
                ) : null}
              </li>
            )
          })}
        </ol>

        <Card className="p-4">
          <p className="eyebrow mb-3">Achievements</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
            {achievements.map((item) => (
              <div key={item.label}>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block transition-colors hover:text-accent-bright"
                  >
                    <Stat value={item.value} label={item.label} detail={item.detail} />
                  </a>
                ) : (
                  <Stat value={item.value} label={item.label} detail={item.detail} />
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
