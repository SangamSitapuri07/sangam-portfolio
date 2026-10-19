/**
 * The shape every chapter's copy block shares: a scene number and label, a
 * headline, and one paragraph. Keeping it in one component is what makes ten
 * different scenes read as ten scenes of the same film.
 */
export default function ChapterHeading({ chapter, level = 2, id, children, className = '' }) {
  const Tag = `h${level}`
  return (
    <header className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[0.6875rem] tracking-[0.2em] text-accent">{chapter.number}</span>
        <span aria-hidden="true" className="h-px w-8 bg-line" />
        <span className="eyebrow !text-[0.625rem]">{chapter.label}</span>
      </div>
      {chapter.kicker ? (
        <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-ink-faint uppercase">
          {chapter.kicker}
        </p>
      ) : null}
      <Tag id={id} className={level === 1 ? 'text-hero font-semibold text-ink' : 'text-title font-semibold text-ink'}>
        {chapter.title}
      </Tag>
      {chapter.body ? (
        <p className="max-w-[46ch] text-base leading-relaxed text-ink-soft">{chapter.body}</p>
      ) : null}
      {children}
    </header>
  )
}
