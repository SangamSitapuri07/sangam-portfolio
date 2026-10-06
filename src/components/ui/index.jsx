/**
 * UI primitives.
 *
 * A deliberately small kit — one button treatment, one card surface, one chip,
 * one heading pattern — so the whole site reads as a single system. Everything
 * here is presentation only; content comes from `src/data`.
 */

/* ------------------------------------------------------------------ *
 * Button
 * ------------------------------------------------------------------ */

const buttonBase =
  'group relative inline-flex items-center justify-center gap-2 rounded-full font-medium ' +
  'transition-[transform,background-color,border-color,color,box-shadow] duration-300 ' +
  'ease-[var(--ease-out-expo)] will-change-transform disabled:opacity-50 disabled:pointer-events-none'

const buttonSizes = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-[0.9375rem]',
}

const buttonVariants = {
  primary:
    'bg-accent text-[#04101f] hover:bg-accent-bright shadow-[0_10px_30px_-12px_rgba(75,140,255,0.65)] ' +
    'hover:shadow-[0_14px_38px_-12px_rgba(75,140,255,0.8)] hover:-translate-y-0.5',
  ghost:
    'border border-line bg-surface-2/40 text-ink hover:border-accent/60 hover:text-white ' +
    'hover:bg-surface-2/70 hover:-translate-y-0.5 backdrop-blur-sm',
  quiet: 'text-ink-soft hover:text-ink px-1',
}

/**
 * A real <button> or <a>: pass `href` to render a link (external links get the
 * right rel/target automatically).
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  external,
  className = '',
  ...rest
}) {
  const classes = `${buttonBase} ${buttonSizes[size]} ${buttonVariants[variant]} ${className}`

  if (href) {
    const isExternal = external ?? /^https?:|^mailto:/.test(href)
    return (
      <a
        href={href}
        className={classes}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * Card
 * ------------------------------------------------------------------ */

export function Card({ children, className = '', as: Tag = 'div', accent, ...rest }) {
  return (
    <Tag
      className={`glass relative overflow-hidden rounded-2xl ${className}`}
      style={accent ? { borderColor: `${accent}33` } : undefined}
      {...rest}
    >
      {accent ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
      ) : null}
      {children}
    </Tag>
  )
}

/* ------------------------------------------------------------------ *
 * Section heading
 * ------------------------------------------------------------------ */

export function SectionHeading({ eyebrow, title, id, description, className = '' }) {
  return (
    <header className={`space-y-3 ${className}`}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 id={id} className="text-title font-semibold text-ink">
        {title}
      </h2>
      {description ? (
        <p className="max-w-prose text-sm leading-relaxed text-ink-soft">{description}</p>
      ) : null}
    </header>
  )
}

/* ------------------------------------------------------------------ *
 * Chip
 * ------------------------------------------------------------------ */

export function Chip({ children, accent, className = '', solid = false }) {
  return (
    <span
      className={
        'inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] font-medium ' +
        'tracking-wide whitespace-nowrap ' +
        (solid ? '' : 'border text-ink-soft ') +
        className
      }
      style={
        accent
          ? solid
            ? { background: accent, color: '#05060a' }
            : { borderColor: `${accent}44`, background: `${accent}12`, color: accent }
          : undefined
      }
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * Small pieces
 * ------------------------------------------------------------------ */

export function StatusDot({ active = true, accent = 'var(--color-positive, #54e0a0)' }) {
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0" aria-hidden="true">
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: accent, opacity: active ? 1 : 0.4 }}
      />
      {active ? (
        <span
          className="absolute -inset-1 animate-ping rounded-full"
          style={{ background: accent, opacity: 0.25 }}
        />
      ) : null}
    </span>
  )
}

export function Stat({ value, label, detail }) {
  return (
    <div className="min-w-0">
      <div className="text-xl font-semibold tracking-tight text-ink tabular-nums sm:text-2xl">
        {value}
      </div>
      <div className="mt-0.5 text-xs text-ink-faint">{label}</div>
      {/* Full-strength faint ink: at 70% alpha this line measured 2.4:1. */}
      {detail ? <div className="mt-0.5 text-[0.6875rem] text-ink-faint">{detail}</div> : null}
    </div>
  )
}

export function Divider({ className = '' }) {
  return <hr className={`border-0 border-t border-line ${className}`} />
}

export default { Button, Card, SectionHeading, Chip, StatusDot, Stat, Divider }
