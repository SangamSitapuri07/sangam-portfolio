import { profile } from '@/data/profile'

/**
 * Scene 01 — Intro.
 *
 * Almost nothing on screen: the dark room, a closed machine, the name. The fixed
 * "scroll to explore" cue sits underneath (see `ScrollHint`), so this section
 * deliberately says nothing else.
 */
export default function Intro() {
  return (
    <div className="flex h-full w-full items-end justify-center pb-28 sm:items-center sm:pb-0">
      <div className="space-y-4 text-center">
        <p className="eyebrow">{profile.name}</p>
        <h2
          id="intro-heading"
          className="mx-auto max-w-3xl text-2xl leading-tight font-semibold text-ink/90 sm:text-3xl"
        >
          A developer&rsquo;s work, presented as a film.
        </h2>
        <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-ink-faint uppercase">
          Seven scenes · one scroll
        </p>
      </div>
    </div>
  )
}
