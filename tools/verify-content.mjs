/**
 * Content + config contract test (development tool, not shipped).
 *
 * The site's copy lives in plain data modules and its behaviour in config
 * modules. A typo in either — `profile.specialtys`, `loader.minDisplayTime` —
 * produces no build error and no type error; it produces `undefined` at runtime,
 * which on this site means a blank section or a dead loader.
 *
 * Two passes:
 *   1. Explicit assertions for every value on the critical path, with the
 *      intended shape checked — including the colour-format constraint, since
 *      the UI appends hex alpha to accent values (`${accent}2e`).
 *   2. A static sweep: every `data.<key>` access found in src/**\/*.{js,jsx} is
 *      cross-checked against the module's real exports, so anything the first
 *      pass forgot still fails loudly.
 *
 *   node tools/verify-content.mjs
 */

import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const srcDir = path.join(root, 'src')

let checks = 0
const failures = []
const HEX = /^#[0-9a-f]{6}$/i
const isHex = (value) => typeof value === 'string' && HEX.test(value)

const at = (object, dotted) =>
  dotted.split('.').reduce((value, key) => (value == null ? undefined : value[key]), object)

function has(module, dotted, { type, min, expect, label, optional } = {}) {
  checks += 1
  const value = at(module, dotted)
  if (optional && (value === undefined || value === null)) return true
  let ok = value !== undefined && value !== null

  if (ok && type === 'string') ok = typeof value === 'string' && value.trim().length > 0
  if (ok && type === 'number') ok = typeof value === 'number' && Number.isFinite(value)
  if (ok && type === 'color') ok = isHex(value)
  if (ok && type === 'array') ok = Array.isArray(value) && value.length > 0 && (!min || value.length >= min)
  if (ok && type === 'object') ok = typeof value === 'object' && !Array.isArray(value)
  if (ok && type === 'nullable') ok = true
  if (ok && expect) ok = Boolean(expect(value))

  if (!ok) {
    const shown = value === undefined ? 'undefined' : JSON.stringify(value)?.slice(0, 64)
    failures.push(`${(label ?? dotted).padEnd(52)} →  ${shown}`)
  }
  return ok
}

const load = async (relative) => import(pathToFileURL(path.join(srcDir, relative)).href)

/* ------------------------------------------------------------------ data */
const { profile: person } = await load('data/profile.js')
const projectsModule = await load('data/projects.js')
const skillsModule = await load('data/skills.js')
const timelineModule = await load('data/timeline.js')

const { projects, moreOnGitHub } = projectsModule
const { skillCategories } = skillsModule
const { timeline, achievements } = timelineModule

console.log('\n▸ identity')
for (const key of ['name', 'initials', 'role', 'tagline', 'status', 'location.full']) {
  has(person, key, { type: 'string' })
}
has(person, 'specialties', { type: 'array', min: 3 })
has(person, 'facts', { type: 'array', min: 3 })

console.log('▸ about / closing / contact / education')
has(person, 'about.headline', { type: 'string' })
has(person, 'about.intro', { type: 'string' })
has(person, 'about.facts', { type: 'array', min: 2 })
has(person, 'about.footer', { type: 'array', min: 1 })
has(person, 'closing.title', { type: 'string' })
has(person, 'closing.subtitle', { type: 'string' })
has(person, 'closing.primaryCta', { type: 'string' })
has(person, 'closing.secondaryCta', { type: 'string' })
has(person, 'contact.email', { type: 'string', expect: (v) => v.includes('@') })
has(person, 'contact.github', { type: 'string', expect: (v) => v.startsWith('https://') })
has(person, 'contact.githubHandle', { type: 'string' })
has(person, 'contact.linkedin', { type: 'string', expect: (v) => v.startsWith('https://') })
has(person, 'contact.linkedinHandle', { type: 'string' })
has(person, 'resume.href', { type: 'string', expect: (v) => v.startsWith('/') })
has(person, 'resume.label', { type: 'string' })
has(person, 'resume.meta', { type: 'string' })
has(person, 'education.institution', { type: 'string' })
has(person, 'education.degree', { type: 'string' })
has(person, 'education.cgpa', { type: 'string' })

console.log('▸ projects')
has(projectsModule, 'projects', { type: 'array', min: 5 })
has(projectsModule, 'moreOnGitHub', { type: 'array', min: 3 })
projects.forEach((project) => {
  const where = `projects[${project.index}]`
  for (const key of ['id', 'index', 'name', 'subtitle', 'year', 'tagline', 'summary', 'role']) {
    has(project, key, { type: 'string', label: `${where}.${key}` })
  }
  has(project, 'tech', { type: 'array', min: 2, label: `${where}.tech` })
  has(project, 'highlights', { type: 'array', min: 2, label: `${where}.highlights` })
  has(project, 'stats', { type: 'array', label: `${where}.stats` })
  has(project, 'cover.from', { type: 'color', label: `${where}.cover.from` })
  has(project, 'cover.via', { type: 'color', label: `${where}.cover.via` })
  has(project, 'cover.to', { type: 'color', label: `${where}.cover.to` })
  has(project, 'cover.mark', { type: 'string', label: `${where}.cover.mark` })
  has(project, 'screen.accent', { type: 'color', label: `${where}.screen.accent` })
  has(project, 'screen.mode', {
    type: 'string',
    label: `${where}.screen.mode`,
    // 'editor' is the documented alias for the component-tree diagram
    expect: (v) => ['map', 'terminal', 'arena', 'mobile', 'editor', 'default'].includes(v),
  })
  has(project, 'links.github', { type: 'string', expect: (v) => v.startsWith('https://'), label: `${where}.links.github` })
  has(project, 'links.extra', { type: 'object', optional: true, label: `${where}.links.extra` })
  has(project, 'links.live', {
    type: 'string',
    optional: true,
    expect: (v) => v.startsWith('https://'),
    label: `${where}.links.live`,
  })
  project.stats.forEach((stat, index) => {
    has(stat, 'label', { type: 'string', label: `${where}.stats[${index}].label` })
    has(stat, 'value', { type: 'string', label: `${where}.stats[${index}].value` })
  })
})
moreOnGitHub.forEach((repo, index) => {
  has(repo, 'name', { type: 'string', label: `moreOnGitHub[${index}].name` })
  has(repo, 'description', { type: 'string', label: `moreOnGitHub[${index}].description` })
  has(repo, 'href', { type: 'string', expect: (v) => v.startsWith('https://'), label: `moreOnGitHub[${index}].href` })
})

console.log('▸ skills')
has(skillsModule, 'skillCategories', { type: 'array', min: 4 })
skillCategories.forEach((category) => {
  const where = `skillCategories[${category.id ?? '?'}]`
  for (const key of ['id', 'title', 'note']) has(category, key, { type: 'string', label: `${where}.${key}` })
  has(category, 'accent', { type: 'color', label: `${where}.accent` })
  has(category, 'items', { type: 'array', min: 3, label: `${where}.items` })
  has(category, 'also', { type: 'array', label: `${where}.also` })
})

console.log('▸ timeline + achievements')
has(timelineModule, 'timeline', { type: 'array', min: 9 })
timeline.forEach((entry, index) => {
  const where = `timeline[${index}]`
  for (const key of ['id', 'kind', 'period', 'title', 'organisation', 'detail']) {
    has(entry, key, { type: 'string', label: `${where}.${key}` })
  }
  has(entry, 'tags', { type: 'array', label: `${where}.tags` })
  has(entry, 'link', { type: 'object', optional: true, label: `${where}.link` })
})
has(timelineModule, 'achievements', { type: 'array', min: 2 })
achievements.forEach((item, index) => {
  has(item, 'value', { type: 'string', label: `achievements[${index}].value` })
  has(item, 'label', { type: 'string', label: `achievements[${index}].label` })
  has(item, 'detail', { type: 'string', label: `achievements[${index}].detail` })
})
has(timelineModule, 'education', { type: 'object' })

/* ---------------------------------------------------------- config values */
const animation = await load('config/animation.js')
const quality = await load('config/quality.js')
const laptop = await load('config/laptop.js')
const scenes = await load('config/scenes.js')

console.log('▸ animation + quality config')
for (const key of ['minDisplayMs', 'maxRatePerSecond', 'settleMs', 'fadeMs']) {
  has(animation, `loader.${key}`, { type: 'number', expect: (v) => v > 0 })
}
for (const key of ['damping', 'scrub', 'overlay', 'easing', 'scroll', 'reducedMotion']) {
  has(animation, key, { type: 'object' })
}
has(animation, 'reducedMotion.cameraTravelScale', { type: 'number' })
has(quality, 'autoTune', { type: 'object' })
has(quality, 'autoTune.sampleFrames', { type: 'number', expect: (v) => v > 10 })
has(quality, 'autoTune.slowFrameMs', { type: 'number', expect: (v) => v > 16 })
has(quality, 'dprCeiling.mobile', { type: 'number', expect: (v) => v <= 1.5 })
has(quality, 'dprCeiling.desktop', { type: 'number', expect: (v) => v <= 2 })
for (const tier of ['high', 'medium', 'low']) has(quality, `tiers.${tier}`, { type: 'object' })

console.log('▸ laptop rig config')
for (const key of ['y', 'z', 'closedAngle', 'openAngle', 'liftSettle']) {
  has(laptop, `hinge.${key}`, { type: 'number' })
}
has(laptop, 'screens.main.node', { type: 'string', expect: (v) => v.startsWith('Object_') })
has(laptop, 'screens.status.node', { type: 'string', expect: (v) => v.startsWith('Object_') })
has(laptop, 'parts.base', { type: 'array', min: 1 })
has(laptop, 'parts.lid', { type: 'array', min: 1 })
has(laptop, 'parallax', { type: 'object' })

console.log('▸ scene storyboard')
has(scenes, 'scenes', { type: 'array', min: 7 })
has(scenes, 'navSections', { type: 'array', min: 5 })
has(scenes, 'overlayTiming', { type: 'object' })
for (const key of ['enterFraction', 'holdFraction', 'exitFraction']) {
  has(scenes, `overlayTiming.${key}`, { type: 'number' })
}
scenes.scenes.forEach((scene) => {
  const where = `scenes[${scene.id ?? '?'}]`
  for (const key of ['id', 'name', 'height']) has(scene, key, { type: key === 'height' ? 'number' : 'string', label: `${where}.${key}` })
  has(scene, 'nav', { type: 'object', optional: true, label: `${where}.nav` })
  has(scene, 'lid', {
    type: 'number',
    label: `${where}.lid`,
    expect: (v) => v >= 0 && v <= 1,
  })
  has(scene, 'screen.section', { type: 'string', label: `${where}.screen.section` })
  for (const key of ['camera', 'cameraMobile', 'laptop', 'light']) {
    has(scene, key, { type: 'object', label: `${where}.${key}` })
  }
  has(scene, 'overlay.anchor', { type: 'string', label: `${where}.overlay.anchor` })
})
scenes.navSections.forEach((section, index) => {
  has(section, 'label', { type: 'string', label: `navSections[${index}].label` })
  has(section, 'id', { type: 'string', label: `navSections[${index}].id` })
})

/* ---------------------------------------------- static sweep for typos */
const SWEEP_NAMES = ['profile', 'projects', 'skillCategories', 'timeline']
const exportedKeys = {
  profile: Object.keys(person),
  projects: Object.keys(projectsModule),
  skillCategories: Object.keys(skillsModule),
  timeline: Object.keys(timelineModule),
}
const ARRAY_METHODS = new Set([
  'find', 'filter', 'map', 'forEach', 'slice', 'splice', 'flatMap', 'reduce', 'reduceRight',
  'some', 'every', 'sort', 'reverse', 'join', 'includes', 'indexOf', 'lastIndexOf', 'at',
  'concat', 'push', 'pop', 'shift', 'unshift', 'fill', 'findIndex', 'findLast', 'entries',
  'keys', 'values', 'length', 'toString', 'toLocaleString', 'flat',
])

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else if (/\.(js|jsx)$/.test(entry.name)) files.push(full)
  }
  return files
}

let swept = 0
for (const file of await walk(srcDir)) {
  const code = await readFile(file, 'utf8')
  const relative = path.relative(root, file)
  const pattern = new RegExp(`\\b(${SWEEP_NAMES.join('|')})\\.([A-Za-z_$][\\w$]*)`, 'g')
  for (const match of code.matchAll(pattern)) {
    const [, moduleName, key] = match
    if (ARRAY_METHODS.has(key)) continue
    const known = exportedKeys[moduleName]
    if (!known) continue
    swept += 1
    if (!known.includes(key)) {
      failures.push(`${relative}: ${moduleName}.${key} — not exported by the data module`)
    }
  }
}

/* ------------------------------------------------------------------ report */
checks += swept
console.log(
  `\n▸ ${checks} assertions · ${swept} data reads cross-checked · ` +
    `${failures.length ? `${failures.length} FAILED` : 'all good'}`
)
if (failures.length) {
  console.log('\n✗ failures')
  for (const failure of [...new Set(failures)]) console.log(`  · ${failure}`)
  process.exitCode = 1
} else {
  console.log('✓ content contract holds\n')
}
