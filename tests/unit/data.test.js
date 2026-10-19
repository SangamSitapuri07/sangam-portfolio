import test from 'node:test'
import assert from 'node:assert/strict'
import { PERSONAL } from '../../src/data/personal.js'
import { PROJECTS, FEATURED_PROJECTS, getProjectById } from '../../src/data/projects.js'
import { SKILLS } from '../../src/data/skills.js'
import { LAPTOP_ASSET } from '../../src/config/assets.js'
import { supportsWebGL2 } from '../../src/utils/webgl.js'

test('identity and contact details match the supplied CV', () => {
  assert.equal(PERSONAL.name, 'Sangam Sitapuri')
  assert.equal(PERSONAL.contact.email, 'sitapurisangampac@gmail.com')
  assert.equal(new URL(PERSONAL.contact.linkedin).pathname, '/in/sangam-sitapuri')
  assert.equal(new URL(PERSONAL.contact.linkedin).protocol, 'https:')
  assert.equal(PERSONAL.resume, '/assets/sangamcv.pdf')
  assert.equal(PERSONAL.education.cgpa, '8.52')
  assert.equal(PERSONAL.education.institution, 'Lovely Professional University')
  assert.equal(new URL(PERSONAL.contact.github).pathname, '/SangamSitapuri07')
})

test('featured work has unique IDs and valid, verified GitHub links', () => {
  assert.equal(new Set(PROJECTS.map(({ id }) => id)).size, PROJECTS.length)
  assert.equal(FEATURED_PROJECTS.length, 3)
  for (const project of FEATURED_PROJECTS) {
    assert.equal(new URL(project.links.github).hostname, 'github.com')
    assert(project.technologies.length > 0)
    assert(project.summary.length < 200)
    assert(!JSON.stringify(project).includes('your-'))
    assert.equal(getProjectById(project.id), project)
  }
  assert.equal(getProjectById('missing'), undefined)
})

test('four skill categories contain content rather than proficiency claims', () => {
  assert.deepEqual(SKILLS.map(({ id }) => id), ['frontend', 'backend', 'programming', 'development'])
  assert(SKILLS.every(({ items }) => items.length > 0))
  assert(!JSON.stringify(SKILLS).includes('proficiency'))
})

test('assets use relative URLs that work through the live preview', () => {
  assert(LAPTOP_ASSET.url.startsWith('/models/'))
  assert(LAPTOP_ASSET.poster.startsWith('/images/'))
  assert.equal(LAPTOP_ASSET.attribution.license, 'CC BY 4.0')
})

test('WebGL detection safely falls back outside the browser', () => {
  assert.equal(supportsWebGL2(), false)
})
