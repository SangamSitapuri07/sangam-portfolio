import { ArrowUpRight, Download } from 'lucide-react'

export default function ActionLink({ href, children, variant = 'secondary', external = false, download, className = '' }) {
  if (!href) return null
  const Icon = download ? Download : ArrowUpRight
  const linkProps = download
    ? { download }
    : external ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <a href={href} className={`action-link action-link--${variant} ${className}`} {...linkProps}>
      <span>{children}</span>
      <Icon size={17} aria-hidden="true" />
    </a>
  )
}
