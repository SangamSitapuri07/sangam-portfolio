import { chapterById } from '@/data/chapters'
import { profile } from '@/data/profile'
import ChapterHeading from './ChapterHeading'

/**
 * Scene 09 — The Final Transmission.
 *
 * Contact, with real destinations only: a mailto that opens a composer, the GitHub
 * profile, the LinkedIn profile, and the CV that is served from /public. Nothing
 * here is a placeholder link, and nothing claims an availability that is not true.
 */
const LINKS = [
  { id: 'email', label: 'Email', key: 'email' },
  { id: 'github', label: 'GitHub', key: 'github' },
  { id: 'linkedin', label: 'LinkedIn', key: 'linkedin' },
]

export default function Transmission() {
  const chapter = chapterById.transmission
  const { contact, resume } = profile
  const hrefs = {
    email: `mailto:${contact.email}`,
    github: contact.github,
    linkedin: contact.linkedin,
  }
  const handles = {
    email: contact.email,
    github: `@${contact.githubHandle}`,
    linkedin: contact.linkedinHandle,
  }

  return (
    <div className="w-full space-y-6">
      <ChapterHeading chapter={chapter} id="transmission-heading" />

      <ul className="max-w-md divide-y divide-line/70 border-y border-line/70">
        {LINKS.map((link) => (
          <li key={link.id}>
            <a
              href={hrefs[link.key]}
              {...(link.id === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              className="group flex items-baseline justify-between gap-4 py-3 transition-colors hover:text-white"
            >
              <span className="text-sm text-ink-soft transition-colors group-hover:text-ink">
                {link.label}
              </span>
              <span className="flex items-baseline gap-2 font-mono text-[0.6875rem] text-ink-faint transition-colors group-hover:text-accent">
                {handles[link.key]}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                  {link.id === 'email' ? '→' : '↗'}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={resume.href}
          download
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-[#04101f] transition-colors hover:bg-accent-bright"
        >
          {resume.label}
        </a>
        <span className="font-mono text-[0.625rem] text-ink-faint">{resume.meta}</span>
      </div>

      <p className="font-mono text-[0.6875rem] tracking-wide text-ink-faint">
        {profile.location.full} · {profile.status}
      </p>
      <p className="font-mono text-[0.6875rem] tracking-wide text-ink-faint">{chapter.foot}</p>
    </div>
  )
}
