import { skillCategories } from '@/data/skills'
import { Card, SectionHeading } from '@/components/ui'

/**
 * Scene 04 — Skills.
 *
 * The camera has pulled back to show the whole machine, so the four categories
 * can use the width of the screen. Cards stay minimal: a title, one honest line,
 * the primary tools, and a few secondary ones kept quiet.
 */
export default function Skills() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="03 — Skills"
          title="What I build with"
          id="skills-heading"
          className="max-w-lg"
        />
        <p className="max-w-xs font-mono text-[0.6875rem] leading-relaxed text-ink-faint">
          Languages, frameworks and tools I use to take an idea from a blank file to something
          people can actually open.
        </p>
      </div>

      <ul className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {skillCategories.map((category) => (
          <li key={category.id} className="h-full">
            <Card accent={category.accent} className="flex h-full flex-col gap-4 p-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: category.accent }}
                  />
                  <h3 className="text-[0.9375rem] font-semibold text-ink">{category.title}</h3>
                </div>
                <p className="text-xs leading-relaxed text-ink-soft">{category.note}</p>
              </div>

              <ul className="flex flex-wrap gap-1.5">
                {category.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border px-2 py-1 text-[0.6875rem] font-medium"
                    style={{
                      borderColor: `${category.accent}2e`,
                      background: `${category.accent}0f`,
                      color: category.accent,
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <ul className="mt-auto space-y-1 border-t border-line pt-3">
                {category.also.map((item) => (
                  <li key={item} className="text-[0.6875rem] leading-relaxed text-ink-faint">
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
