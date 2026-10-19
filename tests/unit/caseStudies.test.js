import test from 'node:test'
import assert from 'node:assert/strict'
import { CASE_STUDY_PROJECT_IDS, CASE_STUDY_TABS, getCaseStudy } from '../../src/data/caseStudies.js'
import { getProjectById } from '../../src/data/projects.js'
import { sampleStory } from '../../src/animation/storyboard.js'
import { storyRuntime } from '../../src/animation/runtime.js'

test('each selectable case study has its own source-backed content and architecture', () => {
  assert.deepEqual(CASE_STUDY_PROJECT_IDS, ['ai-debate-coach', 'nuno', 'news-pinch'])
  for (const id of CASE_STUDY_PROJECT_IDS) {
    const study = getCaseStudy(id)
    assert(getProjectById(id))
    for (const tab of CASE_STUDY_TABS) assert(study[tab.id]?.length > 30)
    assert.equal(study.architecture.length, 3)
    assert(study.source)
    assert.equal(study.personalChallenge, null)
  }
  assert.match(getCaseStudy('nuno').implementation, /TypeScript/)
  assert.match(getCaseStudy('news-pinch').implementation, /Kotlin/)
  assert.equal(getCaseStudy('unknown'), null)
  assert.equal(getCaseStudy('toString'), null)
})

test('the deep-dive selection changes screen content without changing cinematic transforms', () => {
  const a = sampleStory(.57, false, 'ai-debate-coach')
  const b = sampleStory(.57, false, 'nuno')
  assert.equal(a.projectId, 'ai-debate-coach')
  assert.equal(b.projectId, 'nuno')
  assert.deepEqual({ ...a, projectId: null }, { ...b, projectId: null })
  assert.equal(sampleStory(.57, false, 'missing').projectId, 'ai-debate-coach')
  assert.equal(sampleStory(.411, false, 'nuno').projectId, 'ai-debate-coach')
})

test('camera, laptop, and core reuse one sampled frame until a real input changes', () => {
  storyRuntime.setProgress(.57)
  storyRuntime.setFeaturedProject('ai-debate-coach')
  const first = storyRuntime.getFrame(false)
  assert.equal(storyRuntime.getFrame(false), first)
  storyRuntime.setFeaturedProject('nuno')
  const second = storyRuntime.getFrame(false)
  assert.notEqual(second, first)
  assert.equal(second.projectId, 'nuno')
  assert.equal(storyRuntime.getFrame(false), second)
  assert.notEqual(storyRuntime.getFrame(true), second)
  storyRuntime.setFeaturedProject('ai-debate-coach')
  storyRuntime.setProgress(0)
})
