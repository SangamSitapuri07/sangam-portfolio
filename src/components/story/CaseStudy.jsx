import { Fragment, useId, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { CASE_STUDY_PROJECT_IDS, CASE_STUDY_TABS, getCaseStudy } from '../../data/caseStudies.js'
import { getProjectById } from '../../data/projects.js'
import './CaseStudy.css'
import ProjectMedia from './ProjectMedia.jsx'

export default function CaseStudy({ project, onOpen, onSelect }) {
  const [active, setActive] = useState('problem')
  const references = useRef([])
  const prefix = useId()
  const study = getCaseStudy(project.id)
  if (!study) return null

  function move(event, index) {
    let target
    if (event.key === 'ArrowRight') target = (index + 1) % CASE_STUDY_TABS.length
    if (event.key === 'ArrowLeft') target = (index + CASE_STUDY_TABS.length - 1) % CASE_STUDY_TABS.length
    if (event.key === 'Home') target = 0
    if (event.key === 'End') target = CASE_STUDY_TABS.length - 1
    if (target === undefined) return
    event.preventDefault()
    setActive(CASE_STUDY_TABS[target].id)
    references.current[target]?.focus()
  }

  return (
    <>
      <div className="case-project-picker">
        <label htmlFor={`${prefix}-project`}><span>CHOOSE A SYSTEM</span><span>Follow the problem through the implementation.</span></label>
        <select id={`${prefix}-project`} aria-label="Choose a project to examine" value={project.id} onChange={(event) => { setActive('problem'); onSelect(event.target.value) }}>
          {CASE_STUDY_PROJECT_IDS.map((id) => <option key={id} value={id}>{getProjectById(id).title}</option>)}
        </select>
      </div>
      <div className="case-study-layout" data-selected-project={project.id}>
        <div className="case-study-visual">
          <ProjectMedia project={project} variant="case" pipelineLabel={study.pipelineLabel} />
          <div className="architecture-flow" aria-label={`${project.title} architecture`}>
            {study.architecture.map((node, index) => <Fragment key={node}>{index > 0 && <i aria-hidden="true">→</i>}<span>{node}</span></Fragment>)}
          </div>
        </div>
        <div className="case-study-copy">
          <p className="micro-label">PROJECT CASE STUDY</p><h3>{project.title}</h3>
          <p className="case-role">{project.role || study.subtitle}</p>
          <p className="sr-only" role="status">{project.title} case study selected.</p>
          <div className="case-tabs" role="tablist" aria-label={`${project.title} case study`}>
            {CASE_STUDY_TABS.map((tab, index) => <button key={tab.id} ref={(element) => { references.current[index] = element }} id={`${prefix}-tab-${tab.id}`} type="button" role="tab" aria-selected={active === tab.id} aria-controls={`${prefix}-panel-${tab.id}`} tabIndex={active === tab.id ? 0 : -1} onClick={() => setActive(tab.id)} onKeyDown={(event) => move(event, index)}>{tab.label}</button>)}
          </div>
          {CASE_STUDY_TABS.map((tab) => <div key={tab.id} className="case-tab-panel" role="tabpanel" id={`${prefix}-panel-${tab.id}`} aria-labelledby={`${prefix}-tab-${tab.id}`} hidden={active !== tab.id} tabIndex={0}><p>{study[tab.id]}</p></div>)}
          <ul className="tech-tags" aria-label={`${project.title} case study technologies`}>{project.technologies.map((technology) => <li key={technology}>{technology}</li>)}</ul>
          <div className="case-actions">{project.links.live && <a href={project.links.live} target="_blank" rel="noopener noreferrer">{project.demoLabel === 'Live demo' ? 'Visit live project' : project.demoLabel}<ArrowUpRight size={16} aria-hidden="true" /></a>}<button type="button" onClick={() => onOpen(project.id)}>Full case study<ArrowUpRight size={16} aria-hidden="true" /></button></div>
        </div>
      </div>
    </>
  )
}
