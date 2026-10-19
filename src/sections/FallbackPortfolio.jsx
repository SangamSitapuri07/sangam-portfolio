import { profile } from '@/data/profile'
import { projects } from '@/data/projects'
import { demos } from '@/config/demos'
import { requestDemo } from '@/lib/uiBus'
import { skillCategories } from '@/data/skills'
import { timeline, achievements } from '@/data/timeline'
import { Button, Card, Chip, SectionHeading } from '@/components/ui'

/**
 * FallbackPortfolio — the whole portfolio as plain HTML.
 *
 * Rendered when WebGL is unavailable, when the scene throws, or when a visitor
 * asks for the simple version. It is not a stub: every project, skill, certificate
 * and link is here, styled with the same design system, just without the camera.
 */
export default function FallbackPortfolio() {
  return (
    <main id="main-content" className="relative z-10 mx-auto max-w-5xl px-5 pt-28 pb-24 sm:px-8">
      <header id="home" className="space-y-5 scroll-mt-24">
        <p className="eyebrow">{profile.role}</p>
        <h1 className="text-display font-semibold text-ink">{profile.name}</h1>
        <p className="max-w-2xl text-base leading-relaxed text-ink-soft">{profile.tagline}</p>
        <div className="flex flex-wrap gap-3">
          <Button href={`mailto:${profile.contact.email}`}>Email me</Button>
          <Button variant="ghost" href={profile.resume.href} download>
            {profile.resume.label}
          </Button>
          <Button variant="ghost" href={profile.contact.github}>
            GitHub
          </Button>
        </div>
        <p className="font-mono text-[0.6875rem] text-ink-faint">
          {profile.location.full} · {profile.education.institution} · CGPA{' '}
          {profile.education.cgpa}
        </p>
      </header>

      <section id="about" className="mt-16 scroll-mt-24 space-y-6" aria-labelledby="static-about">
        <SectionHeading id="static-about" eyebrow="About" title={profile.about.headline} />
        <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">{profile.about.intro}</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {profile.about.facts.map((fact) => (
            <li key={fact.title}>
              <Card className="p-4">
                <h3 className="text-sm font-medium text-ink">{fact.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">{fact.detail}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section id="skills" className="mt-16 scroll-mt-24 space-y-6" aria-labelledby="static-skills">
        <SectionHeading id="static-skills" eyebrow="Skills" title="What I build with" />
        <div className="grid gap-4 sm:grid-cols-2">
          {skillCategories.map((category) => (
            <Card key={category.id} accent={category.accent} className="p-5">
              <h3 className="text-sm font-semibold text-ink">{category.title}</h3>
              <p className="mt-1 text-xs text-ink-soft">{category.note}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {category.items.map((item) => (
                  <li key={item}>
                    <Chip accent={category.accent}>{item}</Chip>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section id="projects" className="mt-16 scroll-mt-24 space-y-6" aria-labelledby="static-projects">
        <SectionHeading id="static-projects" eyebrow="Projects" title="Things I have shipped" />
        <ul className="space-y-4">
          {projects.map((project) => (
            <li key={project.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold text-ink">{project.name}</h3>
                  <span className="font-mono text-[0.6875rem] text-ink-faint">{project.year}</span>
                </div>
                <p className="mt-1 text-xs text-ink-faint">{project.subtitle}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{project.summary}</p>
                <ul className="mt-3 space-y-1">
                  {project.highlights.map((highlight) => (
                    <li key={highlight} className="text-xs text-ink-soft">
                      — {highlight}
                    </li>
                  ))}
                </ul>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {project.tech.map((tech) => (
                    <li key={tech}>
                      <Chip className="border-line">{tech}</Chip>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                  {demos[project.id] ? (
                    <button
                      type="button"
                      onClick={() => requestDemo(project.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1.5 font-medium text-accent-bright transition-colors hover:border-accent/70 hover:bg-accent/20"
                    >
                      <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 fill-current">
                        <path d="M3 1.5v9l7.5-4.5z" />
                      </svg>
                      Run demo
                    </button>
                  ) : null}

                  <a
                    href={project.links.github}
                    className="text-accent hover:text-accent-bright"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Source ↗
                  </a>
                  {project.links.live ? (
                    <a
                      href={project.links.live}
                      className="text-accent hover:text-accent-bright"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Live ↗
                    </a>
                  ) : null}
                  {project.links.extra ? (
                    <a
                      href={project.links.extra.href}
                      className="text-ink-soft hover:text-ink"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {project.links.extra.label} ↗
                    </a>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>

      </section>

      <section
        id="experience"
        className="mt-16 scroll-mt-24 space-y-6"
        aria-labelledby="static-experience"
      >
        <SectionHeading id="static-experience" eyebrow="Experience" title="Certifications & the road here" />
        <ol className="space-y-4 border-l border-line pl-5">
          {timeline.map((item) => (
            <li key={item.id}>
              <span className="font-mono text-[0.6875rem] text-ink-faint">{item.period}</span>
              <h3 className="text-sm font-medium text-ink">{item.title}</h3>
              <p className="text-xs text-ink-faint">{item.organisation}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{item.detail}</p>
            </li>
          ))}
        </ol>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {achievements.map((item) => (
            <div key={item.label}>
              <div className="text-lg font-semibold text-ink">{item.value}</div>
              <div className="text-xs text-ink-faint">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <footer id="contact" className="mt-16 scroll-mt-24 border-t border-line pt-8">
        <SectionHeading id="static-contact" eyebrow="Contact" title={profile.closing.title} />
        <p className="mt-2 max-w-xl text-sm text-ink-soft">{profile.closing.subtitle}</p>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <li>
            <a href={`mailto:${profile.contact.email}`} className="text-accent hover:text-accent-bright">
              {profile.contact.email}
            </a>
          </li>
          <li>
            <a
              href={profile.contact.github}
              className="text-ink-soft hover:text-ink"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </li>
          <li>
            <a
              href={profile.contact.linkedin}
              className="text-ink-soft hover:text-ink"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </li>
          <li>
            <a href={profile.resume.href} download className="text-ink-soft hover:text-ink">
              Résumé (PDF)
            </a>
          </li>
        </ul>
        <p className="mt-8 text-[0.6875rem] text-ink-faint">
          This is the lightweight version of the portfolio — the 3D version needs WebGL. Everything
          is here either way.
        </p>
      </footer>
    </main>
  )
}
