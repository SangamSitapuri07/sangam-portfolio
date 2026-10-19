export function resolveSiteUrl(environment = process.env) {
  const value = environment.PUBLIC_SITE_URL || environment.VERCEL_PROJECT_PRODUCTION_URL || environment.URL
  if (!value) return null
  const url = new URL(value.includes('://') ? value : `https://${value}`)
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) {
    throw new Error('PUBLIC_SITE_URL must be a public HTTP(S) site origin without credentials, query, hash, or subpath.')
  }
  return url.origin
}

export function socialMetadata(html, siteUrl, personal) {
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: personal.name,
    jobTitle: personal.title,
    ...(siteUrl ? { url: siteUrl } : {}),
    sameAs: [personal.contact.github, personal.contact.linkedin].filter(Boolean),
    email: `mailto:${personal.contact.email}`,
  }
  let additions = '<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />'
  if (siteUrl) {
    const image = `${siteUrl}/assets/og-image.png`
    html = html.replace('content="/assets/og-image.png"', `content="${image}"`)
    additions += `<link rel="canonical" href="${siteUrl}/" /><meta property="og:url" content="${siteUrl}/" /><meta name="twitter:image" content="${image}" />`
  }
  additions += `<script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>`
  return html.replace('</head>', `${additions}</head>`)
}
