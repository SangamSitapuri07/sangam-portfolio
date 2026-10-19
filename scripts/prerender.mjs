import { createServer } from 'vite'
import { readFile, writeFile } from 'node:fs/promises'
import { resolveSiteUrl, socialMetadata } from './site-metadata.mjs'
import { PERSONAL } from '../src/data/personal.js'

// Ship all ten semantic chapters as real HTML. The client starts in the same
// reading state, hydrates, then progressively enables the cinematic renderer.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { render } = await server.ssrLoadModule('/src/entry-server.jsx')
  const document = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
  const siteUrl = resolveSiteUrl()
  const html = socialMetadata(document.replace('<div id="root"></div>', `<div id="root">${render()}</div>`), siteUrl, PERSONAL)
  await writeFile(new URL('../dist/index.html', import.meta.url), html)
  await writeFile(new URL('../dist/robots.txt', import.meta.url), `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`)
  if (siteUrl) {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url></urlset>`
    await writeFile(new URL('../dist/sitemap.xml', import.meta.url), sitemap)
  }
  console.log('Prerendered all ten narrative chapters, project links, credentials, and contacts.')
} finally {
  await server.close()
}
