import { profile } from '@/data/profile'
import { projects } from '@/data/projects'
import { Button, Divider } from '@/components/ui'

/**
 * Scene 07 — Contact and the ending.
 *
 * The lid closes, the camera withdraws, the room goes quiet. The only things left
 * on screen are the ways to reach out.
 */

const LINKS = [
  {
    label: 'Email',
    value: profile.contact.email,
    href: `mailto:${profile.contact.email}`,
  },
  {
    label: 'GitHub',
    value: profile.contact.githubHandle,
    href: profile.contact.github,
  },
  {
    label: 'LinkedIn',
    value: profile.contact.linkedinHandle,
    href: profile.contact.linkedin,
  },
  {
    label: 'Résumé',
    value: 'SangamCV.pdf',
    href: profile.resume.href,
    download: true,
  },
]

export default function Contact() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-full max-w-3xl space-y-7 text-center">
        <p className="eyebrow">06 — Contact</p>

        <h2
          id="contact-heading"
          className="text-display mx-auto max-w-2xl font-semibold text-ink text-balance"
        >
          {profile.closing.title}
        </h2>

        <p className="mx-auto max-w-lg text-sm leading-relaxed text-ink-soft">
          {profile.closing.subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" href={`mailto:${profile.contact.email}`}>
            {profile.closing.primaryCta}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            href={profile.contact.linkedin}
            aria-label={`${profile.name} on LinkedIn`}
          >
            {profile.closing.secondaryCta}
          </Button>
        </div>

        <Divider className="mx-auto max-w-md" />

        <dl className="mx-auto grid max-w-2xl grid-cols-2 gap-x-4 gap-y-5 text-left sm:grid-cols-4">
          {LINKS.map((link) => (
            <div key={link.label} className="space-y-1">
              <dt className="text-[0.625rem] tracking-[0.2em] text-ink-faint uppercase">
                {link.label}
              </dt>
              <dd>
                <a
                  href={link.href}
                  {...(link.download
                    ? { download: true }
                    : { target: '_blank', rel: 'noopener noreferrer' })}
                  className="text-[0.8125rem] text-ink-soft underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-accent/60"
                >
                  {link.value}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Footer — the last thing in the film */}
      <footer className="absolute inset-x-0 bottom-0 border-t border-line/70">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-4 text-[0.6875rem] text-ink-faint sm:px-8">
          <p>
            © {new Date().getFullYear()} {profile.name}. Built with React, Three.js and a lot of
            scroll events.
          </p>
          <p className="font-mono">
            {projects.length} projects · 7 scenes · {profile.location.full}
          </p>
        </div>
      </footer>
    </div>
  )
}
