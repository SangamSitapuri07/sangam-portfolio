import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveSiteUrl, socialMetadata } from '../../scripts/site-metadata.mjs'
import { PERSONAL } from '../../src/data/personal.js'

const template = '<head><meta property="og:image" content="/assets/og-image.png" /></head>'

test('deployment origin is explicit or platform-provided, never invented', () => {
  assert.equal(resolveSiteUrl({}), null)
  assert.equal(resolveSiteUrl({ PUBLIC_SITE_URL: 'https://portfolio.test/' }), 'https://portfolio.test')
  assert.equal(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'portfolio.test' }), 'https://portfolio.test')
  assert.equal(resolveSiteUrl({ URL: 'https://portfolio.test' }), 'https://portfolio.test')
  for (const value of ['https://user:secret@portfolio.test', 'javascript:alert(1)', 'https://portfolio.test/path', 'https://portfolio.test?token=secret']) {
    assert.throws(() => resolveSiteUrl({ PUBLIC_SITE_URL: value }))
  }
})

test('release metadata uses the real profile and absolute social URLs when known', () => {
  const html = socialMetadata(template, 'https://portfolio.test', PERSONAL)
  assert(html.includes('href="https://portfolio.test/"'))
  assert(html.includes('content="https://portfolio.test/assets/og-image.png"'))
  const data = JSON.parse(html.match(/application\/ld\+json">(.*?)<\/script>/)[1])
  assert.equal(data.name, 'Sangam Sitapuri')
  assert(data.sameAs.includes(PERSONAL.contact.github))
  assert.equal(data.email, `mailto:${PERSONAL.contact.email}`)
  const withoutOrigin = socialMetadata(template, null, PERSONAL)
  assert(!withoutOrigin.includes('rel="canonical"'))
})

test('editable text cannot escape the JSON-LD script element', () => {
  const html = socialMetadata(template, null, { ...PERSONAL, name: '</script><script>bad()</script>' })
  assert(!html.includes('<script>bad()'))
  assert(html.includes('\\u003c/script>'))
})
